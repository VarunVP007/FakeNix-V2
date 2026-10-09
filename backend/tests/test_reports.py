"""
FAKENIX 2.0 — Forensic report tests

Covers the report pipeline end to end: upload -> detection -> evidence ->
report record -> PDF -> download.

Isolation: a dedicated app with its own in-memory database and temporary
upload/report folders. Media files are synthetic. The Groq API is never
called — the model call is replaced with canned answers.
"""
import hashlib
import io
import os
import shutil
import tempfile
from unittest import mock

import pytest
from pypdf import PdfReader
from reportlab.pdfbase.pdfmetrics import stringWidth

from app import create_app
from app.ai.groq_analyzer import GroqAnalysisError
from app.extensions import db as _db
from app.models.detection import Detection
from app.models.evidence import Evidence
from app.models.report import Report
from app.models.user import User
from app.services import report_pdf, report_service


# ──────────────────────────────────────────────────────────────
# Fixtures and helpers
# ──────────────────────────────────────────────────────────────

@pytest.fixture(scope='module')
def rapp():
    """Isolated app: fresh in-memory DB, fresh temp storage, placeholder Groq settings."""
    flask_app = create_app('testing')
    storage = tempfile.mkdtemp(prefix='fakenix_report_tests_')
    flask_app.config.update(
        UPLOAD_FOLDER=os.path.join(storage, 'uploads'),
        REPORT_FOLDER=os.path.join(storage, 'reports'),
        GROQ_API_KEY='test-key-not-real',
        GROQ_MODEL='qwen/test-vision-model',
    )
    os.makedirs(flask_app.config['UPLOAD_FOLDER'])
    os.makedirs(flask_app.config['REPORT_FOLDER'])
    with flask_app.app_context():
        _db.create_all()
        yield flask_app
        _db.session.remove()
        _db.drop_all()
    shutil.rmtree(storage, ignore_errors=True)


@pytest.fixture()
def rclient(rapp):
    return rapp.test_client()


def make_image(fmt: str, color=(70, 110, 160), size=(320, 240)) -> bytes:
    from PIL import Image
    buf = io.BytesIO()
    Image.new('RGB', size, color).save(buf, format=fmt)
    return buf.getvalue()


def model_answer(verdict='fake', probability=88.0, **extra) -> dict:
    return {
        'verdict': verdict,
        'deepfake_probability': probability,
        'indicators': [{'name': 'Facial boundary blending', 'severity': 'high', 'score': 0.9,
                        'evidence': 'Seam visible along the jawline.'}],
        'frames': [],
        'explanation': 'The jawline shows a visible blending seam.',
        **extra,
    }


def upload_image(client, name: str, data: bytes, answer: dict):
    """POST an image with the model call replaced by `answer`."""
    with mock.patch('app.ai.groq_analyzer._call_model', return_value=answer):
        return client.post('/api/detect/image', data={'file': (io.BytesIO(data), name)},
                           content_type='multipart/form-data')


def new_detection(client, name='photo.jpg', answer=None, color=(70, 110, 160)) -> dict:
    resp = upload_image(client, name, make_image('JPEG', color), answer or model_answer())
    assert resp.status_code == 200, resp.get_json()
    return resp.get_json()['data']


def new_report(client, detection_id: str) -> dict:
    resp = client.post('/api/reports', json={'detectionId': detection_id})
    assert resp.status_code == 201, resp.get_json()
    return resp.get_json()['data']


def download(client, report_id: str):
    return client.get(f'/api/reports/{report_id}/download')


def pdf_text(data: bytes) -> str:
    """All text of a PDF with whitespace collapsed (wrapped lines become one)."""
    reader = PdfReader(io.BytesIO(data))
    return ' '.join(' '.join(page.extract_text() for page in reader.pages).split())


def text_spans(data: bytes) -> list:
    """(page, x_left, x_right, text) for every text run, in page coordinates."""
    spans = []
    for number, page in enumerate(PdfReader(io.BytesIO(data)).pages, start=1):
        def visit(text, cm, tm, font_dict, font_size, number=number):
            if not text.strip() or not font_dict:
                return
            x = tm[4] * cm[0] + tm[5] * cm[2] + cm[4]
            font = str(font_dict.get('/BaseFont', '/Helvetica')).lstrip('/')
            spans.append((number, x, x + stringWidth(text.rstrip('\n'), font, font_size), text.strip()))
        page.extract_text(visitor_text=visit)
    return spans


def assert_text_inside_margins(data: bytes):
    left = report_pdf.MARGIN_X
    right = report_pdf.PAGE_SIZE[0] - report_pdf.MARGIN_X
    spans = text_spans(data)
    assert spans, 'no text found in PDF'
    for page, x0, x1, text in spans:
        assert x0 >= left - 0.5, f'page {page}: text starts left of the margin ({x0:.1f}): {text!r}'
        assert x1 <= right + 0.5, f'page {page}: text runs past the right margin ({x1:.1f}): {text!r}'


