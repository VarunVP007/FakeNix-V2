# FAKENIX 2.0 — Mini Technical Audit & Component Health Check

| | |
|---|---|
| **Audit date** | 9 October 2026 |
| **Commit audited** | `9fef523` on `main` (working tree clean before and after) |
| **Platform** | Windows 11, Python 3.12.13 (uv-managed venv), Node 24.5.0, Microsoft Edge 154 (headless) |
| **Scope** | Existing code only. No application code was changed. The only repository change is this file. |

---

## 1. Executive Summary

The core pipeline works. In live tests an uploaded image or video was validated, sent to the Groq-hosted Qwen vision model, hashed with SHA-256, stored in the database, shown in the React UI, and downloaded as a PDF through a real browser. Frontend and backend both start, and 62 of 65 backend tests pass.

The application should not yet be presented as a working forensic prototype, for three reasons that were each reproduced by test:

1. **The PDF service fabricates forensic content.** Asking for a report on a detection that does not exist, or downloading a report ID that does not exist, returns HTTP 200 and a valid PDF with the verdict "FAKE, 94.2 % confidence", invented indicators, and the SHA-256 of an empty file. The fake detection is also saved into the user's history. Reports for genuine detections also contain invented fields: "Detected Face Count: 1", indicator rows the model never returned, a canned "Observations" paragraph, and "Integrity Status: MATCHED", which is printed even after the evidence file failed verification.
2. **Authentication is not enforced.** A request with no `Authorization` header is accepted on every protected endpoint. With `DEMO_MODE=true` (the current setting) it is treated as user 1; with `DEMO_MODE=false` it runs as an anonymous user. Only a malformed token with demo mode off is rejected.
3. **Users can see each other's data.** Any logged-in user can read, download and generate reports for another user's detections and read another user's evidence records. A brand-new user who opened the Reports page in the browser test was shown six reports belonging to other accounts.

No secrets are committed to git, and the Python dependencies have no known vulnerabilities. Detection accuracy was not evaluated; only synthetic test graphics were used.

**Status counts across the 19 audited components (section 4):** PASS 5, PARTIAL 7, FAIL 3, NOT VERIFIED 1, NOT IMPLEMENTED 3. No overall percentage score is given, because the components are not of equal weight.

---

## 2. Audit Scope and Methodology

**What was done**

| Activity | How |
|---|---|
| Source inspection | Read all backend routes, services, models, AI modules, config, tests and scripts; read the frontend router, API clients, hooks and the Reports, Result and Cybercrime pages. |
| Backend unit tests | `uv sync --locked`, then `uv run --locked pytest -v` (in-memory SQLite, temp storage). |
| API integration tests | A second backend instance on port **5055** with a scratch SQLite database and scratch storage folders; 90+ HTTP requests from a Python script. |
| In-process tests | Flask test client on a second scratch database for Groq failure modes, response-parsing edge cases, fresh-database behaviour and `DEMO_MODE=false`. |
| Live AI tests | Real requests to Groq with the configured key and model, using small synthetic graphics (a PNG and a 3-second MP4). Fourteen requests in total, including the two made by the test suite (section 16). |
| Browser tests | Headless Microsoft Edge driven by `playwright-core` (installed in a temp folder, not in the repo) against a second Vite dev server on port **5173** pointed at the isolated backend. |
| PDF inspection | Downloaded PDFs were parsed with `pypdf` and their text compared with the API results. |
| Dependency scans | `npm audit` (frontend) and `pip-audit` on the exported lockfile (backend). |

**Data-safety measures**

- The app was already running on this machine (Vite on port 3000, Flask on port 5000, using the real development database). That instance received only two read-only requests: `GET /api/health` and a `GET /` on the frontend.
- All write tests ran against scratch databases and scratch storage folders outside the repository.
- SHA-256 hashes of `backend/instance/fakenix_dev.db` and all 22 files under `backend/storage/` were recorded before testing and re-checked afterwards: **23 of 23 unchanged**.
- The development database was opened once in SQLite read-only mode to collect aggregate counts. No personal data was read into this report.
- The frontend production build was written to a temp folder, so no `frontend/dist/` was created.

**Environment changes made by the audit**

- `backend/.venv` existed but was empty; `uv sync --locked` installed the 51 locked packages into it. `uv.lock` and `package-lock.json` are unchanged.
- Two Python 3.12 bytecode cache files created by the audit were deleted afterwards.

**Status labels** follow the definitions in the audit brief: PASS, PARTIAL, FAIL, NOT VERIFIED, NOT IMPLEMENTED. Nothing is marked PASS on the basis of source code alone.

---

## 3. Repository and Architecture Overview

The layout matches the expected structure, with two differences: there is no `migrations/versions/` directory, and there is no `backend/models/` directory (no local model weights).

```text
FakeNix-v1/
├── backend/
│   ├── app/
│   │   ├── __init__.py          app factory, CORS, blueprints, error handlers
│   │   ├── config.py            Development / Testing / Production config
│   │   ├── ai/                  groq_analyzer.py (in use); model_loader, image_predictor,
│   │   │                        video_predictor, gradcam, preprocessing (unreachable)
│   │   ├── models/              User, Detection, Evidence, Report, CybercrimeReport
│   │   ├── routes/              auth, detection, evidence, report, cybercrime, user, dashboard
│   │   ├── services/            detection, evidence, hashing, metadata, image, video, report,
│   │   │                        cybercrime, auth, dashboard; url_service (unused)
│   │   └── utils/               decorators (auth), validators, response, ids
│   ├── migrations/              Alembic scaffold only — no revision files
│   ├── scripts/                 init_db.py, seed_demo_data.py
│   ├── tests/                   65 tests in 5 files
│   └── run.py, pyproject.toml, uv.lock
├── frontend/
│   └── src/                     App.jsx (router), 18 pages, services/ (axios clients), hooks/, utils/
└── README.md
```

**Request flow for an upload**

```text
React page → axios POST /api/detect/image|video
  → extension + magic-byte check (images) / extension check only (videos)
  → file saved under a random UUID name
  → SHA-256 + MD5 of the saved file
  → metadata (Pillow / OpenCV)
  → Groq chat completion with the image, or 2 sampled video frames
  → JSON answer validated → Detection + Evidence rows committed
  → result JSON → Result page → POST /api/reports → GET /api/reports/<id>/download (ReportLab PDF)
```

