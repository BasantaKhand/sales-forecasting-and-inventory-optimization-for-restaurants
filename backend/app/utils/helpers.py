"""Shared helper utilities: DB access, date parsing, response formatting."""
from datetime import datetime

from flask import current_app, jsonify


def get_db():
    """Return the active MongoDB database instance for this app context."""
    return current_app.extensions["pymongo"]


def parse_date(value, default=None):
    """Parse a date string (YYYY-MM-DD or ISO) into a datetime, else default."""
    if not value:
        return default
    if isinstance(value, datetime):
        return value
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y/%m/%d"):
        try:
            return datetime.strptime(value, fmt)
        except (ValueError, TypeError):
            continue
    return default


def serialize_doc(doc):
    """Convert a MongoDB document into a JSON-serialisable dict.

    Turns ``_id`` (ObjectId) into a string ``id`` field and formats datetimes.
    """
    if doc is None:
        return None
    out = {}
    for key, value in doc.items():
        if key == "_id":
            out["id"] = str(value)
        elif isinstance(value, datetime):
            out[key] = value.isoformat()
        else:
            out[key] = value
    return out


def success(data=None, message=None, status=200, **extra):
    """Build a standard success JSON response."""
    payload = {}
    if message is not None:
        payload["message"] = message
    if data is not None:
        payload["data"] = data
    payload.update(extra)
    return jsonify(payload), status


def error(message, status=400, **extra):
    """Build a standard error JSON response."""
    payload = {"error": message}
    payload.update(extra)
    return jsonify(payload), status
