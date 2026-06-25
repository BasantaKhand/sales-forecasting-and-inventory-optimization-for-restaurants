"""Sales routes.

Endpoints (implemented in Prompt 3):
    GET  /api/sales
    GET  /api/sales/summary
    POST /api/sales/import-csv
    GET  /api/sales/daily-totals
"""
from flask import Blueprint, jsonify

sales_bp = Blueprint("sales", __name__)


@sales_bp.route("/ping", methods=["GET"])
def ping():
    """Placeholder health route for the sales blueprint."""
    return jsonify({"blueprint": "sales", "status": "ready"})


# TODO(Prompt 3): implement listing, summary, csv import, daily totals