def sample_context(**overrides) -> dict:
    """A complete, plausible context for layout-only tests."""
    ctx = {
        'report_id': 'FX-RPT-2026-042', 'report_type': 'Forensic Analysis Report',
        'generated_at': '2026-01-02 03:04:05', 'generated_by': 'Test Analyst',
        'evidence_id': 'FX-2026-00042', 'detection_id': 'det_abcdef123456', 'is_demo': False,
        'verdict': 'SUSPICIOUS', 'verdict_label': 'SUSPICIOUS', 'risk_level': 'medium',
        'fake_likelihood': 47.4, 'authentic_complement': 52.6,
        'analysis_kind': 'AI model inference (vision language model)',
        'model': 'qwen/test-vision-model', 'provider': 'Groq Cloud', 'analyzed_at': '2026-01-02 03:04:00',
        'notes': [], 'risk_bands': 'below 30% low, 30–70% medium, 70% and above high',
        'file': {'name': 'photo.jpg', 'media_type': 'Image', 'size_bytes': 1489001, 'size_display': '1.42 MB',
                 'extension': '.jpg', 'detected_format': 'JPEG', 'mime': 'image/jpeg',
                 'dimensions': '3264 × 1480 px', 'uploaded_at': '2026-01-02 03:03:59', 'inconsistencies': []},
        'integrity': {'state': 'match', 'sha256': 'a' * 64, 'md5': 'b' * 32,
                      'recorded_at': '2026-01-02 03:04:00', 'state_label': 'MATCH — re-hashed.'},
        'custody': [{'action': 'Uploaded', 'by': 'User #1', 'time': '2026-01-02 03:03:59'}],
        'indicators': [{'name': 'Lighting mismatch', 'score': 0.48, 'severity': 'medium', 'evidence': 'Left cheek.'}],
        'indicator_source': 'AI-generated observations.', 'frames': [],
        'observations': 'Evidence is mixed.', 'observations_source': 'Model.', 'limitations': ['A limitation.'],
    }
    ctx.update(overrides)
    return ctx


def render(ctx: dict) -> bytes:
    folder = tempfile.mkdtemp(prefix='fakenix_layout_')
    try:
        path = os.path.join(folder, 'out.pdf')
        report_pdf.render_report_pdf(path, ctx)
        with open(path, 'rb') as f:
            return f.read()
    finally:
        shutil.rmtree(folder, ignore_errors=True)


def iter_tables(flowables):
    from reportlab.platypus import KeepTogether, Table
    for flowable in flowables:
        if isinstance(flowable, Table):
            yield flowable
            for row in flowable._cellvalues:
                for cell in row:
                    yield from iter_tables(cell if isinstance(cell, list) else [cell])
        elif isinstance(flowable, KeepTogether):
            yield from iter_tables(flowable._content)


# ──────────────────────────────────────────────────────────────
# 1 + 2. PDF layout
# ──────────────────────────────────────────────────────────────

class TestPdfLayout:
    def test_pdf_is_valid_with_page_numbers(self):
        data = render(sample_context())
        assert data.startswith(b'%PDF-')
        reader = PdfReader(io.BytesIO(data))
        total = len(reader.pages)
        assert total >= 1
        for number, page in enumerate(reader.pages, start=1):
            text = ' '.join(page.extract_text().split())
            assert f'Page {number} of {total}' in text
            assert 'FX-RPT-2026-042' in text

    def test_every_table_fits_the_frame_and_wraps(self):
        from reportlab.platypus import Flowable
        tables = list(iter_tables(report_pdf.build_story(sample_context())))
        assert len(tables) >= 5
        for table in tables:
            assert all(w is not None for w in table._colWidths), 'column widths must be explicit'
            assert sum(table._colWidths) <= report_pdf.CONTENT_WIDTH + 0.01
            for row in table._cellvalues:
                assert len(row) == len(table._colWidths), 'row has more cells than column widths'
                for cell in row:
                    # Wrappable flowables only; a bare string would not wrap ('' is a spanned filler).
                    assert cell == '' or isinstance(cell, (Flowable, list)), f'unwrapped cell: {cell!r}'

    @pytest.mark.parametrize('verdict', ['REAL', 'FAKE', 'SUSPICIOUS', 'UNDETERMINED'])
    def test_each_verdict_renders_inside_margins(self, verdict):
        data = render(sample_context(verdict=verdict, verdict_label=verdict))
        assert f'VERDICT: {verdict}' in pdf_text(data)
        assert_text_inside_margins(data)

    def test_long_values_wrap_instead_of_clipping(self):
        long_model = 'provider-namespace/' + 'extremely-long-model-identifier-' * 8 + 'v1'
        long_name = 'evidence_' + 'x' * 180 + '.jpg'
        long_verdict = 'SUSPICIOUS — ' + 'inconclusive assessment requiring manual expert review ' * 4
        ctx = sample_context(
            verdict_label=long_verdict, model=long_model, provider='A provider ' * 30,
            observations='Observation sentence that keeps going. ' * 60,
            indicators=[{'name': 'Indicator ' + 'name ' * 40, 'score': 0.5, 'severity': 'medium',
                         'evidence': 'unbroken' * 60}] * 3,
            notes=['A policy note. ' * 30],
        )
        ctx['file'] = {**ctx['file'], 'name': long_name,
                       'inconsistencies': ['Extension says PNG but content is JPEG. ' * 10]}
        data = render(ctx)
        assert_text_inside_margins(data)
        text = pdf_text(data).replace(' ', '')
        # Nothing was truncated: the full long values are present once line breaks are removed.
        assert long_model in text
        assert long_name in text
        assert long_verdict.replace(' ', '') in text

    def test_unsafe_and_non_latin_text_does_not_break_the_pdf(self):
        ctx = sample_context(model='<b>model</b> & "co"', observations='5 < 6 && 7 > 2 </para>')
        ctx['file'] = {**ctx['file'], 'name': 'фото_證據_😀.jpg'}
        text = pdf_text(render(ctx))
        assert '<b>model</b> & "co"' in text
        assert '5 < 6 && 7 > 2 </para>' in text

    def test_missing_optional_fields_are_omitted_not_invented(self):
        ctx = sample_context(indicators=[], observations=None, custody=[], evidence_id=None,
                             fake_likelihood=None, authentic_complement=None, model=None, provider=None,
                             integrity={'state': 'no_evidence', 'state_label': 'NO EVIDENCE FILE — none.'})
        ctx['file'] = {'name': 'x.jpg', 'media_type': 'Image'}
        text = pdf_text(render(ctx))
        assert 'Not recorded' in text
        assert 'NO EVIDENCE FILE' in text
        assert 'SHA-256 (recorded)' not in text
        assert 'Duration' not in text


