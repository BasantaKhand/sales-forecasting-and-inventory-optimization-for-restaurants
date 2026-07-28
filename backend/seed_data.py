"""Seed script — resets and populates the database for a clean demo.

Usage:
    cd backend
    python seed_data.py

Steps:
  1. Drop existing sales / users / inventory collections.
  2. Import the Nepali restaurant sales CSV (batched insert).
  3. Create admin + staff users.
  4. Create 50 inventory items from the top-selling menu items,
     with ~10 deliberately low on stock so alerts have something to show.
"""
import os
import random

import bcrypt
import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

HERE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(HERE, "..", "data", "nepali_restaurant_sales_data.csv")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/restaurant_forecast")
BATCH = 5000

INT_COLUMNS = ["year", "month", "day", "day_of_week", "quantity",
               "is_weekend", "is_holiday", "num_customers_today"]
FLOAT_COLUMNS = ["unit_price_npr", "total_price_npr", "temperature_celsius"]
SUPPLIERS = ["Local Vendor", "Kathmandu Suppliers", "Fresh Farm Nepal",
             "Bhaktapur Wholesale"]


def hash_password(raw):
    return bcrypt.hashpw(raw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def import_sales(db):
    print("Reading CSV...")
    df = pd.read_csv(CSV_PATH)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    for col in INT_COLUMNS:
        df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")
    for col in FLOAT_COLUMNS:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.astype(object).where(pd.notnull(df), None)

    total = 0
    batch = []
    for record in df.to_dict("records"):
        for col in INT_COLUMNS:
            if record.get(col) is not None:
                record[col] = int(record[col])
        batch.append(record)
        if len(batch) >= BATCH:
            db.sales.insert_many(batch)
            total += len(batch)
            print(f"  inserted {total} rows...")
            batch = []
    if batch:
        db.sales.insert_many(batch)
        total += len(batch)
    print(f"  inserted {total} rows (done)")
    return total


def create_users(db):
    db.users.create_index("email", unique=True)
    users = [
        {"username": "Admin", "email": "admin@deurali.com",
         "password_hash": hash_password("admin123"), "role": "admin"},
        {"username": "Staff", "email": "staff@deurali.com",
         "password_hash": hash_password("staff123"), "role": "staff"},
    ]
    from datetime import datetime
    for u in users:
        u["created_at"] = datetime.utcnow()
    db.users.insert_many(users)
    return len(users)


def create_inventory(db):
    top = list(db.sales.aggregate([
        {"$group": {
            "_id": "$item_name",
            "qty": {"$sum": "$quantity"},
            "avg_price": {"$avg": "$unit_price_npr"},
            "category": {"$first": "$category"},
        }},
        {"$sort": {"qty": -1}},
        {"$limit": 50},
    ]))

    from datetime import datetime
    docs = []
    low_stock_indices = set(random.sample(range(len(top)), min(10, len(top))))
    for i, item in enumerate(top):
        reorder = random.randint(15, 30)
        if i in low_stock_indices:
            current = random.randint(1, reorder - 1)  # below reorder -> Critical
        else:
            current = random.randint(int(reorder * 1.6), 100)
        docs.append({
            "item_name": item["_id"],
            "category": item.get("category") or "",
            "current_stock": float(current),
            "reorder_level": float(reorder),
            "unit_cost": round((item.get("avg_price") or 0) * 0.4, 2),
            "supplier": random.choice(SUPPLIERS),
            "lead_time_days": random.randint(1, 3),
            "updated_at": datetime.utcnow(),
        })
    db.inventory.insert_many(docs)
    return len(docs)


def main():
    client = MongoClient(MONGO_URI)
    db = client.get_default_database()
    print(f"Connected to {MONGO_URI}")

    print("Dropping existing collections...")
    db.sales.drop()
    db.users.drop()
    db.inventory.drop()

    sales_count = import_sales(db)
    user_count = create_users(db)
    inv_count = create_inventory(db)

    print("\n" + "=" * 50)
    print(f"Seeded: {sales_count} sales records, {user_count} users, "
          f"{inv_count} inventory items")
    print("Login: admin@deurali.com / admin123  (or staff@deurali.com / staff123)")
    print("=" * 50)


if __name__ == "__main__":
    main()