**API surface (28 route registrations):** `/`, `/api`, `/api/health`; `/api/auth/{register,login,me,logout}`; `/api/detect/{image,video,url}`; `/api/detections`, `/api/detections/<id>` (GET, DELETE), `/api/detections/trend`; `/api/dashboard/detection-trend`; `/api/evidence`, `/api/evidence/<id>`, `/api/evidence/<id>/verify`; `/api/reports` (GET, POST), `/api/reports/<id>`, `/api/reports/<id>/download`; `/api/cybercrime/report`, `/api/cybercrime/reports`, `/api/cybercrime/reports/<id>`; `/api/user/profile` (GET, PUT).

**Frontend routes:** public `/`, `/login`, `/register`; protected `/dashboard`, `/detect`, `/detect/image`, `/detect/video`, `/result/:id`, `/result/:id/frames`, `/history`, `/evidence`, `/reports`, `/cybercrime/report`, `/awareness`, `/resources`, `/settings`, `/notifications`. `/detect/url` redirects to `/detect`.

**Configuration in effect (values not shown):** `FLASK_ENV=development` (debug on), `DEMO_MODE=true`, SQLite database, Groq key and model set, custom `SECRET_KEY` and `JWT_SECRET_KEY` (48 characters each, not the built-in defaults, different from each other). There is no `frontend/.env`, so the frontend uses its default API base URL `http://localhost:5000/api`.

---

## 4. Component-by-Component Health Table

| Component | Status | Test Performed | Observed Result | Issue / Recommendation |
|---|---|---|---|---|
| Frontend startup | **PASS** | `npm run build`; Vite dev server; 11 protected routes opened in headless Edge | Build succeeded (2,386 modules, 18 s). Dev server ready in 0.4 s. Every route rendered its heading. No console errors apart from the expected 401 on a wrong-password login. | Single 832 kB JS bundle (build warning). `npm run lint` fails because ESLint is not installed. |
| Backend startup | **PASS** | Started `run.py` on port 5055; `GET /api/health`, `/`, `/api` | Started in about 1 s; health returned 200 JSON. The already-running instance on port 5000 also returned healthy. | Runs with the Werkzeug debugger active. The instance on port 5000 was launched with system Python 3.14, outside the project's `>=3.10,<3.13` range. |
| Image analysis | **PASS** | Live upload of a synthetic PNG through the API and through the browser | 200 in about 2 s; verdict, probability, risk, model name and explanation returned and stored; result page rendered. | Functional only — see "Detection accuracy". Uploaded file is left on disk when analysis fails. |
| Video analysis | **PARTIAL** | Live upload of a 3 s synthetic MP4 through the API and the browser | 200 in 7–17 s; 2 frames sampled (frames 10 and 20), per-frame results returned; frames page rendered. | Only 2 frames are examined per video regardless of length. No content check: a text file renamed `.mp4` is accepted, saved, and only then fails with 502. |
| Groq/Qwen connection | **PASS** | Live calls with the configured key and model; forced failures | Model `qwen/qwen3.8-27b` answered. Missing key, missing model, rejected key, unknown model, 1 ms timeout and unreachable network each returned 502 with a specific message and no stored detection. | A non-object JSON answer raises an unhandled `AttributeError` (generic 500). |
| Metadata extraction | **PARTIAL** | Compared API metadata with the known properties of the test files | Image: format, width, height, MIME, size, EXIF flag correct. Video: resolution, fps, duration (0:03) correct. | Video `codec`, `bitrate`, `audioCodec` are always null. "MP4 (H.264)" is inferred from the file extension (the test file was MPEG-4 Part 2). `pymediainfo` is a dependency but is never used. |
| SHA-256 evidence | **PARTIAL** | Compared API hash with a locally computed hash; re-upload; modified file; tampered stored copy | Hash equals the hash of the original bytes (image and video). Same file → same hash. Modified file → different hash. Stored in DB and linked to the right detection. `verify` reported `failed` after the stored file was altered. | Hashing itself is correct. Marked PARTIAL because evidence records are also created with a placeholder hash for non-existent detections, and any user can read or re-verify another user's evidence. |
| Database persistence | **PARTIAL** | Create/read/delete through the API; read-only inspection of the dev database | Users, detections, evidence, reports and cybercrime reports persist and reload. Deleting a detection removes its evidence and report rows. | No migration revisions exist. Each re-upload creates a new detection and evidence row. Files are never removed from disk. Opening the Reports page on an empty database inserts three fake detections. |
| PDF generation | **FAIL** | Generated reports for a real image, a real video, tampered evidence, a missing detection and a random URL result; parsed each PDF | Files are valid 2-page PDFs and carry the correct report ID, verdict, model name and SHA-256 for real detections. | Content is partly or wholly fabricated (section 9). A missing detection yields a complete "FAKE 94.2 %" report. |
| PDF download | **PARTIAL** | API download; clicked "Download Forensic Report" and the Reports-page button in headless Edge | Browser saved `FX-RPT-2026-008.pdf` (5,332 bytes, starts with `%PDF-`). `Content-Type: application/pdf`, `Content-Disposition: attachment; filename=FX-RPT-2026-001.pdf`. | An invalid report ID returns 200 and a fabricated PDF instead of 404. Any user can download any report. |
| Cybercrime reporting | **PARTIAL** | Form validation and submit in the browser; API validation, persistence, ownership | Form blocks an empty submit, then shows reference `CC-2026-005`. API stores all fields; user B cannot read user A's report. | Server accepts a 1-character description, a future date, a `javascript:` URL and a non-existent evidence ID. With no token, user 1's reports (including complainant contact details) are returned. |
| Security configuration | **FAIL** | Token handling, cross-user requests, debugger probe, git history, dependency scans | `.env` is git-ignored and was never committed; no key in tracked files; CORS restricted to known origins. | Authentication not enforced; cross-user access; debugger console reachable (section 11). |
| Authentication & access control | **FAIL** | Requests with no token, a garbage token, and another user's token | Registration, login, duplicate-email and wrong-password handling work. Detections and cybercrime reports are owner-scoped. | No token is accepted everywhere; reports and evidence are not owner-scoped. Three test-suite failures are in this area. |
| Detection history | **PASS** | `GET /api/detections`, `GET /api/detections/<id>`, History page in the browser | New detections listed with hash, evidence ID and explanation; result page reloads from the API after a hard refresh. | — |
| Backend automated tests | **PARTIAL** | `uv run --locked pytest -v` | 62 passed, 3 failed, 32 s. | The suite calls the live Groq API (2 requests per run), so it needs a key and network access. |
| URL analysis | **NOT IMPLEMENTED** | `POST /api/detect/url` with demo mode on and off | Demo off: 501 "not yet implemented". Demo on: 200 with a **random** verdict (same URL gave `real 9.6 %` then `suspicious 57.2 %`), stored as a detection. | The frontend no longer links to it, but the endpoint is live. `url_service.py` (343 lines) is never imported. |
| Local EfficientNet / Grad-CAM model | **NOT IMPLEMENTED** | Import graph and file check | `model_loader`, `image_predictor`, `video_predictor`, `gradcam`, `preprocessing` are not imported by any route or service. TensorFlow is not a dependency and no model file exists. | PDFs for fabricated reports still name "EfficientNet-B4 + Qwen Vision" as the model. |
| Database migrations | **NOT IMPLEMENTED** | `flask db current`, `flask db upgrade` on a scratch DB | Both ran and did nothing: there are no revision files. Tables come from `db.create_all()` at startup. | `migrations/versions/` is listed in `backend/.gitignore`, so revisions could never be committed. |
| Detection accuracy | **NOT VERIFIED** | — | Only synthetic geometric graphics were analysed. | Needs a labelled set of real and manipulated media. |