# ──────────────────────────────────────────────────────────────
# 3 + 4. Report IDs and report-to-detection association
# ──────────────────────────────────────────────────────────────

class TestReportIdentity:
    def test_each_detection_gets_its_own_report_id(self, rclient):
        det_a = new_detection(rclient, 'alpha.jpg', model_answer('fake', 91), color=(200, 30, 30))
        det_b = new_detection(rclient, 'bravo.jpg', model_answer('real', 6), color=(30, 200, 30))
        rep_a, rep_b = new_report(rclient, det_a['id']), new_report(rclient, det_b['id'])
        assert rep_a['reportId'] != rep_b['reportId']
        assert rep_a['detectionId'] == det_a['id'] and rep_b['detectionId'] == det_b['id']

    def test_report_content_belongs_to_its_detection(self, rclient):
        det_a = new_detection(rclient, 'charlie.jpg', model_answer('fake', 91), color=(10, 10, 200))
        det_b = new_detection(rclient, 'delta.jpg', model_answer('real', 6), color=(200, 200, 10))
        rep_a, rep_b = new_report(rclient, det_a['id']), new_report(rclient, det_b['id'])
        text_a = pdf_text(download(rclient, rep_a['reportId']).data)
        text_b = pdf_text(download(rclient, rep_b['reportId']).data)

        for report, det, text in ((rep_a, det_a, text_a), (rep_b, det_b, text_b)):
            assert report['reportId'] in text
            assert det['id'] in text
            assert det['evidenceId'] in text and report['evidenceId'] == det['evidenceId']
            assert det['fileName'] in text
            assert det['sha256'] in text.replace(' ', '')
        assert 'VERDICT: FAKE' in text_a and 'VERDICT: REAL' in text_b
        assert det_b['id'] not in text_a
        assert det_b['sha256'] not in text_a.replace(' ', '')
        assert det_a['sha256'] != det_b['sha256']

    def test_requesting_a_report_twice_returns_the_same_one(self, rapp, rclient):
        det = new_detection(rclient, 'echo.jpg')
        first, second = new_report(rclient, det['id']), new_report(rclient, det['id'])
        assert first['reportId'] == second['reportId']
        detection = Detection.query.filter_by(detection_uid=det['id']).one()
        assert Report.query.filter_by(detection_id=detection.id).count() == 1

    def test_database_rejects_duplicate_report_ids_and_duplicate_detection_reports(self, rapp, rclient):
        det = new_detection(rclient, 'foxtrot.jpg')
        report = new_report(rclient, det['id'])
        detection = Detection.query.filter_by(detection_uid=det['id']).one()
        other = Detection.query.filter(Detection.id != detection.id).first()
        from sqlalchemy.exc import IntegrityError

        for clash in (Report(report_uid=report['reportId'], detection_id=None, status='ready'),
                      Report(report_uid='FX-RPT-CLASH-1', detection_id=detection.id, status='ready')):
            _db.session.add(clash)
            with pytest.raises(IntegrityError):
                _db.session.commit()
            _db.session.rollback()
        assert other is not None

    def test_id_collision_from_a_concurrent_request_is_retried(self, rapp, rclient):
        """Another request took the proposed ID first: the insert fails and the next ID is used."""
        taken = new_report(rclient, new_detection(rclient, 'golf.jpg')['id'])['reportId']
        det = new_detection(rclient, 'hotel.jpg')
        real_next = report_service._next_report_uid
        proposals = iter([taken, taken])
        with mock.patch.object(report_service, '_next_report_uid',
                               side_effect=lambda: next(proposals, None) or real_next()):
            report = new_report(rclient, det['id'])
        assert report['reportId'] != taken
        assert Report.query.filter_by(report_uid=taken).count() == 1

    def test_concurrent_request_for_the_same_detection_adopts_the_winner(self, rapp, rclient):
        """Another request created this detection's report between our check and our insert."""
        det = new_detection(rclient, 'india.jpg')
        detection_id = Detection.query.filter_by(detection_uid=det['id']).one().id
        real_next = report_service._next_report_uid

        def other_request_wins():
            if not Report.query.filter_by(detection_id=detection_id).count():
                _db.session.add(Report(report_uid='FX-RPT-WINNER-1', detection_id=detection_id,
                                       report_type='Forensic Analysis', status='generating'))
                _db.session.commit()
                return 'FX-RPT-LOSER-1'
            return real_next()

        with mock.patch.object(report_service, '_next_report_uid', side_effect=other_request_wins):
            report = new_report(rclient, det['id'])
        assert report['reportId'] == 'FX-RPT-WINNER-1'
        assert Report.query.filter_by(detection_id=detection_id).count() == 1
        assert Report.query.filter_by(report_uid='FX-RPT-LOSER-1').count() == 0

    def test_report_id_is_not_reissued_after_its_row_is_deleted(self, rapp, rclient):
        det = new_detection(rclient, 'juliet.jpg')
        report = new_report(rclient, det['id'])
        year_prefix = report['reportId'].rsplit('-', 1)[0]
        highest = max(int(r.report_uid.rsplit('-', 1)[1]) for r in Report.query.all()
                      if r.report_uid.startswith(year_prefix) and r.report_uid.rsplit('-', 1)[1].isdigit())
        latest = Report.query.filter_by(report_uid=f'{year_prefix}-{highest:03d}').one()
        pdf_name = latest.report_path
        _db.session.delete(latest)
        _db.session.commit()

        fresh = new_report(rclient, new_detection(rclient, 'kilo.jpg')['id'])
        assert int(fresh['reportId'].rsplit('-', 1)[1]) > highest
        assert os.path.exists(os.path.join(rapp.config['REPORT_FOLDER'], pdf_name)), 'old PDF must be left alone'

    def test_existing_database_gains_the_unique_index_without_losing_rows(self):
        from sqlalchemy import inspect, text
        from app.services.database_service import ensure_report_constraints

        legacy = create_app('testing')
        with legacy.app_context():
            _db.create_all()
            _db.session.execute(text('DROP INDEX uq_reports_detection_id'))
            det = Detection(detection_uid='det_legacy_dupes', file_name='a.jpg', file_type='image', status='complete')
            _db.session.add(det)
            _db.session.flush()
            _db.session.add_all([Report(report_uid=f'FX-RPT-OLD-{i}', detection_id=det.id, status='ready')
                                 for i in (1, 2)])
            _db.session.commit()

            def has_index():
                return any(i['name'] == 'uq_reports_detection_id' for i in inspect(_db.engine).get_indexes('reports'))

            ensure_report_constraints()  # historical duplicates: left alone, nothing deleted
            assert not has_index()
            assert Report.query.count() == 2

            _db.session.delete(Report.query.filter_by(report_uid='FX-RPT-OLD-2').one())
            _db.session.commit()
            ensure_report_constraints()
            assert has_index()
            assert Report.query.count() == 1
            _db.session.remove()
            _db.drop_all()


