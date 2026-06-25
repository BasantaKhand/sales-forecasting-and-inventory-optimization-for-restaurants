"""Authentication routes.

Endpoints:
    POST /api/auth/register  -> create a user (bcrypt-hashed password)
    POST /api/auth/login     -> verify credentials, return a JWT access token
    GET  /api/auth/me        -> return the current user (JWT protected)
"""
import bcrypt
from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, request
from flask_jwt_extended import create_access_token
from pymongo.errors import DuplicateKeyError

from ..models.user import COLLECTION, ROLES, new_user, public_user
from ..utils.auth_middleware import get_current_user_id, token_required
from ..utils.helpers import error, get_db, success

auth_bp = Blueprint("auth", __name__)


def _users():
    """Return the users collection, ensuring a unique index on email."""
    db = get_db()
    collection = db[COLLECTION]
    # Idempotent: Mongo only creates the index once.
    collection.create_index("email", unique=True)
    return collection


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user."""
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or "staff").strip().lower()

    # --- Validation ---
    if not username or not email or not password:
        return error("username, email and password are required", 400)
    if "@" not in email or "." not in email:
        return error("A valid email address is required", 400)
    if len(password) < 6:
        return error("password must be at least 6 characters", 400)
    if role not in ROLES:
        role = "staff"

    users = _users()

    # --- Hash the password with bcrypt (store as utf-8 string) ---
    password_hash = bcrypt.hashpw(
        password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    doc = new_user(username, email, password_hash, role)

    try:
        users.insert_one(doc)
    except DuplicateKeyError:
        return error("An account with this email already exists", 409)

    return success(message="User registered successfully", status=201)


@auth_bp.route("/login", methods=["POST"])
def login():
    """Verify credentials and return a JWT access token + user info."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return error("email and password are required", 400)

    users = _users()
    user = users.find_one({"email": email})

    if not user or not bcrypt.checkpw(
        password.encode("utf-8"), user["password_hash"].encode("utf-8")
    ):
        return error("Invalid email or password", 401)

    # Identity must be a string for flask-jwt-extended.
    access_token = create_access_token(identity=str(user["_id"]))

    return success(access_token=access_token, user=public_user(user))


@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    """Return the currently authenticated user's info."""
    user_id = get_current_user_id()
    try:
        oid = ObjectId(user_id)
    except (InvalidId, TypeError):
        return error("Invalid token identity", 401)

    users = _users()
    user = users.find_one({"_id": oid})
    if not user:
        return error("User not found", 404)

    return success(user=public_user(user))
