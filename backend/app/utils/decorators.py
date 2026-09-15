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
            g.current_user_id = get_jwt_identity()
        except Exception as e:
            return error_response(str(e), 401)
        return fn(*args, **kwargs)
    return wrapper


def demo_mode_optional(fn):
    """
    Decorator that allows demo tokens to pass through.
    In DEMO_MODE=true, any token starting with 'demo_token_' is accepted
    and g.current_user_id is set to the demo user ID.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if current_app.config.get('DEMO_MODE'):
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Bearer demo_token_'):
                g.current_user_id = 1  # demo user ID
                return fn(*args, **kwargs)
        # Fall through to normal JWT verification
        try:
            verify_jwt_in_request()
            g.current_user_id = get_jwt_identity()
        except Exception as e:
            return error_response(str(e), 401)
        return fn(*args, **kwargs)
    return wrapper