**Summary of the 19 rows**

| PASS | PARTIAL | FAIL | NOT VERIFIED | NOT IMPLEMENTED |
|---|---|---|---|---|
| 5 | 7 | 3 | 1 | 3 |

---

## 5. Backend Test Results

### 5.1 Existing test suite

`uv run --locked pytest -v` → **62 passed, 3 failed** in 31.8 s.

| Failing test | Expected | Actual | Cause |
|---|---|---|---|
| `tests/test_auth.py::TestProfile::test_me_unauthenticated` | 401 | 200 | `demo_mode_optional` treats a missing token as user 1 when `DEMO_MODE` is true (the testing config forces it on). |
| `tests/test_detection.py::TestImageDetection::test_detection_unauthenticated` | 401 | 200 | Same cause. |
| `tests/test_database.py::TestOwnershipChecks::test_report_not_visible_to_other_user` | `None` | the report | `get_report_by_uid` accepts `user_id` but never uses it. |

The two image-upload tests passed by calling the real Groq API.

### 5.2 Startup, routing and response format

| Test | Result |
|---|---|
| `GET /api/health`, `GET /`, `GET /api` | 200, consistent `{success, …}` JSON |
| Unknown route | 404 `{"success": false, "message": "Resource not found"}` |
| `POST /api/health` (wrong method) | **500** "An unexpected error occurred." — should be 405 |
| CORS preflight from `http://localhost:3000` and `:5173` | Allowed, credentials allowed |
| CORS preflight from `http://evil.example` | No `Access-Control-Allow-Origin` header returned |
| Request body larger than `MAX_CONTENT_LENGTH` | 413 JSON message (handler verified with the limit lowered to 1 kB in-process; the configured 100 MB value was not exercised) |

### 5.3 Input validation

| Test | Result |
|---|---|
| Image: no file | 400 |
| Image: `.pdf` extension | 400 "Unsupported file extension" |
| Image: text renamed `.png` | 400 (magic-byte check) |
| Image: empty `.png` | 400 |
| Image: PNG signature followed by random bytes | 502 "The image could not be read for AI analysis." — **file left in uploads** |
| Video: no file / `.png` sent to video endpoint | 400 |
| Video: text renamed `.mp4` | 502 "The video could not be opened for AI analysis." — **file left in uploads** |
| Register: empty body, invalid e-mail, duplicate e-mail | 400 with field messages |
| Login: wrong password | 401 "Invalid email or password." |
| Report: missing `detectionId` | 400 |
| Trend: `days` out of range or non-numeric | 400 (covered by the existing suite) |

### 5.4 Authentication behaviour

| Request | `DEMO_MODE=true` (current) | `DEMO_MODE=false` |
|---|---|---|
| Valid token | 200 as that user | 200 as that user |
| No `Authorization` header | **200 as user 1** | **200 as an anonymous user** (`user_id = None`) |
| Malformed token | **200 as user 1** | 401 |
| `PUT /api/user/profile`, no token | **200 — user 1's profile modified** | 400 "User not found." |
| `POST /api/reports` for a missing detection, no token | 201 fabricated report | **201 fabricated report** |
| `POST /api/cybercrime/report`, no token | 201, stored under user 1 | **201, stored with no owner** |

---

## 6. Frontend Test Results

### 6.1 Build and tooling

| Command | Result |
|---|---|
| `npm ls --depth=0` | All 10 declared packages installed; no missing or extraneous packages |
| `npm run build` | **Success.** `index.html` 1.35 kB, CSS 43.8 kB, JS 832.4 kB (gzip 232.7 kB). Warning: chunk larger than 500 kB. |
| `npm run lint` | **Fails:** `'eslint' is not recognized` — ESLint is not in `devDependencies`. |
| `npm audit` | 5 advisories: 2 high (`vite`, `source-map-js`), 3 moderate (`esbuild`, `react-router`, `react-router-dom`). All but `react-router` concern the dev/build toolchain. |

### 6.2 Browser run (headless Edge 154)

Run against a Vite dev server on port 5173 with `VITE_API_BASE_URL` pointed at the isolated backend. Port 3000, the port configured in `vite.config.js`, was occupied by the already-running instance, which was not driven.

| Step | Result |
|---|---|
| Landing page renders | OK |
| `/dashboard` while logged out → redirect to `/login` | OK |
| Unknown route shows the 404 page | OK |
| Wrong credentials show "Invalid email or password." and stay on `/login` | OK |
| Register through the form → `/dashboard` | OK |
| Navigate `/detect`, `/detect/image`, `/detect/video`, `/history`, `/evidence`, `/reports`, `/cybercrime/report`, `/awareness`, `/resources`, `/settings`, `/notifications` | All 11 rendered |
| Reports page as a brand-new user | **Listed 6 reports belonging to other users** |
| Unsupported file type selected | Rejected in the browser: "Unsupported format." |
| Image upload → analysis → `/result/<id>` | OK. Banner "AUTHENTIC MEDIA 0.0 % DEEPFAKE PROBABILITY", model name, and the model's own explanation shown |
| Result page after a hard reload | OK, re-fetched from the API |
| "Download Forensic Report" on the result page | OK, PDF file saved |
| Download button on the Reports page | OK, PDF file saved |
| History page lists the upload; Evidence page shows the evidence ID | OK |
| Video upload → result → frames page | OK. "Frames analyzed: 2"; hash on the Evidence tab equals the local SHA-256 of the uploaded file |
| Cybercrime form: empty submit | Blocked; both validation messages shown |
| Cybercrime form: valid submit | Reference `CC-2026-005` shown |
| Token removed → protected route | Redirect to `/login` |

