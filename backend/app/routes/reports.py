"""Reports routes.

Endpoints:
    GET /api/reports/revenue              -> revenue breakdown + growth
    GET /api/reports/top-items            -> top items by revenue and quantity
    GET /api/reports/trends               -> day/month/festival/weather patterns
    GET /api/reports/category-performance -> per-category KPIs + MoM growth
    GET /api/reports/overview             -> quick YTD summary
"""
from flask import Blueprint, request

from ..models.sale import COLLECTION as SALES
from ..utils.auth_middleware import token_required
from ..utils.helpers import error, get_db, success

reports_bp = Blueprint("reports", __name__)

# MongoDB $dateToString group keys per period.
_PERIOD_FORMAT = {
    "daily": "%Y-%m-%d",
    "weekly": "%G-W%V",
    "monthly": "%Y-%m",
}


def _sales():
    return get_db()[SALES]


def _year_match(args):
    """Return a $match dict filtering on the ``year`` field if provided."""
    year = args.get("year")
    if year:
        try:
            return {"year": int(year)}
        except ValueError:
            pass
    return {}


@reports_bp.route("/revenue", methods=["GET"])
@token_required
def revenue():
    """Revenue broken down by day/week/month with period-over-period growth."""
    args = request.args
    period = args.get("period", "monthly").lower()
    fmt = _PERIOD_FORMAT.get(period, _PERIOD_FORMAT["monthly"])
    match = _year_match(args)

    pipeline = [
        {"$match": match} if match else {"$match": {}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": fmt, "date": "$date"}},
                "revenue": {"$sum": "$total_price_npr"},
                "orders": {"$addToSet": "$order_id"},
            }
        },
        {
            "$project": {
                "_id": 0,
                "label": "$_id",
                "revenue": {"$round": ["$revenue", 2]},
                "order_count": {"$size": "$orders"},
            }
        },
        {"$sort": {"label": 1}},
    ]
    rows = list(_sales().aggregate(pipeline))

    labels, values, orders, aov, growth = [], [], [], [], []
    prev = None
    for row in rows:
        labels.append(row["label"])
        rev = row["revenue"]
        values.append(rev)
        oc = row["order_count"]
        orders.append(oc)
        aov.append(round(rev / oc, 2) if oc else 0)
        if prev is None or prev == 0:
            growth.append(0)
        else:
            growth.append(round((rev - prev) / prev * 100, 2))
        prev = rev

    return success(
        period=period,
        labels=labels,
        values=values,
        orders=orders,
        avg_order_value=aov,
        growth_percentage=growth,
    )


@reports_bp.route("/top-items", methods=["GET"])
@token_required
def top_items():
    """Top items by revenue and by quantity for an optional period."""
    args = request.args
    try:
        limit = min(max(int(args.get("limit", 20)), 1), 100)
    except ValueError:
        limit = 20

    match = _year_match(args)
    month = args.get("month")  # format YYYY-MM
    if month:
        match["$expr"] = {
            "$eq": [
                {"$dateToString": {"format": "%Y-%m", "date": "$date"}},
                month,
            ]
        }

    group = {
        "$group": {
            "_id": "$item_name",
            "total_qty": {"$sum": "$quantity"},
            "total_revenue": {"$sum": "$total_price_npr"},
        }
    }
    project = {
        "$project": {
            "_id": 0,
            "item_name": "$_id",
            "total_qty": 1,
            "total_revenue": {"$round": ["$total_revenue", 2]},
        }
    }

    pipeline = [
        {"$match": match} if match else {"$match": {}},
        {
            "$facet": {
                "by_revenue": [
                    group, {"$sort": {"total_revenue": -1}},
                    {"$limit": limit}, project,
                ],
                "by_quantity": [
                    group, {"$sort": {"total_qty": -1}},
                    {"$limit": limit}, project,
                ],
            }
        },
    ]
    result = list(_sales().aggregate(pipeline))
    facet = result[0] if result else {"by_revenue": [], "by_quantity": []}
    return success(
        by_revenue=facet.get("by_revenue", []),
        by_quantity=facet.get("by_quantity", []),
    )


