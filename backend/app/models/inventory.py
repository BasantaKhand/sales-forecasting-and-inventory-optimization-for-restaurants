"""Inventory model.

Documents the shape of an ``inventory`` collection document.

Document shape::

    {
        "_id": ObjectId,
        "item_name": str,
        "category": str,
        "current_stock": float,
        "reorder_level": float,
        "unit_cost": float,          # NPR
        "supplier": str,
        "lead_time_days": int,
        "updated_at": datetime,
    }
"""
from datetime import datetime

COLLECTION = "inventory"


def new_item(
    item_name,
    category,
    current_stock=0,
    reorder_level=0,
    unit_cost=0,
    supplier="",
    lead_time_days=1,
):
    """Build an inventory document ready to be inserted."""
    return {
        "item_name": item_name,
        "category": category,
        "current_stock": float(current_stock),
        "reorder_level": float(reorder_level),
        "unit_cost": float(unit_cost),
        "supplier": supplier,
        "lead_time_days": int(lead_time_days),
        "updated_at": datetime.utcnow(),
    }


def compute_status(current_stock, reorder_level):
    """Return "OK" / "Low" / "Critical" based on stock vs reorder level."""
    if current_stock <= reorder_level:
        return "Critical"
    if current_stock <= reorder_level * 1.5:
        return "Low"
    return "OK"
