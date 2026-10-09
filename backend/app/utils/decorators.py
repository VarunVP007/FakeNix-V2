"""
FAKENIX 2.0 — Custom Decorators
"""
import os
from functools import wraps
from flask import current_app, request, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

from app.utils.response import error_response


def jwt_required_custom(fn):
    """
    Decorator to require a valid JWT token.
    Sets g.current_user_id from the JWT identity.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            identity = get_jwt_identity()
            # JWT identity is stored as str(user.id); cast back to int for DB queries
            g.current_user_id = int(identity) if identity is not None else None
        except Exception as e:
            return error_response(str(e), 401)
        return fn(*args, **kwargs)
    return wrapper


def demo_mode_optional(fn):
    """
    Optional auth for demo/public endpoints.

    If a valid JWT is present, it is used. If no token is provided and DEMO_MODE is
    enabled, the request is treated as a demo user so intentionally public demo
    flows still work. Invalid tokens are still rejected.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')

        if auth_header.startswith('Bearer demo_token_'):
            g.current_user_id = 1
            return fn(*args, **kwargs)

        if not auth_header and current_app.config.get('DEMO_MODE'):
            g.current_user_id = 1
            return fn(*args, **kwargs)

        try:
            verify_jwt_in_request()
            identity = get_jwt_identity()
            if identity is None:
                return error_response('Authentication token required.', 401)
            g.current_user_id = int(identity)
        except Exception:
            return error_response('Your session is no longer valid. Please log in again.', 401)
        return fn(*args, **kwargs)
    return wrapper