# ──────────────────────────────────────────────────────────────
# 5. Metadata and MIME-type consistency
# ──────────────────────────────────────────────────────────────

class TestFileMetadata:
    @pytest.mark.parametrize('header, fmt, mime, kind', [
        (b'\xff\xd8\xff\xe0' + b'\0' * 20, 'JPEG', 'image/jpeg', 'image'),
        (b'\x89PNG\r\n\x1a\n' + b'\0' * 20, 'PNG', 'image/png', 'image'),
        (b'RIFF\0\0\0\0WEBPVP8 ', 'WEBP', 'image/webp', 'image'),
        (b'RIFF\0\0\0\0AVI LIST', 'AVI', 'video/x-msvideo', 'video'),
        (b'\0\0\0\x18ftypmp42\0\0\0\0', 'MP4', 'video/mp4', 'video'),
        (b'\0\0\0\x14ftypqt  \0\0\0\0', 'QuickTime (MOV)', 'video/quicktime', 'video'),
        (b'\x1a\x45\xdf\xa3\0\0\0\0matroska', 'Matroska (MKV)', 'video/x-matroska', 'video'),
        (b'%PDF-1.4 not media', None, None, None),
        (b'', None, None, None),
    ])
    def test_format_is_detected_from_bytes(self, header, fmt, mime, kind):
        from app.services.metadata_service import sniff_header
        assert sniff_header(header) == {'format': fmt, 'mime': mime, 'kind': kind}

    def test_png_named_png_is_consistent(self, rclient):
        data = make_image('PNG')
        meta = upload_image(rclient, 'Alumni.png', data, model_answer()).get_json()['data']['metadata']
        assert (meta['format'], meta['detectedFormat'], meta['mimeType']) == ('PNG', 'PNG', 'image/png')
        assert meta['fileExtension'] == '.png'
        assert meta['fileSizeBytes'] == len(data)
        assert (meta['width'], meta['height']) == (320, 240)
        assert meta['formatMismatch'] is False and meta['inconsistencies'] == []

    def test_jpeg_bytes_named_png_are_reported_as_jpeg_and_flagged(self, rclient):
        data = make_image('JPEG')
        det = upload_image(rclient, 'Alumni.png', data, model_answer()).get_json()['data']
        meta = det['metadata']
        assert (meta['format'], meta['mimeType']) == ('JPEG', 'image/jpeg')
        assert meta['fileExtension'] == '.png' and meta['extensionFormat'] == 'PNG'
        assert meta['formatMismatch'] is True
        assert any('".png" indicates PNG' in issue and 'JPEG' in issue for issue in meta['inconsistencies'])

        text = pdf_text(download(rclient, new_report(rclient, det['id'])['reportId']).data)
        assert 'Detected format JPEG' in text
        assert 'MIME type (detected) image/jpeg' in text
        assert 'Filename extension .png' in text
        assert 'Metadata inconsistency: Filename extension ".png" indicates PNG' in text
        assert f'({len(data):,} bytes)' in text

    def test_client_content_type_is_not_trusted(self, rclient):
        data = make_image('PNG')
        with mock.patch('app.ai.groq_analyzer._call_model', return_value=model_answer()):
            resp = rclient.post('/api/detect/image', content_type='multipart/form-data',
                                data={'file': (io.BytesIO(data), 'shot.png', 'image/webp')})
        meta = resp.get_json()['data']['metadata']
        assert meta['mimeType'] == 'image/png' and meta['clientMimeType'] == 'image/webp'
        assert any('declared "image/webp"' in issue for issue in meta['inconsistencies'])

    def test_small_file_size_is_not_rounded_to_zero(self, rapp, rclient):
        det = new_detection(rclient, 'tiny.jpg')
        stored = Detection.query.filter_by(detection_uid=det['id']).one()
        assert stored.file_size not in ('0.0', '0.0 MB') and stored.file_size.endswith(('B', 'KB', 'MB'))

    def test_non_media_bytes_are_rejected_whatever_the_extension(self, rclient):
        for route, name in (('/api/detect/image', 'notes.jpg'), ('/api/detect/video', 'notes.mp4')):
            resp = rclient.post(route, content_type='multipart/form-data',
                                data={'file': (io.BytesIO(b'just some text, not media'), name)})
            assert resp.status_code == 400, route

    def test_video_metadata_and_report(self, rapp, rclient):
        """A real (synthetic) AVI uploaded as .mp4: measured duration and size, container mismatch flagged."""
        import cv2
        import numpy as np

        folder = tempfile.mkdtemp(prefix='fakenix_video_')
        try:
            path = os.path.join(folder, 'clip.avi')
            writer = cv2.VideoWriter(path, cv2.VideoWriter_fourcc(*'MJPG'), 10.0, (64, 48))
            assert writer.isOpened(), 'OpenCV could not create the synthetic test video'
            for i in range(30):
                writer.write(np.full((48, 64, 3), i * 8, dtype=np.uint8))
            writer.release()
            with open(path, 'rb') as f:
                data = f.read()
        finally:
            shutil.rmtree(folder, ignore_errors=True)

        answer = model_answer('uncertain', 50, frames=[{'index': 0, 'deepfake_probability': 40, 'notes': 'Flat frame.'},
                                                         {'index': 1, 'deepfake_probability': 60, 'notes': None}])
        with mock.patch('app.ai.groq_analyzer._call_model', return_value=answer):
            resp = rclient.post('/api/detect/video', content_type='multipart/form-data',
                                data={'file': (io.BytesIO(data), 'clip.mp4')})
        assert resp.status_code == 200, resp.get_json()
        det = resp.get_json()['data']
        meta = det['metadata']
        assert (meta['format'], meta['mimeType']) == ('AVI', 'video/x-msvideo')
        assert meta['resolution'] == '64x48'
        assert meta['durationSeconds'] == pytest.approx(3.0, abs=0.2) and det['duration'] == '0:03'
        assert meta['fileSizeBytes'] == len(data)
        assert meta['formatMismatch'] is True
        assert det['result'] == 'suspicious' and len(det['frames']) == 2

        text = pdf_text(download(rclient, new_report(rclient, det['id'])['reportId']).data)
        assert 'VERDICT: SUSPICIOUS' in text
        assert 'Detected format AVI' in text and 'Duration 0:03' in text
        assert 'Sampled Video Frames' in text and 'Flat frame.' in text
        assert 'None given' in text and ' None ' not in text.replace('None given', '').replace('None (', '')