**Console errors and failed requests:** one, the expected 401 from the wrong-password login. No JavaScript exceptions.

**Not covered in the browser:** Settings save, Notifications actions, History CSV export, frame JSON export, the print view of a cybercrime report, drag-and-drop upload, and mobile layouts.

---

## 7. AI/Groq/Qwen Integration Status

| Check | Status | Evidence |
|---|---|---|
| Client initialisation | PASS | `groq` SDK client created per request with a 90 s timeout and 2 retries |
| `GROQ_API_KEY` configured | PASS | Present in `backend/.env`; value not recorded here |
| Model availability | PASS | `qwen/qwen3.8-27b` answered live requests |
| Image workflow | PASS | Image downscaled to at most 1280 px, sent as base64 JPEG; structured JSON returned |
| Video frame extraction | PASS | 2 evenly spaced frames (positions 10 and 20 of 30) sent in one request |
| Response parsing | PARTIAL | `<think>` blocks and code fences stripped; empty, non-JSON, missing-probability and invalid-verdict answers raise a handled error. A JSON **array** raises an unhandled `AttributeError`. |
| REAL/FAKE mapping | PARTIAL | `real→real`, `fake→deepfake`, `uncertain→suspicious`. The verdict and probability are **not cross-checked**: `verdict=real, probability=97` is stored as result `real` with risk `critical`; `verdict=fake, probability=3` is stored as `deepfake` with risk `low`. |
| Timeout and failure handling | PASS | Six failure modes each returned 502 with a specific message; no detection row was stored |
| Demo/hard-coded results on upload | PASS | Upload results carry `isDemo: false` and the Groq model name; there is no fallback path in `detection_service._run_inference` |

**How the confidence value is produced.** The number shown as "confidence" / "deepfake probability" is the `deepfake_probability` field written by the language model. It is clamped to 0–100 and rounded; nothing else is computed. "Real probability" is simply `100 − that number`. The risk level is derived from it by fixed thresholds (below 30 low, below 70 medium, below 95 high, otherwise critical). It is therefore a model-stated estimate, not a calibrated or measured probability, and should be labelled as such in the UI and reports.

**Repeatability.** The same PNG uploaded twice returned the same verdict and probability (`real`, 0.0). That is a sample of two at temperature 0.1 and is not evidence of general determinism.

**Behaviour on non-photographic input.** For the synthetic graphics the model correctly stated that the media is "a simple graphic illustration … rather than a photograph". The pipeline nonetheless stores verdict `real`, the UI shows "AUTHENTIC MEDIA", and the PDF is titled "Certificate of Authenticity". A "not applicable" outcome does not exist.

**Not verified.** Accuracy on real or manipulated photographs and videos; behaviour on large files, long videos, or under Groq rate limiting (429).

---

## 8. Database and Evidence Integrity Results

### 8.1 Evidence hashing

| Check | Result |
|---|---|
| Hash computed from original bytes | PASS — the hash is taken from the saved upload; the API value equalled the locally computed SHA-256 of the bytes sent (image and video) |
| Same file → same hash | PASS |
| Modified file → different hash | PASS |
| Hash saved to the database | PASS — returned by `GET /api/detections/<id>` and `GET /api/evidence` |
| Evidence linked to the correct detection and report | PASS — evidence `detectionId`, report `detectionId` and report `evidenceId` all matched |
| Re-verification of an untouched file | PASS — `match: true`, status `verified` |
| Re-verification after the stored copy was altered | PASS — `match: false`, status `failed` |
| Evidence only created for real files | **FAIL** — a report request for a missing detection, or for a URL "detection", creates an evidence row with SHA-256 `e3b0c442…b855` and MD5 `d41d8cd9…427e`, the hashes of zero bytes, with status `verified` |
| Evidence access restricted to its owner | **FAIL** — user B read user A's evidence record and triggered its verification |

Chain-of-custody entries ("Uploaded", "Analyzed", "Evidence Hash Generated") are written at creation with the same timestamp. Later verifications, downloads and report generation are not appended.

### 8.2 Database

| Check | Result |
|---|---|
| Connection and initialisation | PASS — tables created at startup by `db.create_all()` |
| Schema vs. migrations | **NOT IMPLEMENTED** — no revision files; `flask db upgrade` is a no-op; no `alembic_version` table |
| Models present | User, Detection, Evidence, Report, CybercrimeReport |
| Record creation and retrieval | PASS for all five |
| Relationships and cascade | PASS — deleting a detection removed its evidence and report rows |
| Files on delete | **Not removed** — upload count 6 → 6 and report PDFs 7 → 7 after the delete |
| Duplicate records | Every upload of the same file creates a new detection and evidence row. A second report request for the same detection correctly returns the existing report. |
| Transaction failure on analysis error | PASS — no detection row is stored when the AI call fails, but the uploaded file stays on disk |
| MySQL | NOT VERIFIED — only SQLite was available. `README.md` refers to `scripts/mysql_setup.sql`, which does not exist. |

### 8.3 State of the existing development database (read-only, aggregate)

| Item | Count |
|---|---|
| Users / detections / evidence / reports / cybercrime reports | 1 / 8 / 8 / 1 / 2 |
| Detections produced by the Groq model | 4 |
| Detections flagged `is_demo` (simulated results from earlier code) | 4 |
| Evidence rows / distinct SHA-256 values | 8 / 5 |
| Evidence rows with the zero-byte placeholder hash | 0 |
| Files in `storage/uploads` / referenced by an evidence row / unreferenced | 20 / 6 / 14 |
| Evidence rows whose file is missing from disk | 1 |
| The single stored report | Belongs to a simulated (`is_demo`) detection |
| PDFs in `storage/reports` | 2, of which 1 has no database row |

---

## 9. PDF Generation and Download Results

### 9.1 What works

| Check | Result |
|---|---|
| Report created for a real detection | 201, `FX-RPT-2026-001`, status `ready` |
| Report ID format and uniqueness | Sequential `FX-RPT-<year>-NNN`; a repeat request returned the same report |
| File validity | Starts with `%PDF-`, ends with `%%EOF`, 2 pages, parsed without error |
| MIME type and filename | `application/pdf`; `attachment; filename=FX-RPT-2026-001.pdf` |
| Correct fields for a real detection | Report ID, evidence ID, verdict, model name, deepfake probability, file name, resolution, video duration, SHA-256 and MD5 all matched the API result |
| Frontend download code | `responseType: 'blob'`, content-type check, `URL.createObjectURL` + temporary `<a download>`; JSON error bodies are decoded from the blob |
| Click produces a file | Verified in headless Edge from both the result page and the Reports page |
| File opens | Verified by parsing with `pypdf`. Not opened in a desktop PDF viewer. |

