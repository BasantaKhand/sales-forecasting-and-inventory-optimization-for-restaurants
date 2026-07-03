"""Inventory service: reorder calculation & optimization logic."""
from datetime import timedelta

from ..models.inventory import COLLECTION as INVENTORY
from ..models.sale import COLLECTION as SALES
from .forecast_service import ForecastService


class InventoryService:
    """Reorder-point and forecast-driven optimization calculations."""

    def __init__(self, db):
        self.db = db

    # ------------------------------------------------------------------ #
    def avg_daily_usage(self, item_name, days=30):
        """Average daily quantity sold for an item over the last ``days``."""
        sales = self.db[SALES]
        latest = sales.find_one({"item_name": item_name}, sort=[("date", -1)])
        if not latest:
            return 0.0

        start = latest["date"] - timedelta(days=days)
        pipeline = [
            {"$match": {"item_name": item_name, "date": {"$gte": start}}},
            {"$group": {"_id": None, "total_qty": {"$sum": "$quantity"}}},
        ]
        result = list(sales.aggregate(pipeline))
        total = result[0]["total_qty"] if result else 0
        return round(total / days, 3) if days else 0.0

    def days_until_stockout(self, current_stock, item_name, days=30):
        """Estimated days until stock runs out at recent average usage."""
        usage = self.avg_daily_usage(item_name, days)
        if usage <= 0:
            return None
        return round(current_stock / usage, 1)

    # ------------------------------------------------------------------ #
    def optimize(self, periods=7):
        """Suggest reorder quantities for each item using a demand forecast.

        For every inventory item, forecast the next ``periods`` days of demand
        and compute::

            suggested = daily_demand * lead_time_days * 1.2 - current_stock

        Only items that need reordering (suggested > 0) are returned.
        """
        fs = ForecastService(self.db)
        inventory = self.db[INVENTORY]
        suggestions = []

        for item in inventory.find():
            name = item.get("item_name")
            result = fs.get_forecast(
                item_name=name, periods=periods,
                model="arima", metric="quantity",
            )
            if not result or "error" in result:
                continue

            forecast_7d = sum(result["predictions"])
            daily_demand = forecast_7d / periods if periods else 0
            lead = item.get("lead_time_days", 1)
            current = item.get("current_stock", 0)

            suggested = daily_demand * lead * 1.2 - current
            if suggested <= 0:
                continue

            suggested = round(suggested, 1)
            unit_cost = item.get("unit_cost", 0)
            suggestions.append(
                {
                    "id": str(item["_id"]),
                    "item_name": name,
                    "current_stock": current,
                    "forecasted_demand_7d": round(forecast_7d, 1),
                    "suggested_order_qty": suggested,
                    "estimated_cost": round(suggested * unit_cost, 2),
                }
            )

        return suggestions
