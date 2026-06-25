"""Authentication routes.

Endpoints (implemented in Prompt 2):
    POST /api/auth/register
    POST /api/auth/login
    GET  /api/auth/me
"""
from flask import Blueprint, jsonify

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/ping", methods=["GET"])
def ping():
    """Placeholder health route for the auth blueprint."""
    return jsonify({"blueprint": "auth", "status": "ready"})


# TODO(Prompt 2): implement /register, /login, /me
