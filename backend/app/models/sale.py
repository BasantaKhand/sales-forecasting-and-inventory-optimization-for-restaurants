"""Sale model.

Documents the shape of a ``sales`` collection document. Fields mirror the
columns of ``nepali_restaurant_sales_data.csv``.

Document shape::

    {
        "order_id": str,
        "date": datetime,
        "year": int,
        "month": int,
        "day": int,
        "day_of_week": int,
        "day_name": str,
        "time_slot": str,
        "meal_period": str,
        "item_name": str,
        "category": str,
        "quantity": int,
        "unit_price_npr": float,
        "total_price_npr": float,
        "weather": str,
        "temperature_celsius": float,
        "is_weekend": int,
        "is_holiday": int,
        "festival_event": str,
        "season": str,
        "num_customers_today": int,
        "order_type": str,
    }
"""

COLLECTION = "sales"

# Columns expected from the CSV, in order.
CSV_COLUMNS = [
    "order_id",
    "date",
    "year",
    "month",
    "day",
    "day_of_week",
    "day_name",
    "time_slot",
    "meal_period",
    "item_name",
    "category",
    "quantity",
    "unit_price_npr",
    "total_price_npr",
    "weather",
    "temperature_celsius",
    "is_weekend",
    "is_holiday",
    "festival_event",
    "season",
    "num_customers_today",
    "order_type",
]