@reports_bp.route("/trends", methods=["GET"])
@token_required
def trends():
    """Day-of-week, monthly, festival and weather revenue patterns."""
    sales = _sales()

    # --- Day of week (avg daily revenue / orders per weekday) ---
    dow = list(sales.aggregate([
        {"$group": {
            "_id": "$date",
            "revenue": {"$sum": "$total_price_npr"},
            "day_name": {"$first": "$day_name"},
            "dow": {"$first": "$day_of_week"},
            "orders": {"$addToSet": "$order_id"},
        }},
        {"$group": {
            "_id": "$day_name",
            "avg_revenue": {"$avg": "$revenue"},
            "avg_orders": {"$avg": {"$size": "$orders"}},
            "dow": {"$first": "$dow"},
        }},
        {"$sort": {"dow": 1}},
        {"$project": {
            "_id": 0, "day": "$_id",
            "avg_revenue": {"$round": ["$avg_revenue", 2]},
            "avg_orders": {"$round": ["$avg_orders", 1]},
        }},
    ]))

    # --- Monthly pattern (avg daily revenue per calendar month) ---
    monthly = list(sales.aggregate([
        {"$group": {
            "_id": "$date",
            "revenue": {"$sum": "$total_price_npr"},
            "month": {"$first": "$month"},
        }},
        {"$group": {"_id": "$month", "avg_revenue": {"$avg": "$revenue"}}},
        {"$sort": {"_id": 1}},
        {"$project": {
            "_id": 0, "month": "$_id",
            "avg_revenue": {"$round": ["$avg_revenue", 2]},
        }},
    ]))

    # --- Festival impact ---
    festival_daily = list(sales.aggregate([
        {"$group": {
            "_id": "$date",
            "revenue": {"$sum": "$total_price_npr"},
            "festival": {"$first": "$festival_event"},
        }},
        {"$group": {"_id": "$festival", "avg_revenue": {"$avg": "$revenue"}}},
    ]))
    normal = next(
        (r["avg_revenue"] for r in festival_daily if r["_id"] in (None, "None")),
        0,
    )
    festival_impact = []
    for row in festival_daily:
        name = row["_id"]
        if name in (None, "None"):
            continue
        during = row["avg_revenue"]
        impact = ((during - normal) / normal * 100) if normal else 0
        festival_impact.append({
            "festival": name,
            "avg_revenue_during": round(during, 2),
            "avg_revenue_normal": round(normal, 2),
            "impact_percentage": round(impact, 2),
        })
    festival_impact.sort(key=lambda r: r["impact_percentage"], reverse=True)

    # --- Weather impact ---
    weather = list(sales.aggregate([
        {"$group": {
            "_id": "$date",
            "revenue": {"$sum": "$total_price_npr"},
            "weather": {"$first": "$weather"},
            "orders": {"$addToSet": "$order_id"},
        }},
        {"$group": {
            "_id": "$weather",
            "avg_revenue": {"$avg": "$revenue"},
            "avg_orders": {"$avg": {"$size": "$orders"}},
        }},
        {"$sort": {"avg_revenue": -1}},
        {"$project": {
            "_id": 0, "weather": "$_id",
            "avg_revenue": {"$round": ["$avg_revenue", 2]},
            "avg_orders": {"$round": ["$avg_orders", 1]},
        }},
    ]))

    return success(
        day_of_week=dow,
        monthly_pattern=monthly,
        festival_impact=festival_impact,
        weather_impact=weather,
    )


@reports_bp.route("/category-performance", methods=["GET"])
@token_required
def category_performance():
    """Per-category revenue, quantity, average price and MoM growth."""
    args = request.args
    match = _year_match(args)
    sales = _sales()

    totals = list(sales.aggregate([
        {"$match": match} if match else {"$match": {}},
        {"$group": {
            "_id": "$category",
            "total_revenue": {"$sum": "$total_price_npr"},
            "total_quantity": {"$sum": "$quantity"},
            "avg_price": {"$avg": "$unit_price_npr"},
        }},
        {"$sort": {"total_revenue": -1}},
    ]))

    # Month-over-month growth: revenue per category per month.
    monthly = list(sales.aggregate([
        {"$match": match} if match else {"$match": {}},
        {"$group": {
            "_id": {
                "category": "$category",
                "month": {"$dateToString": {"format": "%Y-%m", "date": "$date"}},
            },
            "revenue": {"$sum": "$total_price_npr"},
        }},
        {"$sort": {"_id.month": 1}},
    ]))
    by_cat = {}
    for row in monthly:
        by_cat.setdefault(row["_id"]["category"], []).append(row["revenue"])

    result = []
    for row in totals:
        cat = row["_id"]
        series = by_cat.get(cat, [])
        mom = 0
        if len(series) >= 2 and series[-2]:
            mom = round((series[-1] - series[-2]) / series[-2] * 100, 2)
        result.append({
            "category": cat,
            "total_revenue": round(row["total_revenue"], 2),
            "total_quantity": row["total_quantity"],
            "avg_price": round(row["avg_price"], 2),
            "mom_growth": mom,
        })

    return success(data=result)


@reports_bp.route("/overview", methods=["GET"])
@token_required
def overview():
    """Quick summary KPIs for the latest year of data."""
    sales = _sales()

    latest = sales.find_one({}, sort=[("year", -1)])
    if not latest:
        return success(
            total_revenue_ytd=0, total_orders_ytd=0, unique_items_sold=0,
            busiest_day=None, top_category=None, year=None,
        )
    year = latest["year"]
    match = {"year": year}

    totals = list(sales.aggregate([
        {"$match": match},
        {"$facet": {
            "revenue": [
                {"$group": {"_id": None,
                            "total": {"$sum": "$total_price_npr"}}},
            ],
            "orders": [
                {"$group": {"_id": "$order_id"}}, {"$count": "count"},
            ],
            "items": [
                {"$group": {"_id": "$item_name"}}, {"$count": "count"},
            ],
            "busiest_day": [
                {"$group": {"_id": "$day_name",
                            "rev": {"$sum": "$total_price_npr"}}},
                {"$sort": {"rev": -1}}, {"$limit": 1},
            ],
            "top_category": [
                {"$group": {"_id": "$category",
                            "rev": {"$sum": "$total_price_npr"}}},
                {"$sort": {"rev": -1}}, {"$limit": 1},
            ],
        }},
    ]))
    f = totals[0] if totals else {}

    def _first(key, sub, default=0):
        arr = f.get(key) or []
        return arr[0].get(sub, default) if arr else default

    return success(
        year=year,
        total_revenue_ytd=round(_first("revenue", "total", 0), 2),
        total_orders_ytd=_first("orders", "count", 0),
        unique_items_sold=_first("items", "count", 0),
        busiest_day=_first("busiest_day", "_id", None),
        top_category=_first("top_category", "_id", None),
    )
