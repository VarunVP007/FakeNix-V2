"""
FAKENIX 2.0 — Database Service
Utility functions for verifying and managing the database connection.
"""
import logging
from app.extensions import db
from app.utils.logger import get_logger

logger = get_logger('database_service')


def check_db_connection() -> dict:
    """
    Verify the database connection by executing a lightweight query.

    Returns:
        dict with keys: 'ok' (bool), 'url' (str), 'tables' (list), 'error' (str|None)
    """
    try:
        from sqlalchemy import text, inspect
        with db.engine.connect() as conn:
            conn.execute(text('SELECT 1'))

        inspector = inspect(db.engine)
        tables = inspector.get_table_names()

        db_url = str(db.engine.url)
        # Mask the password portion for safe logging
        safe_url = _mask_password(db_url)

        logger.info(f'Database connection OK: {safe_url}')
        return {
            'ok': True,
            'url': safe_url,
            'tables': tables,
            'error': None,
        }
    except Exception as exc:
        logger.error(f'Database connection failed: {exc}')
        return {
            'ok': False,
            'url': _mask_password(str(db.engine.url)) if db.engine else 'unknown',
            'tables': [],
            'error': str(exc),
        }


def get_table_row_counts() -> dict:
    """
    Return row counts for all known FAKENIX tables.
    Useful for health-check and admin diagnostics.
    """
    from app.models.user import User
    from app.models.detection import Detection
    from app.models.evidence import Evidence
    from app.models.report import Report
    from app.models.cybercrime_report import CybercrimeReport

    tables = {
        'users': User,
        'detections': Detection,
        'evidence': Evidence,
        'reports': Report,
        'cybercrime_reports': CybercrimeReport,
    }

    counts = {}
    for name, model in tables.items():
        try:
            counts[name] = db.session.query(model).count()
        except Exception as exc:
            counts[name] = f'error: {exc}'

    return counts


def ensure_report_constraints() -> None:
    """
    Add the one-report-per-detection unique index to a database created before
    the index existed (db.create_all() never alters existing tables).

    Nothing is deleted: if historical rows already share a detection, the index
    is left off, the situation is logged, and the application-level check in
    report_service keeps handing out the oldest report for that detection.
    """
    from sqlalchemy import func, inspect
    from app.models.report import Report

    index = next(i for i in Report.__table__.indexes if i.name == 'uq_reports_detection_id')
    if any(i['name'] == index.name for i in inspect(db.engine).get_indexes('reports')):
        return

    duplicates = (
        db.session.query(Report.detection_id)
        .filter(Report.detection_id.isnot(None))
        .group_by(Report.detection_id)
        .having(func.count(Report.id) > 1)
        .count()
    )
    db.session.rollback()  # release the read transaction before DDL
    if duplicates:
        logger.warning(
            f'{duplicates} detection(s) already have more than one report; '
            'unique index uq_reports_detection_id was not created. Existing rows were left untouched.'
        )
        return

    index.create(db.engine)
    logger.info('Created unique index uq_reports_detection_id on reports.detection_id')


def safe_commit() -> tuple[bool, str]:
    """
    Attempt to commit the current session.
    Rolls back and returns (False, error_message) on failure.
    """
    try:
        db.session.commit()
        return True, ''
    except Exception as exc:
        db.session.rollback()
        logger.error(f'DB commit failed, rolled back: {exc}')
        return False, str(exc)


def safe_rollback() -> None:
    """Roll back the current session silently."""
    try:
        db.session.rollback()
    except Exception as exc:
        logger.warning(f'Rollback error (non-critical): {exc}')


def _mask_password(url: str) -> str:
    """Replace password in a DB URL with '***' for safe display."""
    import re
    return re.sub(r'(://[^:@]+:)[^@]+(@)', r'\1***\2', url)