### 9.2 What fails

**A. Reports for things that do not exist** (`report_service.generate_report`, lines 53–93; `report_routes.download_report`, lines 77–80)

| Request | Response |
|---|---|
| `POST /api/reports {"detectionId": "det_does_not_exist"}` | **201.** Report `FX-RPT-2026-005`: Deepfake, 94.2 %, high risk, file `uploaded_media.jpg`, evidence `FX-2026-00005` |
| `GET /api/reports/FX-RPT-9999-999/download` | **200 `application/pdf`**, filename `FX-RPT-2026-006.pdf` |
| `GET /api/reports/FX-RPT-9999-999` | 404 (the record lookup is correct; only the download path fabricates) |

Text of the PDF returned for the invalid report ID: "VERDICT: FAKE … Confidence 94.2 % … AI Model: EfficientNet-B4 + Qwen Vision … File Name: uploaded_media.jpg … 2.4 MB … 1920x1080 … SHA-256 e3b0c442…b855 … Integrity Status: MATCHED … Facial Texture Inconsistency 94 % HIGH, Lighting Inconsistency 88 % HIGH, Edge Blending Artifacts 82 % MEDIUM". None of it corresponds to any file. Both fake detections then appeared in the user's detection history.

**B. Invented fields in reports for real detections** (`report_service._generate_pdf`)

| PDF field | What is printed | Actual source |
|---|---|---|
| Detected Face Count | `1` | Hard-coded (line 368). No face detection exists. |
| Face Detection Status | `Verified` / `Detected` | Derived from the verdict (line 367) |
| Forensic indicators (when the model returned none) | "Facial Texture Consistency 5 %", "Lighting Uniformity 2 %" | Hard-coded (lines 395–406). The UI for the same detection says "No specific indicators were reported". |
| Observations & Findings | "No synthetic manipulation detected. Facial keypoints and temporal coherence conform to natural unedited media…" or a GAN-artefact sentence | Hard-coded by verdict (lines 438–441). **The model's real explanation, which the UI shows, is not in the PDF.** |
| Cryptographic Integrity → Integrity Status | "MATCHED — Cryptographic verification complete & tamper-evident." | Hard-coded (line 314). Printed in a report generated **after** the evidence failed verification; the same PDF's header said "Integrity Status: FAILED". |
| Inference Provider | "FAKENIX Deep Learning Pipeline / Groq" | Hard-coded |
| Missing values in general | `94.2`, `1920x1080`, `2.4 MB`, `investigation_sample.mp4`, `FX-2026-00142` | Fallback literals used whenever a field is empty |

**C. Incorrect values**

| Field | Printed | Correct |
|---|---|---|
| File Size (1.3 kB PNG) | `0.0` | 1.3 kB — `detection_service.py` line 52 stores the number `0.0` when the size rounds to 0.00 MB |
| MIME Type (PNG) | `image/jpeg` | `image/png` — the PDF reads `mime_type`, the pipeline stores `mimeType` |
| Integrity text | literal `&amp;` | `&` |
| Classification Verdict | "REAL (0.0 % Confidence)" | The number is the deepfake probability, not confidence in the verdict |
| Report title for a geometric test graphic | "Certificate of Authenticity" | The model said the media is not a photograph |
| URL "detection" report | File size 2.4 MB, 1920x1080, face count 1, zero-byte hash, "Certificate of Authenticity" | No file was ever downloaded or analysed |

**D. Sample data.** `GET /api/reports` on a database with no reports inserts three sample detections and reports (`investigation_sample.mp4` Deepfake 94.2 %, `official_speech_clip.mp4` Real 98.6 %, `profile_photo_analysis.jpg` Suspicious 68.4 %), writes three PDFs, and adds the three detections to the caller's history.

**E. Access.** User B downloaded user A's report, read its record, and generated a new report for one of user A's detections (stored as generated by B).

---

## 10. Cybercrime Reporting Status

The feature prepares and stores an incident record. It does not send anything to an authority, and both the API response and the UI say so.

| Check | Status | Result |
|---|---|---|
| Form validation (browser) | PASS | Description under 20 characters, bad URL, bad e-mail, future date and unticked declaration are blocked |
| Required fields (API) | PASS | Missing or whitespace-only `incidentType` / `description` → 400 with field errors |
| Submission and persistence | PASS | 201, `CC-2026-002`, status `prepared`; all fields returned unchanged by the list endpoint |
| History and retrieval | PASS | `GET /api/cybercrime/reports` and `/<id>` are owner-scoped; user B received 404 and an empty list |
| Server-side validation depth | PARTIAL | Accepted: a 1-character description, incident date `2999-01-01`, source URL `javascript:alert(1)`, any `incidentType` string |
| Evidence attachment | PARTIAL | `evidenceId` is a free-text field. A non-existent ID (`FX-0000-00000`) was accepted; ownership of the referenced evidence is not checked. No file attachment exists. |
| Access control | **FAIL** | With no token and demo mode on, a report was created under user 1, and the list call returned user 1's four reports including the `additionalInformation` field |
| Sensitive data handling | PARTIAL | Complainant name, e-mail, phone and suspect details are concatenated into the plain-text `additionalInformation` column |
| Non-JSON body | PASS | 400 with field errors |
| Error message for validation failure | Minor | The error object lists both `incidentType` and `incident_type` as required |

---

## 11. Security Findings

### 11.1 Secrets and configuration

| Check | Result |
|---|---|
| `.env` tracked by git | No. `backend/.env` is ignored; only the two `.env.example` files are tracked |
| `.env` ever committed | No commits touch it |
| Groq key in tracked files or history | None found (`git grep`, `git log -S`) |
| Database and uploads tracked | No — both ignored |
| `SECRET_KEY` / `JWT_SECRET_KEY` | Custom values, not the defaults in `config.py`. `config.py` falls back to known default strings when they are unset, with no startup failure. |
| Key printed in logs | Not found in 889 lines of server log |
| Tokens printed in logs | Not found |
| Personal data in logs | E-mail addresses are logged at INFO on registration (`auth_service.py` line 51) |
| Archives | No archive files in the repository. Any zip of the project folder would include `.env`, the database and all uploaded media, since they sit inside it. |