# ──────────────────────────────────────────────────────────────
# 6. SHA-256 calculation and verification
# ──────────────────────────────────────────────────────────────

class TestEvidenceIntegrity:
    def test_hashes_are_of_the_uploaded_bytes(self, rapp, rclient):
        data = make_image('JPEG', (12, 34, 56))
        det = upload_image(rclient, 'hash_me.jpg', data, model_answer()).get_json()['data']
        evidence = Evidence.query.filter_by(evidence_uid=det['evidenceId']).one()
        assert det['sha256'] == evidence.sha256_hash == hashlib.sha256(data).hexdigest()
        assert evidence.md5_hash == hashlib.md5(data).hexdigest()
        with open(os.path.join(rapp.config['UPLOAD_FOLDER'], evidence.file_path), 'rb') as f:
            assert f.read() == data, 'stored evidence must be the original upload, byte for byte'

    def test_matching_file_verifies_and_report_words_it_carefully(self, rapp, rclient):
        det = new_detection(rclient, 'intact.jpg', color=(1, 2, 3))
        evidence = Evidence.query.filter_by(evidence_uid=det['evidenceId']).one()
        assert report_service.check_evidence_integrity(evidence)['state'] == 'match'

        text = pdf_text(download(rclient, new_report(rclient, det['id'])['reportId']).data)
        assert 'MATCH — the stored evidence file was re-hashed' in text
        assert 'It does not show that the media is genuine' in text
        assert 'do not constitute a complete legal chain of custody' in text
        for overclaim in ('tamper-evident', 'Certificate of Authenticity', 'Cryptographic verification complete'):
            assert overclaim not in text

    def test_modified_file_is_a_mismatch(self, rapp, rclient):
        det = new_detection(rclient, 'tampered.jpg', color=(9, 9, 9))
        evidence = Evidence.query.filter_by(evidence_uid=det['evidenceId']).one()
        recorded = evidence.sha256_hash
        with open(os.path.join(rapp.config['UPLOAD_FOLDER'], evidence.file_path), 'ab') as f:
            f.write(b'tampered')

        result = report_service.check_evidence_integrity(evidence)
        assert result['state'] == 'mismatch' and result['actual_sha256'] != recorded
        assert evidence.sha256_hash == recorded, 'the check must not rewrite the evidence record'
        text = pdf_text(download(rclient, new_report(rclient, det['id'])['reportId']).data)
        assert 'Verification for this report MISMATCH — the stored evidence file was re-hashed' in text
        assert 'Verification for this report MATCH' not in text

        verify = rclient.get(f'/api/evidence/{det["evidenceId"]}/verify').get_json()['data']
        assert verify['match'] is False

    def test_missing_file_and_missing_evidence_are_not_reported_as_verified(self, rapp, rclient):
        det = new_detection(rclient, 'gone.jpg', color=(5, 6, 7))
        evidence = Evidence.query.filter_by(evidence_uid=det['evidenceId']).one()
        os.remove(os.path.join(rapp.config['UPLOAD_FOLDER'], evidence.file_path))
        assert report_service.check_evidence_integrity(evidence)['state'] == 'unavailable'
        assert report_service.check_evidence_integrity(None)['state'] == 'no_evidence'
        text = pdf_text(download(rclient, new_report(rclient, det['id'])['reportId']).data)
        assert 'NOT VERIFIED — the stored evidence file is not available' in text

    def test_detection_without_evidence_gets_no_invented_hash(self, rapp, rclient):
        det = Detection(detection_uid='det_no_evidence_1', user_id=1, file_name='https://example.com/v.mp4',
                        file_type='url', source_url='https://example.com/v.mp4', result='suspicious',
                        confidence=50.0, deepfake_probability=50.0, real_probability=50.0, risk_level='medium',
                        model_name='DEMO ANALYSIS', is_demo=True, status='complete')
        _db.session.add(det)
        _db.session.commit()
        before = Evidence.query.count()
        text = pdf_text(download(rclient, new_report(rclient, 'det_no_evidence_1')['reportId']).data)
        assert Evidence.query.count() == before
        assert 'NO EVIDENCE FILE' in text
        # The SHA-256 / MD5 of an empty string used to be printed as if they were the file's hashes.
        assert 'e3b0c44298fc1c149afbf4c8996fb924' not in text.replace(' ', '')
        assert 'd41d8cd98f00b204e9800998ecf8427e' not in text.replace(' ', '')


