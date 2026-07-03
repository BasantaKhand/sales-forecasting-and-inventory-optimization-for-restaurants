"""Forecast routes.

Endpoints:
    GET /api/forecast/overall            -> total revenue forecast
    GET /api/forecast/item/<item_name>   -> item demand (quantity) forecast
    GET /api/forecast/category/<category>-> category forecast
    GET /api/forecast/compare            -> Prophet vs ARIMA back-test
    GET /api/forecast/top-demand         -> top predicted-demand items
"""
from urllib.parse import unquote

from flask import Blueprint, request

from ..models.sale import COLLECTION as SALES
from ..services.forecast_service import ForecastService
from ..utils.auth_middleware import token_required
from ..utils.helpers import error, get_db, success

forecast_bp = Blueprint("forecast", __name__)


def _service():
    return ForecastService(get_db())


def _int_arg(name, default):
    try:
        return max(int(request.args.get(name, default)), 1)
    except (TypeError, ValueError):
        return default


@forecast_bp.route("/overall", methods=["GET"])
@token_required
def overall():
    """Forecast total restaurant revenue for the next N days."""
    periods = _int_arg("periods", 30)
    model = request.args.get("model", "prophet")
    result = _service().get_forecast(
        periods=periods, model=model, metric="revenue"
    )
    if "error" in result:
        return error(result["error"], 400)
    return success(**result)


@forecast_bp.route("/item/<path:item_name>", methods=["GET"])
@token_required
def item(item_name):
    """Forecast a specific item's demand (quantity)."""
    name = unquote(item_name)
    periods = _int_arg("periods", 14)
    model = request.args.get("model", "prophet")
    metric = request.args.get("metric", "quantity")
    result = _service().get_forecast(
        item_name=name, periods=periods, model=model, metric=metric
    )
    if "error" in result:
        return error(result["error"], 400)
    return success(item_name=name, **result)


@forecast_bp.route("/category/<path:category>", methods=["GET"])
@token_required
def category(category):
    """Forecast demand/revenue for a whole category."""
    name = unquote(category)
    periods = _int_arg("periods", 30)
    model = request.args.get("model", "prophet")
    metric = request.args.get("metric", "revenue")
    result = _service().get_forecast(
        category=name, periods=periods, model=model, metric=metric
    )
    if "error" in result:
        return error(result["error"], 400)
    return success(category=name, **result)


@forecast_bp.route("/compare", methods=["GET"])
@token_required
def compare():
    """Back-test Prophet vs ARIMA on an item or category."""
    item_name = request.args.get("item")
    category_name = request.args.get("category")
    if item_name:
        item_name = unquote(item_name)
    if category_name:
        category_name = unquote(category_name)

    test_days = _int_arg("periods", 30)
    metric = request.args.get(
        "metric", "quantity" if item_name else "revenue"
    )

    service = _service()
    try:
        df = service.prepare_data(
            item_name=item_name, category=category_name, metric=metric
        )
        result = service.compare_models(df, test_days=test_days)
    except ValueError as exc:
        return error(str(exc), 400)

    return success(
        item=item_name, category=category_name, metric=metric, **result
    )


@forecast_bp.route("/top-demand", methods=["GET"])
@token_required
def top_demand():
    """Forecast demand for the top-selling items and rank the results."""
    periods = _int_arg("periods", 7)
    db = get_db()

    # Top 20 items by historical quantity.
    pipeline = [
        {"$group": {"_id": "$item_name", "total_qty": {"$sum": "$quantity"}}},
        {"$sort": {"total_qty": -1}},
        {"$limit": 20},
    ]
    top_items = [row["_id"] for row in db[SALES].aggregate(pipeline)]

    service = ForecastService(db)
    results = []
    for name in top_items:
        forecast = service.get_forecast(
            item_name=name, periods=periods, model="arima", metric="quantity"
        )
        if not forecast or "error" in forecast:
            continue
        total = sum(forecast["predictions"])
        results.append(
            {
                "item_name": name,
                "predicted_total_demand": round(total, 1),
                "avg_daily": round(total / periods, 1) if periods else 0,
            }
        )

    results.sort(key=lambda r: r["predicted_total_demand"], reverse=True)
    return success(data=results[:10], periods=periods)