> **Audit disclosure.** While listing the variable names in `backend/.env`, the audit tooling displayed the Groq key value once in its own session output, because that line is written with spaces around `=` and was missed by the redaction pattern. The value was not written to this report, the repository, or any file. Rotating the key in the Groq console is recommended as a precaution.

### 11.2 Findings

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| S-1 | Critical | Protected endpoints accept requests with no token, in both demo and non-demo mode | Section 5.4 |
| S-2 | High | Reports and evidence are not restricted to their owner | Sections 8.1, 9.2 E |
| S-3 | High | `GET /api/reports` returns every user's reports when sample seeding collides with existing IDs | Browser run: new user saw 6 foreign reports |
| S-4 | Medium | Werkzeug debugger active: `GET /console` returned 200. It is PIN-protected and the server binds to 127.0.0.1 only, which limits exposure to this machine | `FLASK_ENV=development` → `debug=True` in `run.py` |
| S-5 | Medium | `DEMO_MODE=true` is the live setting; it maps anonymous and bad-token requests to user 1 | `utils/decorators.py` lines 30–55 |
| S-6 | Medium | Video uploads are validated by extension only | `image_service.validate_video_file` |
| S-7 | Low | URL validator can be bypassed with a decimal IP: `http://2130706433/x` (127.0.0.1) was accepted. No fetch is currently performed, so this is latent | `utils/validators.py` line 80 |
| S-8 | Low | No rate limiting on login, registration or uploads; minimum password length is 6 | — |
| S-9 | Low | JWT stored in `localStorage` | `frontend/src/services/api.js` |
| S-10 | Low | No security response headers; `Server: Werkzeug/…` banner exposed | Response headers |
| S-11 | Low | Frontend dependency advisories (section 6.1) | `npm audit` |

**Checked and found sound:** uploads are stored under random UUID names, so the original filename cannot influence the path; image uploads are checked by magic bytes; CORS does not allow arbitrary origins; passwords are hashed with Werkzeug and never returned; login gives the same message for unknown e-mail and wrong password; `pip-audit` found no known vulnerabilities in the 51 locked Python packages.

---

## 12. Bugs and Failure Reproduction Steps

Commands assume the backend at `http://127.0.0.1:5000` and `$T` holding a valid token. **Several of these write records; run them against a disposable database, not the development one.**

### BUG-01 — Fabricated report for a non-existent detection · Critical
- **Component:** PDF generation · `backend/app/services/report_service.py`, `generate_report()` lines 53–93
- **Reproduce:** `curl -X POST http://127.0.0.1:5000/api/reports -H "Authorization: Bearer $T" -H "Content-Type: application/json" -d '{"detectionId":"det_does_not_exist"}'`
- **Observed:** `201`, `"detection": "Deepfake", "confidence": 94.2, "risk": "high", "fileName": "uploaded_media.jpg"`. A detection and an evidence row with the zero-byte SHA-256 are saved.
- **Correction:** Return 404 when the detection is not found. Remove the fallback detection and fallback evidence blocks.

### BUG-02 — Download of an invalid report ID returns a fabricated PDF · Critical
- **Component:** PDF download · `backend/app/routes/report_routes.py`, `download_report()` lines 77–80
- **Reproduce:** `curl -i http://127.0.0.1:5000/api/reports/FX-RPT-9999-999/download -H "Authorization: Bearer $T"`
- **Observed:** `200`, `Content-Type: application/pdf`, a "VERDICT: FAKE 94.2 %" document.
- **Correction:** Return 404 when `get_report_by_uid` finds nothing; do not call `generate_report` with a report ID.

### BUG-03 — Real reports contain hard-coded forensic content · Critical
- **Component:** PDF generation · `report_service._generate_pdf()` lines 183, 225–226, 250–252, 280–285, 308–314, 367–368, 395–406, 438–441
- **Reproduce:** Upload any image, generate its report, read the PDF.
- **Observed:** Face count "1", invented indicator rows, canned observations, "Integrity Status: MATCHED" regardless of the evidence status; the model's explanation is absent.
- **Correction:** Print only stored values. Show "Not available" for empty fields. Print the stored `aiExplanation` and the evidence's real `integrity_status`. Remove the face rows until face detection exists.

### BUG-04 — Requests without a token are accepted · Critical
- **Component:** Authentication · `backend/app/utils/decorators.py`, `demo_mode_optional()` lines 30–55
- **Reproduce:** `curl http://127.0.0.1:5000/api/auth/me` and `curl http://127.0.0.1:5000/api/cybercrime/reports`
- **Observed:** `200` with user 1's profile and incident reports. With `DEMO_MODE=false`, list endpoints still return 200 and write endpoints still succeed.
- **Correction:** Require a valid JWT on all data endpoints (`verify_jwt_in_request()` without `optional=True`). If a demo is needed, use an explicit demo login that issues a real token.

### BUG-05 — Cross-user access to reports and evidence · High
- **Component:** Access control · `report_service.get_report_by_uid()` lines 572–579, `generate_report()`; `evidence_service.get_evidence_by_uid()` line 75, `verify_evidence()` line 83
- **Reproduce:** As user B, `GET /api/reports/<A's report>/download`, `GET /api/evidence/<A's evidence>`, `POST /api/reports {"detectionId": "<A's detection>"}`.
- **Observed:** 200, 200, 201.
- **Correction:** Filter by owner in each lookup, as `get_detection_by_uid` already does.

### BUG-06 — Reports list leaks all users' reports; sample data seeded on read · High
- **Component:** Reports · `report_service.get_all_reports()` lines 477–490, `_seed_sample_reports()`
- **Reproduce:** With at least one report in the database, register a new user and call `GET /api/reports`.
- **Observed:** All reports of all users. On an empty database, three fake detections, reports and PDFs are created instead.
- **Correction:** Return an empty list when the user has no reports. Move sample data to `scripts/seed_demo_data.py`.

### BUG-07 — URL endpoint returns random verdicts in demo mode · High
- **Component:** Detection · `detection_service.run_url_detection()` lines 151–215
- **Reproduce:** `POST /api/detect/url {"url":"https://example.com/clip.mp4"}` twice.
- **Observed:** `real 9.6` then `suspicious 57.2`; each saved as a detection and reportable as a PDF.
- **Correction:** Return 501 in all modes until the feature exists, or remove the route.

### BUG-08 — Three failing tests · Medium
- **Reproduce:** `cd backend && uv run pytest`
- **Observed:** See section 5.1. They fail for the reasons in BUG-04 and BUG-05 and should pass once those are fixed.

