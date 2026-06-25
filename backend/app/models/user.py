"""User model.

Since we use raw PyMongo (not an ODM), this module simply documents the shape
of a ``users`` collection document and provides small factory/serialise helpers.

Document shape::

    {
        "_id": ObjectId,
        "username": str,
        "email": str,               # unique
        "password_hash": bytes/str, # bcrypt hash
        "role": str,                # "admin" | "staff"
        "created_at": datetime,
    }
"""
from datetime import datetime

COLLECTION = "users"
ROLES = ("admin", "staff")


def new_user(username, email, password_hash, role="staff"):
    """Build a user document ready to be inserted."""
    if role not in ROLES:
        role = "staff"
    return {
        "username": username,
        "email": email.lower().strip(),
        "password_hash": password_hash,
        "role": role,
        "created_at": datetime.utcnow(),
    }


def public_user(doc):
    """Return a user document without the password hash, id as string."""
    if not doc:
        return None
    return {
        "id": str(doc.get("_id")),
        "username": doc.get("username"),
        "email": doc.get("email"),
        "role": doc.get("role"),
        "created_at": (
            doc["created_at"].isoformat() if doc.get("created_at") else None
        ),
    }
