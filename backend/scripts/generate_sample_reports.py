"""
FAKENIX 2.0 — Generate sample forensic reports

Runs the real pipeline (upload -> detection -> evidence -> report -> download)
against an isolated in-memory database and temporary storage, and writes the
downloaded PDFs to an output folder for visual inspection. The development
database, uploads and existing reports are not touched.

Usage (from backend/):
    uv run python scripts/generate_sample_reports.py            # demo-labelled samples only
    uv run python scripts/generate_sample_reports.py --live     # sample 1 is analysed by the configured Groq model

Nothing is simulated silently: without --live every sample is a record flagged
is_demo and its PDF says so. With --live the first sample is a real model result
for a synthetic image (one Groq API call using GROQ_API_KEY from backend/.env).
"""
import argparse
import hashlib
import io
import json
import os
import shutil
import sys
import tempfile

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND_DIR)


def synthetic_image(fmt: str, background) -> bytes:
    from PIL import Image, ImageDraw
    img = Image.new('RGB', (640, 480), background)
    draw = ImageDraw.Draw(img)
    draw.ellipse((220, 90, 420, 350), fill=(225, 190, 160))
    draw.rectangle((0, 400, 640, 480), fill=(40, 40, 40))
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


def add_demo_record(app, name: str, data: bytes, result: str, probability: float, risk: str) -> str:
    """Store a synthetic file as evidence for a detection that is explicitly flagged as demo."""
    from app.extensions import db
    from app.models.detection import Detection
    from app.services.evidence_service import create_evidence_record
    from app.services.hashing_service import calculate_md5, calculate_sha256
    from app.services.image_service import get_file_size_display
    from app.services.metadata_service import extract_basic_metadata, extract_image_metadata, merge_file_metadata

    stored_name = f'{hashlib.sha256(data).hexdigest()[:32]}{os.path.splitext(name)[1]}'
    path = os.path.join(app.config['UPLOAD_FOLDER'], stored_name)
    with open(path, 'wb') as f:
        f.write(data)
    meta = merge_file_metadata(extract_image_metadata(path), extract_basic_metadata(path, name))

    detection = Detection(
        detection_uid=f'det_sample_{result}', user_id=None, file_name=name, file_type='image',
        file_size=get_file_size_display(path), resolution=meta.get('resolution'),
        result=result, confidence=probability, deepfake_probability=probability,
        real_probability=round(100 - probability, 1), risk_level=risk,
        model_name='DEMO ANALYSIS (simulated)', is_demo=True, status='complete',
        indicators_json=json.dumps([{'name': 'Placeholder indicator', 'score': 0.48, 'severity': 'medium'}]),
        frames_json='[]', metadata_json=json.dumps(meta),
    )
    db.session.add(detection)
    db.session.flush()
    create_evidence_record(detection=detection, file_path=stored_name, sha256_hash=calculate_sha256(path),
                           md5_hash=calculate_md5(path), file_name=name, file_type='image', metadata=meta,
                           uploaded_by='Sample generator')
    return detection.detection_uid


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--out', default=os.path.join(BACKEND_DIR, '..', 'docs', 'sample_reports'))
    parser.add_argument('--live', action='store_true', help='analyse sample 1 with the configured Groq model')
    args = parser.parse_args()
    out_dir = os.path.abspath(args.out)
    os.makedirs(out_dir, exist_ok=True)

    from app import create_app
    from app.extensions import db
    from app.models.detection import Detection

    app = create_app('testing')  # in-memory SQLite
    storage = tempfile.mkdtemp(prefix='fakenix_samples_')
    app.config.update(UPLOAD_FOLDER=os.path.join(storage, 'uploads'), REPORT_FOLDER=os.path.join(storage, 'reports'))
    os.makedirs(app.config['UPLOAD_FOLDER'])
    os.makedirs(app.config['REPORT_FOLDER'])

    # (file name, bytes) — sample 1 is JPEG data deliberately named .png
    files = [('sample_portrait.png', synthetic_image('JPEG', (70, 110, 160))),
             ('sample_scene.png', synthetic_image('PNG', (150, 90, 60)))]
    summary, failed = [], False

    try:
        with app.app_context():
            db.create_all()
            client = app.test_client()

            detection_ids = []
            if args.live:
                resp = client.post('/api/detect/image', content_type='multipart/form-data',
                                   data={'file': (io.BytesIO(files[0][1]), files[0][0])})
                body = resp.get_json()
                if resp.status_code != 200:
                    print(f'Live analysis failed ({resp.status_code}): {body.get("message")}')
                    return 1
                detection_ids.append(body['data']['id'])
            else:
                detection_ids.append(add_demo_record(app, *files[0], result='real', probability=18.5, risk='low'))
            detection_ids.append(add_demo_record(app, *files[1], result='suspicious', probability=47.4, risk='medium'))

            for detection_id, (name, data) in zip(detection_ids, files):
                report = client.post('/api/reports', json={'detectionId': detection_id}).get_json()['data']
                first = client.get(f'/api/reports/{report["reportId"]}/download')
                again = client.get(f'/api/reports/{report["reportId"]}/download')
                detection = Detection.query.filter_by(detection_uid=detection_id).one().to_dict()
                target = os.path.join(out_dir, f'{report["reportId"]}.pdf')
                with open(target, 'wb') as f:
                    f.write(first.data)

                checks = {
                    'download is application/pdf': first.status_code == 200 and first.mimetype == 'application/pdf',
                    'body is a PDF': first.data.startswith(b'%PDF-'),
                    'repeat download identical': first.data == again.data,
                    'report belongs to detection': report['detectionId'] == detection_id,
                }
                try:
                    from pypdf import PdfReader
                    text = ''.join(' '.join(p.extract_text() for p in PdfReader(io.BytesIO(first.data)).pages).split())
                    checks['PDF shows this report ID'] = report['reportId'] in text
                    checks['PDF shows the SHA-256 of the sample file'] = hashlib.sha256(data).hexdigest() in text
                    checks['demo is labelled'] = ('DEMO/SIMULATEDANALYSIS' in text) == bool(report['isDemo'])
                except ImportError:
                    print('pypdf not installed (uv sync --group dev): PDF text checks skipped')
                failed = failed or not all(checks.values())
                summary.append((report, detection, name, target, checks))

            ids = [s[0]['reportId'] for s in summary]
            unique = len(set(ids)) == len(ids)
            failed = failed or not unique
            db.session.remove()
    finally:
        shutil.rmtree(storage, ignore_errors=True)

    for report, detection, name, target, checks in summary:
        print(f'\n{report["reportId"]}  ->  {target}')
        print(f'  file: {name} | verdict: {report["detection"]} | likelihood: {report["deepfakeProbability"]}% '
              f'| demo: {report["isDemo"]} | model: {detection.get("model")}')
        for label, ok in checks.items():
            print(f'  [{"ok" if ok else "FAIL"}] {label}')
    print(f'\n[{"ok" if unique else "FAIL"}] report IDs are unique: {ids}')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
