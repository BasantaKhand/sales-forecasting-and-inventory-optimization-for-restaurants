"""Sales routes.

Endpoints:
    GET  /api/sales             -> paginated, filterable list of sales rows
    GET  /api/sales/summary     -> aggregate revenue / orders / top items
    POST /api/sales/import-csv  -> bulk import the dataset CSV
    GET  /api/sales/daily-totals-> daily revenue and order counts (for charts)
"""
import io

import pandas as pd
from flask import Blueprint, request

from ..models.sale import COLLECTION, CSV_COLUMNS
from ..utils.auth_middleware import token_required
from ..utils.helpers import error, get_db, parse_date, serialize_doc, success

sales_bp = Blueprint("sales", __name__)

BATCH_SIZE = 5000

# Numeric columns that should be coerced to numbers on import.
_INT_COLUMNS = [
    "year", "month", "day", "day_of_week", "quantity",
    "is_weekend", "is_holiday", "num_customers_today",
]
_FLOAT_COLUMNS = ["unit_price_npr", "total_price_npr", "temperature_celsius"]


def _build_filter(args):
    """Build a MongoDB query dict from request query params."""
    query = {}

    category = args.get("category")
    if category:
        query["category"] = category

    meal_period = args.get("meal_period")
    if meal_period:
        query["meal_period"] = meal_period

    item_name = args.get("item_name")
    if item_name:
        # case-insensitive "contains" search
        query["item_name"] = {"$regex": item_name, "$options": "i"}

    start = parse_date(args.get("start_date"))
    end = parse_date(args.get("end_date"))
    if start or end:
        date_q = {}
        if start:
            date_q["$gte"] = start
        if end:
            date_q["$lte"] = end
        query["date"] = date_q

    return query


@sales_bp.route("", methods=["GET"])
@sales_bp.route("/", methods=["GET"])
@token_required
def list_sales():
    """Return a paginated, filtered list of sales rows."""
    db = get_db()
    args = request.args

    try:
        page = max(int(args.get("page", 1)), 1)
        limit = min(max(int(args.get("limit", 25)), 1), 500)
    except ValueError:
        return error("page and limit must be integers", 400)

    sort_by = args.get("sort_by", "date")
    sort_order = -1 if args.get("sort_order", "desc").lower() == "desc" else 1

    query = _build_filter(args)
    collection = db[COLLECTION]

    total = collection.count_documents(query)
    cursor = (
        collection.find(query)
        .sort(sort_by, sort_order)
        .skip((page - 1) * limit)
        .limit(limit)
    )
    data = [serialize_doc(doc) for doc in cursor]

    return success(
        data=data,
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit,
    )


@sales_bp.route("/summary", methods=["GET"])
@token_required
def summary():
    """Return aggregated revenue, order and top-item statistics."""
    db = get_db()
    args = request.args
    match = _build_filter(args)

    pipeline = [
        {"$match": match} if match else {"$match": {}},
        {
            "$facet": {
                "totals": [
                    {
                        "$group": {
                            "_id": None,
                            "total_revenue": {"$sum": "$total_price_npr"},
                            "total_quantity": {"$sum": "$quantity"},
                        }
                    }
                ],
                "orders": [
                    {"$group": {"_id": "$order_id"}},
                    {"$count": "count"},
                ],
                "top_items": [
                    {
                        "$group": {
                            "_id": "$item_name",
                            "total_qty": {"$sum": "$quantity"},
                            "total_revenue": {"$sum": "$total_price_npr"},
                        }
                    },
                    {"$sort": {"total_revenue": -1}},
                    {"$limit": 10},
                    {
                        "$project": {
                            "_id": 0,
                            "item_name": "$_id",
                            "total_qty": 1,
                            "total_revenue": 1,
                        }
                    },
                ],
            }
        },
    ]

    result = list(db[COLLECTION].aggregate(pipeline))
    facet = result[0] if result else {}

    totals = facet.get("totals") or [{}]
    total_revenue = totals[0].get("total_revenue", 0) or 0
    total_quantity = totals[0].get("total_quantity", 0) or 0

    orders = facet.get("orders") or [{}]
    total_orders = orders[0].get("count", 0) or 0

    avg_order_value = (
        round(total_revenue / total_orders, 2) if total_orders else 0
    )

    return success(
        period=args.get("period", "all"),
        total_revenue=round(total_revenue, 2),
        total_orders=total_orders,
        total_quantity=total_quantity,
        avg_order_value=avg_order_value,
        top_items=facet.get("top_items", []),
    )


@sales_bp.route("/daily-totals", methods=["GET"])
@token_required
def daily_totals():
    """Return per-day revenue and (distinct) order counts."""
    db = get_db()
    match = _build_filter(request.args)

    pipeline = [
        {"$match": match} if match else {"$match": {}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$date"}
                },
                "revenue": {"$sum": "$total_price_npr"},
                "quantity": {"$sum": "$quantity"},
                "orders": {"$addToSet": "$order_id"},
            }
        },
        {
            "$project": {
                "_id": 0,
                "date": "$_id",
                "revenue": {"$round": ["$revenue", 2]},
                "quantity": "$quantity",
                "order_count": {"$size": "$orders"},
            }
        },
        {"$sort": {"date": 1}},
    ]

    data = list(db[COLLECTION].aggregate(pipeline))
    return success(data=data, count=len(data))


@sales_bp.route("/import-csv", methods=["POST"])
@token_required
def import_csv():
    """Parse an uploaded CSV and bulk-insert rows into the sales collection."""
    if "file" not in request.files:
        return error("No file uploaded (expected form field 'file')", 400)

    file = request.files["file"]
    if not file.filename:
        return error("Empty filename", 400)

    try:
        raw = file.read()
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:  # noqa: BLE001 - report parse errors to client
        return error(f"Failed to parse CSV: {exc}", 400)

    missing = [c for c in CSV_COLUMNS if c not in df.columns]
    if missing:
        return error(f"CSV missing required columns: {missing}", 400)

    # --- Type coercion ---
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    for col in _INT_COLUMNS:
        df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")
    for col in _FLOAT_COLUMNS:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Keep only known columns and turn NaN/NaT into None for Mongo.
    df = df[CSV_COLUMNS].astype(object).where(pd.notnull(df[CSV_COLUMNS]), None)

    collection = db_collection()
    inserted = 0
    batch = []
    for record in df.to_dict("records"):
        # Convert pandas Int64 (numpy) scalars to plain python ints.
        for col in _INT_COLUMNS:
            if record[col] is not None:
                record[col] = int(record[col])
        batch.append(record)
        if len(batch) >= BATCH_SIZE:
            collection.insert_many(batch)
            inserted += len(batch)
            batch = []
    if batch:
        collection.insert_many(batch)
        inserted += len(batch)

    return success(message=f"Imported {inserted} records successfully",
                   imported=inserted, status=201)


def db_collection():
    """Return the sales collection for the active app context."""
    return get_db()[COLLECTION]
