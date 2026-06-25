"""Inventory routes.

Endpoints (implemented in Prompt 5):
    GET    /api/inventory
    POST   /api/inventory
    PUT    /api/inventory/<id>
    DELETE /api/inventory/<id>
    GET    /api/inventory/alerts
    POST   /api/inventory/optimize
"""
from flask import Blueprint, jsonify

inventory_bp = Blueprint("inventory", __name__)


@inventory_bp.route("/ping", methods=["GET"])
def ping():
    """Placeholder health route for the inventory blueprint."""
    return jsonify({"blueprint": "inventory", "status": "ready"})


# TODO(Prompt 5): implement CRUD, alerts, optimize