### BUG-09 — Verdict and probability are not cross-checked · Medium
- **Component:** AI parsing · `backend/app/ai/groq_analyzer.py`, `_build_result()` lines 266–287
- **Reproduce:** `_build_result({'verdict': 'real', 'deepfake_probability': 97}, 'm')`
- **Observed:** `{'result': 'real', 'confidence': 97.0, 'risk_level': 'critical'}`
- **Correction:** Reject or downgrade to `suspicious` when the verdict and the probability band disagree.

### BUG-10 — Non-object JSON from the model is unhandled · Medium
- **Component:** AI parsing · `groq_analyzer._build_result()`
- **Reproduce:** `_build_result(_extract_json('[1,2]'), 'm')`
- **Observed:** `AttributeError: 'list' object has no attribute 'get'` → generic 500 "Image analysis failed."
- **Correction:** Check `isinstance(answer, dict)` in `_extract_json` and raise `GroqAnalysisError`.

### BUG-11 — Uploaded files are never cleaned up · Medium
- **Component:** Storage · `detection_routes.detect_image()/detect_video()`, `detection_service.delete_detection()`
- **Reproduce:** Upload a corrupt image (502), or delete a detection, then list `storage/uploads`.
- **Observed:** The file remains. In the development storage 14 of 20 files have no evidence row.
- **Correction:** Delete the saved file when analysis fails; decide and implement a retention rule for deleted detections.

### BUG-12 — Wrong HTTP method returns 500 · Medium
- **Component:** Error handling · `backend/app/__init__.py`, `unhandled_exception()` line 215
- **Reproduce:** `curl -X POST http://127.0.0.1:5000/api/health`
- **Observed:** `500 {"message": "An unexpected error occurred."}` and a logged traceback.
- **Correction:** In the generic handler, return the original code for `werkzeug.exceptions.HTTPException`.

### BUG-13 — Incorrect values in PDF fields · Medium
- **Component:** `detection_service.py` lines 52 and 113; `report_service._generate_pdf()` lines 314, 340, 437
- **Observed:** File size "0.0" for files under about 5 kB; MIME "image/jpeg" for PNG; literal `&amp;`; "REAL (0.0 % Confidence)".
- **Correction:** Store the size from `get_file_size_display()`; read `mimeType`; pass the integrity text through a `Paragraph` or use a plain `&`; label the number "deepfake probability".

### BUG-14 — Video files validated by extension only · Medium
- **Component:** `image_service.validate_video_file()` line 44
- **Reproduce:** Upload a text file named `x.mp4`.
- **Observed:** File saved, hashed, then 502.
- **Correction:** Check container signatures (`ftyp`, `RIFF…AVI`, EBML) before saving.

### BUG-15 — No migration revisions · Medium
- **Component:** `backend/migrations/`, `backend/.gitignore` line 41
- **Reproduce:** `uv run flask --app run db upgrade`
- **Observed:** No output, no change. README sections describing `flask db upgrade` cannot work from a clone.
- **Correction:** Generate an initial revision and stop ignoring `migrations/versions/`.

### BUG-16 — Weak server-side validation of incident reports · Medium
- **Component:** `cybercrime_routes.submit_cybercrime_report()`, `cybercrime_service.create_cybercrime_report()` line 29
- **Reproduce:** `POST /api/cybercrime/report {"incidentType":"other","description":"x","evidenceId":"FX-0000-00000","incidentDate":"2999-01-01","sourceUrl":"javascript:alert(1)"}`
- **Observed:** 201.
- **Correction:** Mirror the frontend rules on the server; verify the evidence ID exists and belongs to the caller.

### BUG-17 — Lint script cannot run · Low
- **Reproduce:** `cd frontend && npm run lint` → `'eslint' is not recognized`.
- **Correction:** Add ESLint and its React plugins to `devDependencies`, or remove the script.

### BUG-18 — Documentation does not match the code · Low
- `frontend/README.md` describes a "client-side simulation engine" and lists PyTorch/TensorFlow, EfficientNet-B4, MesoInception-4 and ResNet-50; none is used.
- `backend/README.md` line 136 refers to `scripts/mysql_setup.sql`, which does not exist; line 403 lists `/api/detect/url` as JWT-protected.
- `Detection.model_name` defaults to `EfficientNet-B4`.
- The login page advertises demo credentials that exist only after running the seed script.

### BUG-19 — Unused code and dependencies · Low
- `app/services/url_service.py` (343 lines), `app/ai/{model_loader,image_predictor,video_predictor,gradcam,preprocessing}.py` and `app/services/database_service.py` are not imported by any route or service.
- `pymediainfo` is declared but unused. `MAX_FRAMES_EXTRACTED` and `FRAME_SAMPLE_INTERVAL` are unused settings; `MODEL_PATH` is read only by the unreachable `model_loader.py`.

---

## 13. Known Limitations

**Of the application**

- The verdict is the opinion of a general-purpose vision language model. There is no trained deepfake classifier, no face detection, no heat-map, and no frequency or noise analysis.
- The probability is a number the model writes, not a measurement.
- A video is judged from 2 frames by default. Audio is ignored.
- Images are downscaled to 1280 px and re-encoded as JPEG before analysis, which can remove fine artefacts.
- Every upload is sent to a third-party API (Groq). The registration page tells users that files are stored on the server; it does not mention the external service.
- Non-photographic media is reported as "authentic".
- The incident report is a prepared document only; nothing is submitted to any authority.
- The development server is single-process; analysis blocks a worker for the duration of the model call.

**Of this audit**

- Accuracy was not measured. Only synthetic graphics were used, and no images of real people.
- MySQL, the production configuration and a production WSGI server were not tested.
- The 100 MB upload limit was not exercised with a real 100 MB file.
- Groq rate-limit (429) and oversized-request (413) handling were read in code but not triggered.
- The instance already running on ports 3000/5000 was not driven beyond a health check, to avoid writing to real data.
- Browser checks used headless Edge only, at one desktop viewport.
- PDFs were validated by parsing, not by opening them in a desktop viewer.
- Frontend dependency advisories were listed, not analysed for exploitability.

---

## 14. Prioritized Recommendations

**Priority 1 — Secret exposure and evidence integrity**
1. Rotate the Groq API key (see the disclosure in section 11.1).
2. Remove the fallback evidence block so that an evidence row is created only from a real file (BUG-01).
3. Print the evidence's real integrity status in the PDF and re-verify the file when a report is generated (BUG-03).
4. Restrict evidence read and verify to the owner (BUG-05).

