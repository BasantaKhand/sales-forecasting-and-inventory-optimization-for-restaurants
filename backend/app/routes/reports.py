"""Reports routes.

Endpoints (implemented in Prompt 6):
    GET /api/reports/revenue
    GET /api/reports/top-items
    GET /api/reports/trends
    GET /api/reports/category-performance
    GET /api/reports/overview
"""
from flask import Blueprint, jsonify

reports_bp = Blueprint("reports", __name__)


@reports_bp.route("/ping", methods=["GET"])
def ping():
    """Placeholder health route for the reports blueprint."""
    return jsonify({"blueprint": "reports", "status": "ready"})


# TODO(Prompt 6): implement revenue/top-items/trends/category/overview
