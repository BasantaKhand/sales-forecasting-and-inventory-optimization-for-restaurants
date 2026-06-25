"""Authentication middleware / decorators.

Wraps flask-jwt-extended's ``jwt_required`` so routes can simply do::

    from app.utils.auth_middleware import token_required

    @token_required
    def protected():
        ...
"""
from functools import wraps

from flask_jwt_extended import jwt_required, get_jwt_identity


def token_required(fn):
    """Require a valid JWT access token in the Authorization header."""

    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)

    return wrapper


def get_current_user_id():
    """Return the identity (user id) stored in the current JWT."""
    return get_jwt_identity()