**Priority 2 — Startup and database reliability**
5. Run the backend through `uv run python run.py` so it uses the locked Python 3.12 environment rather than system Python 3.14.
6. Create an initial Alembic revision and commit `migrations/versions/` (BUG-15).
7. Return the correct status for HTTP errors in the generic handler (BUG-12).

**Priority 3 — Detection**
8. Reject contradictory verdict/probability pairs and non-object answers (BUG-09, BUG-10).
9. Validate video content before saving and delete files when analysis fails (BUG-14, BUG-11).
10. Disable `/api/detect/url` until it is implemented (BUG-07).
11. Add a "not applicable / not a photograph" outcome.

**Priority 4 — Fabricated reports**
12. Return 404 for unknown detections and unknown report IDs (BUG-01, BUG-02).
13. Remove every hard-coded value from `_generate_pdf`; include the model's explanation (BUG-03).
14. Stop seeding sample reports from `GET /api/reports` (BUG-06).
15. Mark any report built from an `is_demo` detection as a demo on every page, or refuse to generate it.

**Priority 5 — PDF download**
16. Fix the field errors listed in BUG-13.

**Priority 6 — Authentication and access control**
17. Require a valid token on all data endpoints; replace the demo bypass with a demo account (BUG-04).
18. Add owner filters to report lookups (BUG-05).
19. Run with `FLASK_ENV=production` and `DEMO_MODE=false` outside local development; fail at startup if the secret keys are unset.

**Priority 7 — Frontend and usability**
20. Label the probability as a model estimate in the UI and PDF.
21. Add ESLint or remove the lint script; split the bundle.
22. Tell users on the upload pages that media is sent to an external AI service.

**Priority 8 — Documentation and cleanup**
23. Correct the READMEs; remove unused modules and the unused dependency (BUG-18, BUG-19).
24. Mock the Groq client in the test suite so tests run offline; keep one opt-in live test.
25. Mirror cybercrime form validation on the server (BUG-16).

---

## 15. Final Readiness Assessment

| Question | Answer |
|---|---|
| Does the application start? | Yes, frontend and backend. |
| Does the upload → analysis → result → PDF path work? | Yes, verified live through the API and in a browser, for image and video. |
| Is the analysis real? | Yes for uploads: results come from the Groq model, not from demo data. No for URL analysis. |
| Can its forensic reports be relied on? | **No.** Reports contain invented content and can be produced for media that was never uploaded. |
| Is user data protected? | **No.** Authentication can be skipped and reports and evidence are readable across accounts. |
| Is detection accuracy known? | No. Not measured. |

**Must be resolved before presenting it as a working prototype:** BUG-01, BUG-02, BUG-03 (fabricated report content), BUG-04 (authentication), BUG-05 and BUG-06 (cross-user access and seeded sample data), BUG-07 (random URL verdicts). Until then a demonstration can show a PDF or a history entry that does not correspond to any analysed file.

**Should be resolved soon after:** BUG-08 to BUG-16.

**Acceptable for a prototype if stated openly:** the verdict is an LLM assessment of two frames or one downscaled image; accuracy is unmeasured; SQLite and the development server are used; incident reports are not sent anywhere.

With the seven blocking bugs fixed, the project would be a fair prototype of an LLM-assisted media triage tool with evidence hashing. It would not be a validated deepfake detector, and reports should not be described as forensic evidence.

---

## 16. Test Commands and Results

| # | Command (run from) | Result |
|---|---|---|
| 1 | `uv sync --locked` (`backend/`) | 51 packages installed into the existing empty `.venv`; lockfile unchanged |
| 2 | `uv run --locked pytest -v -p no:cacheprovider` (`backend/`) | 62 passed, 3 failed, 31.8 s |
| 3 | `npm ls --depth=0` (`frontend/`) | 10 packages, no problems |
| 4 | `npm run build -- --outDir <temp> --emptyOutDir` (`frontend/`) | Built in 18.1 s; chunk-size warning |
| 5 | `npm run lint` (`frontend/`) | Failed: ESLint not installed |
| 6 | `npm audit` (`frontend/`) | 5 advisories (2 high, 3 moderate) |
| 7 | `uv export --locked --no-dev` → `uvx pip-audit -r <file> --no-deps --disable-pip` | No known vulnerabilities |
| 8 | `PORT=5055 DATABASE_URL=sqlite:///<temp>/audit.db UPLOAD_FOLDER=<temp> REPORT_FOLDER=<temp> … uv run --locked python run.py` | Started; health 200; debugger active |
| 9 | Integration script, 90+ requests against port 5055 | Results in sections 5, 8, 9, 10 |
| 10 | In-process script (Groq failure modes, parsing, fresh DB, `DEMO_MODE=false`) | Results in sections 5.4, 7, 9.2 D |
| 11 | `uv run --locked --with pypdf python <script>` on 7 downloaded PDFs | All parsed, 2 pages each; content findings in section 9 |
| 12 | `BROWSER=none VITE_API_BASE_URL=http://localhost:5055/api npx vite --port 5173 --strictPort` | Ready in 0.4 s |
| 13 | `node e2e.cjs` and follow-ups (`playwright-core`, Edge channel, headless) | Results in section 6.2 |
| 14 | `uv run --locked flask --app run db current` / `db upgrade` (scratch DB) | No revisions; no-op |
| 15 | `git log --all -- backend/.env`, `git log --all -S'gsk_'`, `git grep 'gsk_'`, `git check-ignore -v …` | No secret in history or tracked files; `.env`, DB and uploads ignored |
| 16 | `curl http://127.0.0.1:5055/console` | 200 (debugger console reachable locally) |
| 17 | `curl http://127.0.0.1:5000/api/health` (already-running instance, read-only) | 200, healthy |
| 18 | SQLite read-only aggregate queries on `instance/fakenix_dev.db` | Counts in section 8.3 |
| 19 | `sha256sum -c` on the pre-audit baseline of the dev DB and `storage/` | 23 of 23 files unchanged |
| 20 | `git status --short` after cleanup | Clean apart from this report |

**Live Groq calls made:** 2 by the test suite, 4 by the integration script, 2 by the failure-mode script that reached the model endpoint with valid credentials and were rejected (unknown model, bad key), and 6 from browser runs. All used synthetic graphics.

**Test artefacts:** all scratch databases, uploads, PDFs, logs and scripts were written to the session temp folder outside the repository. The two test servers started by the audit (ports 5055 and 5173) were stopped; the instances on ports 3000 and 5000 were left running.