# ──────────────────────────────────────────────────────────────
# 7. Verdict / score consistency and honest attribution
# ──────────────────────────────────────────────────────────────

class TestVerdictAndScores:
    @pytest.mark.parametrize('model_verdict, probability, result, label, risk', [
        ('real', 8.0, 'real', 'REAL', 'LOW'),
        ('fake', 91.5, 'deepfake', 'FAKE', 'HIGH'),
        ('uncertain', 47.4, 'suspicious', 'SUSPICIOUS', 'MEDIUM'),
    ])
    def test_stored_record_api_and_pdf_agree(self, rapp, rclient, model_verdict, probability, result, label, risk):
        det = new_detection(rclient, f'{label.lower()}.jpg', model_answer(model_verdict, probability))
        stored = Detection.query.filter_by(detection_uid=det['id']).one()
        assert det['result'] == stored.result == result
        assert det['deepfakeProbability'] == stored.deepfake_probability == probability
        assert det['realProbability'] == pytest.approx(100 - probability)
        assert det['isDemo'] is False and stored.is_demo is False

        report = new_report(rclient, det['id'])
        assert report['detection'].lower() == result and report['deepfakeProbability'] == probability
        text = pdf_text(download(rclient, report['reportId']).data)
        assert f'VERDICT: {label}' in text
        assert f'Manipulation likelihood {probability:.1f}%' in text
        assert f'Authentic complement {100 - probability:.1f}%' in text
        assert f'Risk level {risk}' in text
        assert 'not a statistically calibrated probability' in text
        assert 'Model qwen/test-vision-model' in text and 'Provider Groq Cloud' in text
        assert 'AI-generated observations reported by qwen/test-vision-model via Groq Cloud' in text
        assert 'EfficientNet' not in text and 'DEMO' not in text
        # The model's own words are reproduced, nothing canned is added.
        assert 'The jawline shows a visible blending seam.' in text
        for canned in ('Generative adversarial network', 'No synthetic manipulation detected', 'Face Detection Status'):
            assert canned not in text

    @pytest.mark.parametrize('model_verdict, probability', [('real', 55.0), ('real', 90.0), ('fake', 10.0)])
    def test_contradictory_answer_is_stored_as_suspicious_never_real(self, rapp, rclient, model_verdict, probability):
        det = new_detection(rclient, 'contradiction.jpg', model_answer(model_verdict, probability))
        assert det['result'] == 'suspicious'
        assert det['analysis']['rawVerdict'] == model_verdict
        assert det['analysis']['rawProbability'] == probability
        assert 'Recorded as suspicious' in det['analysis']['verdictPolicy']
        text = pdf_text(download(rclient, new_report(rclient, det['id'])['reportId']).data)
        assert 'VERDICT: SUSPICIOUS' in text and 'Recorded as suspicious' in text

    def test_no_indicators_means_none_are_printed(self, rclient):
        det = new_detection(rclient, 'clean.jpg', model_answer('real', 4, indicators=[], explanation=None))
        text = pdf_text(download(rclient, new_report(rclient, det['id'])['reportId']).data)
        assert 'The model reported no specific manipulation indicators' in text
        assert 'No written observations were stored' in text
        for invented in ('Facial Texture Consistency', 'Lighting Uniformity', 'Facial Texture Inconsistency'):
            assert invented not in text

    def test_demo_result_is_labelled_and_never_attributed_to_a_model(self, rapp, rclient):
        det = Detection(detection_uid='det_demo_labelled', user_id=1, file_name='demo.jpg', file_type='image',
                        result='deepfake', confidence=94.2, deepfake_probability=94.2, real_probability=5.8,
                        risk_level='high', model_name='DEMO ANALYSIS — EfficientNet-B4 (simulated)', is_demo=True,
                        status='complete', metadata_json='{"aiExplanation": "should not be shown as model output"}',
                        indicators_json='[{"name": "Temporal inconsistency", "score": 0.48, "severity": "medium"}]')
        _db.session.add(det)
        _db.session.commit()
        report = new_report(rclient, 'det_demo_labelled')
        assert report['isDemo'] is True
        resp = download(rclient, report['reportId'])
        text = pdf_text(resp.data)
        assert 'DEMO / SIMULATED ANALYSIS' in text
        assert 'Simulated demo result — no model inference was run' in text
        assert 'Provider None (no inference provider was called)' in text
        assert 'Simulated Indicators' in text and 'Model-Reported Indicators' not in text
        assert 'should not be shown as model output' not in text
        assert 'Groq' not in text
        for page in PdfReader(io.BytesIO(resp.data)).pages:
            assert 'DEMO / SIMULATED' in ' '.join(page.extract_text().split())

    def test_stored_verdict_that_contradicts_its_score_is_called_out(self, rapp, rclient):
        det = Detection(detection_uid='det_legacy_contradiction', user_id=1, file_name='old.jpg', file_type='image',
                        result='real', confidence=82.0, deepfake_probability=82.0, real_probability=18.0,
                        risk_level='high', model_name='some-model (Groq)', is_demo=False, status='complete')
        _db.session.add(det)
        _db.session.commit()
        text = pdf_text(download(rclient, new_report(rclient, 'det_legacy_contradiction')['reportId']).data)
        assert 'VERDICT: REAL' in text  # the stored record is not rewritten...
        assert 'is not consistent with the stored manipulation likelihood (82.0%)' in text  # ...but it is flagged


