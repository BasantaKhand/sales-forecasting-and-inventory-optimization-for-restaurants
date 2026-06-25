"""Forecast routes.

Endpoints (implemented in Prompt 5):
    GET /api/forecast/overall
    GET /api/forecast/item/<item_name>
    GET /api/forecast/category/<category>
    GET /api/forecast/compare
    GET /api/forecast/top-demand
"""
from flask import Blueprint, jsonify

forecast_bp = Blueprint("forecast", __name__)


@forecast_bp.route("/ping", methods=["GET"])
def ping():
    """Placeholder health route for the forecast blueprint."""
    return jsonify({"blueprint": "forecast", "status": "ready"})


# TODO(Prompt 5): implement overall/item/category/compare/top-demand
