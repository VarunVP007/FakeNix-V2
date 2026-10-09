"""
FAKENIX 2.0 — Report Routes

POST /api/reports
GET  /api/reports
GET  /api/reports/<report_uid>
GET  /api/reports/<report_uid>/download
"""
from flask import Blueprint, request, g, current_app, send_file

from app.services.report_service import (
    DETECTION_NOT_FOUND, generate_report, get_all_reports, get_report_by_uid, get_report_pdf,
)
from app.services.auth_service import get_user_by_id
from app.utils.response import success_response, error_response
from app.utils.decorators import demo_mode_optional

report_bp = Blueprint('report', __name__)


@report_bp.route('/reports', methods=['POST'])
@demo_mode_optional
def create_report():
    """POST /api/reports — generate a forensic PDF report for a detection"""
    data = request.get_json(silent=True) or {}
    detection_id = data.get('detectionId') or data.get('detection_id')

    if not detection_id:
        return error_response("'detectionId' is required.", 400)

    user_id = getattr(g, 'current_user_id', None)
    user = get_user_by_id(user_id) if user_id else None

    try:
        report, err = generate_report(detection_id, user, user_id=user_id)
    except Exception as e:
        current_app.logger.exception(f'Report generation error: {e}')
        return error_response('Report generation failed.', 500)
    if err:
        return error_response(err, 404 if err == DETECTION_NOT_FOUND else 400)

    return success_response(
        data=report.to_dict(),
        message='Report generated successfully.',
        status_code=201,
    )


@report_bp.route('/reports', methods=['GET'])
@demo_mode_optional
def list_reports():
    """GET /api/reports — list all reports for current user"""
    try:
        user_id = getattr(g, 'current_user_id', None)
        reports = get_all_reports(user_id)
        return success_response(data=reports)
    except Exception as e:
        current_app.logger.error(f'Reports list error: {e}')
        return error_response('Failed to retrieve reports.', 500)


@report_bp.route('/reports/<report_uid>', methods=['GET'])
@demo_mode_optional
def get_report(report_uid: str):
    """GET /api/reports/<report_uid>"""
    user_id = getattr(g, 'current_user_id', None)
    report = get_report_by_uid(report_uid, user_id)
    if not report:
        return error_response('Report not found.', 404)
    return success_response(data=report.to_dict())


@report_bp.route('/reports/<report_uid>/download', methods=['GET'])
@demo_mode_optional
def download_report(report_uid: str):
    """GET /api/reports/<report_uid>/download — stream PDF to client"""
    user_id = getattr(g, 'current_user_id', None)

    # Downloading never creates anything: an unknown ID is simply not found.
    report = get_report_by_uid(report_uid, user_id)
    if not report:
        return error_response('Report not found.', 404)

    try:
        report_path, err = get_report_pdf(report)
    except Exception as e:
        current_app.logger.exception(f'Report download error: {e}')
        report_path, err = None, 'Report PDF generation failed.'
    if err or not report_path:
        return error_response(err or 'Report PDF generation failed.', 500)

    return send_file(
        report_path,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'{report.report_uid}.pdf',
        max_age=0,
    )