# ──────────────────────────────────────────────────────────────
# 8 + 9 + 10. Missing records, invalid IDs, repeated downloads
# ──────────────────────────────────────────────────────────────

class TestReportEndpoints:
    def counts(self):
        return Detection.query.count(), Evidence.query.count(), Report.query.count()

    def test_report_for_missing_detection_is_404_and_creates_nothing(self, rapp, rclient):
        before = self.counts()
        files_before = sorted(os.listdir(rapp.config['REPORT_FOLDER']))
        for missing in ('det_does_not_exist', '999999', 'video_mp4_sample'):
            resp = rclient.post('/api/reports', json={'detectionId': missing})
            assert resp.status_code == 404 and resp.get_json()['success'] is False
        assert self.counts() == before
        assert sorted(os.listdir(rapp.config['REPORT_FOLDER'])) == files_before

    def test_report_request_without_detection_id_is_400(self, rclient):
        assert rclient.post('/api/reports', json={}).status_code == 400

    def test_incomplete_detection_cannot_be_reported(self, rapp, rclient):
        _db.session.add(Detection(detection_uid='det_pending_1', user_id=1, file_name='p.jpg',
                                  file_type='image', status='pending'))
        _db.session.commit()
        before = Report.query.count()
        assert rclient.post('/api/reports', json={'detectionId': 'det_pending_1'}).status_code == 400
        assert Report.query.count() == before

    @pytest.mark.parametrize('report_id', ['FX-RPT-2026-999999', 'not-a-report', 'rpt_999999', 'det_demo_labelled',
                                           '..%2F..%2Fapp%2Fconfig.py'])
    def test_unknown_report_id_is_404_and_creates_nothing(self, rapp, rclient, report_id):
        before = self.counts()
        for url in (f'/api/reports/{report_id}', f'/api/reports/{report_id}/download'):
            resp = rclient.get(url)
            assert resp.status_code == 404
            assert resp.mimetype == 'application/json' and resp.get_json()['success'] is False
        assert self.counts() == before

    def test_download_returns_a_pdf_attachment(self, rclient):
        report = new_report(rclient, new_detection(rclient, 'lima.jpg')['id'])
        resp = download(rclient, report['reportId'])
        assert resp.status_code == 200
        assert resp.mimetype == 'application/pdf'
        assert resp.data.startswith(b'%PDF-') and b'%%EOF' in resp.data[-1024:]
        assert f'{report["reportId"]}.pdf' in resp.headers['Content-Disposition']
        assert 'attachment' in resp.headers['Content-Disposition']
        assert len(PdfReader(io.BytesIO(resp.data)).pages) >= 1
        assert_text_inside_margins(resp.data)

    def test_repeated_downloads_serve_the_same_file_and_create_nothing(self, rapp, rclient):
        report = new_report(rclient, new_detection(rclient, 'mike.jpg')['id'])
        before = self.counts()
        files_before = sorted(os.listdir(rapp.config['REPORT_FOLDER']))
        bodies = {download(rclient, report['reportId']).data for _ in range(4)}
        assert len(bodies) == 1, 'every download of a report must return identical bytes'
        assert self.counts() == before
        assert sorted(os.listdir(rapp.config['REPORT_FOLDER'])) == files_before
        listed = [r for r in rclient.get('/api/reports').get_json()['data'] if r['reportId'] == report['reportId']]
        assert len(listed) == 1

    def test_missing_pdf_is_rebuilt_under_the_same_report_id(self, rapp, rclient):
        report = new_report(rclient, new_detection(rclient, 'november.jpg')['id'])
        row = Report.query.filter_by(report_uid=report['reportId']).one()
        os.remove(os.path.join(rapp.config['REPORT_FOLDER'], row.report_path))
        before = Report.query.count()
        resp = download(rclient, report['reportId'])
        assert resp.status_code == 200 and report['reportId'] in pdf_text(resp.data)
        assert Report.query.count() == before

    def test_old_layout_pdf_is_rebuilt_and_the_old_file_kept(self, rapp, rclient):
        report = new_report(rclient, new_detection(rclient, 'oscar.jpg')['id'])
        row = Report.query.filter_by(report_uid=report['reportId']).one()
        old_name = f'{report["reportId"].replace("-", "_")}.pdf'  # pre-fix naming
        old_path = os.path.join(rapp.config['REPORT_FOLDER'], old_name)
        with open(old_path, 'wb') as f:
            f.write(b'%PDF-1.4 old clipped layout')
        os.remove(os.path.join(rapp.config['REPORT_FOLDER'], row.report_path))
        row.report_path = old_name
        _db.session.commit()

        resp = download(rclient, report['reportId'])
        assert resp.status_code == 200 and 'Evidence Integrity' in pdf_text(resp.data)
        _db.session.refresh(row)
        assert row.report_uid == report['reportId'] and row.report_path != old_name
        with open(old_path, 'rb') as f:
            assert f.read() == b'%PDF-1.4 old clipped layout', 'historical PDF must not be overwritten'

    def test_listing_reports_does_not_seed_sample_records(self):
        fresh = create_app('testing')
        with fresh.app_context():
            _db.create_all()
            resp = fresh.test_client().get('/api/reports')
            assert resp.status_code == 200 and resp.get_json()['data'] == []
            assert Report.query.count() == 0 and Detection.query.count() == 0
            _db.session.remove()
            _db.drop_all()

    def test_reports_and_detections_of_other_users_are_not_accessible(self, rapp, rclient):
        owner = User(full_name='Owner', email=f'owner_{os.urandom(4).hex()}@fakenix.ai', role='Analyst')
        intruder = User(full_name='Intruder', email=f'intruder_{os.urandom(4).hex()}@fakenix.ai', role='Analyst')
        for user in (owner, intruder):
            user.set_password('Passw0rd!')
        _db.session.add_all([owner, intruder])
        _db.session.flush()
        det = Detection(detection_uid=f'det_private_{os.urandom(4).hex()}', user_id=owner.id, file_name='private.jpg',
                        file_type='image', result='real', confidence=5.0, deepfake_probability=5.0,
                        real_probability=95.0, risk_level='low', model_name='m (Groq)', status='complete')
        _db.session.add(det)
        _db.session.commit()

        report, err = report_service.generate_report(det.detection_uid, intruder)
        assert report is None and err == report_service.DETECTION_NOT_FOUND
        assert Report.query.filter_by(detection_id=det.id).count() == 0

        report, err = report_service.generate_report(det.detection_uid, owner)
        assert err == '' and report.user_id == owner.id and report.generated_by == 'Owner'
        assert report_service.get_report_by_uid(report.report_uid, owner.id) is report
        assert report_service.get_report_by_uid(report.report_uid, intruder.id) is None
        assert report.report_uid not in [r['reportId'] for r in report_service.get_all_reports(intruder.id)]
        assert report.report_uid in [r['reportId'] for r in report_service.get_all_reports(owner.id)]


