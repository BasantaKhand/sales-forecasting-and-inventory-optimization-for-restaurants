"""Inventory routes.

Endpoints:
    GET    /api/inventory          -> list items with computed status
    POST   /api/inventory          -> add an item
    PUT    /api/inventory/<id>     -> update an item
    DELETE /api/inventory/<id>     -> remove an item
    GET    /api/inventory/alerts   -> items at/below reorder level
    POST   /api/inventory/optimize -> forecast-driven reorder suggestions
"""
from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, request

from ..models.inventory import COLLECTION, compute_status, new_item
from ..services.inventory_service import InventoryService
from ..utils.auth_middleware import token_required
from ..utils.helpers import error, get_db, serialize_doc, success

inventory_bp = Blueprint("inventory", __name__)

_EDITABLE_FIELDS = (
    "item_name", "category", "current_stock", "reorder_level",
    "unit_cost", "supplier", "lead_time_days",
)


def _with_status(doc):
    """Serialize an inventory doc and attach a computed status field."""
    out = serialize_doc(doc)
    out["status"] = compute_status(
        doc.get("current_stock", 0), doc.get("reorder_level", 0)
    )
    return out


def _parse_oid(item_id):
    try:
        return ObjectId(item_id)
    except (InvalidId, TypeError):
        return None


@inventory_bp.route("", methods=["GET"])
@inventory_bp.route("/", methods=["GET"])
@token_required
def list_inventory():
    """Return all inventory items with a computed stock status."""
    db = get_db()
    items = [_with_status(doc) for doc in db[COLLECTION].find().sort("item_name", 1)]
    return success(data=items, total=len(items))


@inventory_bp.route("", methods=["POST"])
@inventory_bp.route("/", methods=["POST"])
@token_required
def add_inventory():
    """Add a new inventory item."""
    data = request.get_json(silent=True) or {}
    item_name = (data.get("item_name") or "").strip()
    category = (data.get("category") or "").strip()
    if not item_name:
        return error("item_name is required", 400)

    try:
        doc = new_item(
            item_name=item_name,
            category=category,
            current_stock=data.get("current_stock", 0),
            reorder_level=data.get("reorder_level", 0),
            unit_cost=data.get("unit_cost", 0),
            supplier=data.get("supplier", ""),
            lead_time_days=data.get("lead_time_days", 1),
        )
    except (TypeError, ValueError):
        return error("Numeric fields must be valid numbers", 400)

    result = get_db()[COLLECTION].insert_one(doc)
    return success(message="Item added", id=str(result.inserted_id), status=201)


@inventory_bp.route("/<item_id>", methods=["PUT"])
@token_required
def update_inventory(item_id):
    """Update one or more fields of an inventory item."""
    oid = _parse_oid(item_id)
    if oid is None:
        return error("Invalid item id", 400)

    data = request.get_json(silent=True) or {}
    updates = {}
    for field in _EDITABLE_FIELDS:
        if field not in data:
            continue
        value = data[field]
        if field in ("current_stock", "reorder_level", "unit_cost"):
            value = float(value)
        elif field == "lead_time_days":
            value = int(value)
        updates[field] = value

    if not updates:
        return error("No valid fields to update", 400)
    updates["updated_at"] = datetime.utcnow()

    result = get_db()[COLLECTION].update_one({"_id": oid}, {"$set": updates})
    if result.matched_count == 0:
        return error("Item not found", 404)
    return success(message="Item updated")


@inventory_bp.route("/<item_id>", methods=["DELETE"])
@token_required
def delete_inventory(item_id):
    """Delete an inventory item."""
    oid = _parse_oid(item_id)
    if oid is None:
        return error("Invalid item id", 400)

    result = get_db()[COLLECTION].delete_one({"_id": oid})
    if result.deleted_count == 0:
        return error("Item not found", 404)
    return success(message="Item deleted")


@inventory_bp.route("/alerts", methods=["GET"])
@token_required
def alerts():
    """Return items at or below their reorder level with stockout estimates."""
    db = get_db()
    service = InventoryService(db)
    result = []
    cursor = db[COLLECTION].find(
        {"$expr": {"$lte": ["$current_stock", "$reorder_level"]}}
    )
    for doc in cursor:
        entry = _with_status(doc)
        entry["days_until_stockout"] = service.days_until_stockout(
            doc.get("current_stock", 0), doc.get("item_name"), days=30
        )
        result.append(entry)
    return success(data=result, total=len(result))


@inventory_bp.route("/optimize", methods=["POST"])
@token_required
def optimize():
    """Return forecast-driven reorder suggestions for all items."""
    periods = int(request.args.get("periods", 7))
    service = InventoryService(get_db())
    suggestions = service.optimize(periods=periods)
    total_cost = round(sum(s["estimated_cost"] for s in suggestions), 2)
    return success(data=suggestions, total=len(suggestions),
                   total_estimated_cost=total_cost)
