"""
FAKENIX 2.0 — Database Initialization Script

Usage:
    cd backend
    python scripts/init_db.py

Creates all database tables from the SQLAlchemy models.
Safe to run multiple times — uses CREATE TABLE IF NOT EXISTS.
"""
import sys
import os

# Ensure backend/ is on the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

from app import create_app
from app.extensions import db
import app.models  # noqa: ensure all models are imported


def init_db():
    """Initialize the database — create all tables."""
    flask_app = create_app()

    with flask_app.app_context():
        db_url = flask_app.config.get('SQLALCHEMY_DATABASE_URI', 'unknown')
        print(f'\n[FAKENIX] Initializing database...')
        print(f'[FAKENIX] Database: {db_url}')

        try:
            db.create_all()
            print('[FAKENIX] [OK] All tables created successfully.')
        except Exception as e:
            print(f'[FAKENIX] [ERROR] Database initialization failed: {e}')
            sys.exit(1)

        # Count tables
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f'[FAKENIX] [OK] Tables in database: {", ".join(tables)}')
        print('[FAKENIX] Database initialization complete.\n')


if __name__ == '__main__':
    init_db()