# ──────────────────────────────────────────────────────────────
# 11. Groq failures and malformed model responses
# ──────────────────────────────────────────────────────────────

class _FakeGroqClient:
    """Stands in for the Groq SDK client and returns a fixed message content."""

    def __init__(self, content):
        message = mock.Mock(content=content)
        completion = mock.Mock(choices=[mock.Mock(message=message)], usage=None)
        self.chat = mock.Mock()
        self.chat.completions.create.return_value = completion


class TestGroqFailures:
    def post(self, client, patcher):
        with patcher:
            return client.post('/api/detect/image', content_type='multipart/form-data',
                               data={'file': (io.BytesIO(make_image('JPEG')), 'groq_case.jpg')})

    def test_api_failure_returns_an_error_and_stores_nothing(self, rapp, rclient):
        before = (Detection.query.count(), Evidence.query.count())
        resp = self.post(rclient, mock.patch('app.ai.groq_analyzer._call_model',
                                             side_effect=GroqAnalysisError('Groq rate limit reached.')))
        assert resp.status_code == 502
        body = resp.get_json()
        assert body['success'] is False and 'rate limit' in body['message']
        assert 'data' not in body or not body['data']
        assert (Detection.query.count(), Evidence.query.count()) == before, 'no simulated fallback result'

    def test_missing_api_key_is_an_error_not_a_demo_result(self, rapp, rclient):
        before = Detection.query.count()
        with mock.patch.dict(rapp.config, {'GROQ_API_KEY': ''}):
            resp = rclient.post('/api/detect/image', content_type='multipart/form-data',
                                data={'file': (io.BytesIO(make_image('JPEG')), 'nokey.jpg')})
        assert resp.status_code == 502 and 'GROQ_API_KEY' in resp.get_json()['message']
        assert Detection.query.count() == before

    @pytest.mark.parametrize('content', [
        '',
        None,
        'I think this image looks real.',
        '{"verdict": "fake", "deepfake_probability": 90',          # truncated JSON
        '[1, 2, 3]',                                               # JSON, but not an object
        '"fake"',
        '{"verdict": "maybe", "deepfake_probability": 50}',        # unknown verdict
        '{"verdict": "fake"}',                                     # no probability
        '{"verdict": "fake", "deepfake_probability": "very high"}',
        '{"verdict": "fake", "deepfake_probability": true}',
        '{"deepfake_probability": 80}',                            # no verdict
    ])
    def test_malformed_model_response_is_rejected(self, rapp, rclient, content):
        before = Detection.query.count()
        resp = self.post(rclient, mock.patch('app.ai.groq_analyzer._get_client',
                                             return_value=_FakeGroqClient(content)))
        assert resp.status_code == 502, resp.get_json()
        assert resp.get_json()['success'] is False
        assert Detection.query.count() == before

    def test_usable_response_with_untidy_fields_is_normalised_not_embellished(self, rapp, rclient):
        content = ('<think>hidden reasoning</think>```json\n{"verdict": "FAKE", "deepfake_probability": 250, '
                   '"indicators": [{"name": "Seam", "score": 80, "severity": "extreme", "evidence": null}, '
                   '{"severity": "high"}, "junk"], "explanation": null}\n```')
        resp = self.post(rclient, mock.patch('app.ai.groq_analyzer._get_client',
                                             return_value=_FakeGroqClient(content)))
        assert resp.status_code == 200, resp.get_json()
        det = resp.get_json()['data']
        assert det['result'] == 'deepfake' and det['deepfakeProbability'] == 100.0
        assert det['indicators'] == [{'name': 'Seam', 'severity': 'medium', 'score': 0.8, 'evidence': None}]
        assert det['explanation'] is None
        assert det['model'] == 'qwen/test-vision-model (Groq)' and det['analysis']['provider'] == 'Groq Cloud'
