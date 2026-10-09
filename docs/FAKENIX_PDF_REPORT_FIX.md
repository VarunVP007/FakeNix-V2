# FAKENIX 2.0 — PDF Forensic Report Fix

Date: 2026-10-09

This document records what was wrong with forensic report generation, what was changed, and what was actually tested. The architecture is unchanged: Flask backend, React/Vite frontend, Groq Cloud + Qwen for analysis, ReportLab for PDFs.

## Summary

| Area | Before | After |
|---|---|---|
| Layout | Verdict and labels clipped off the left edge, long values ran off the right | Every table fits the frame, every cell wraps, page numbers on each page |
| Report IDs | Could be reissued or have their PDF overwritten with other content | One ID per detection, reserved in the database before the PDF is written, never reissued |
| File metadata | MIME type guessed from the filename (or defaulted to `image/jpeg`) | Format and MIME type detected from the file bytes; disagreements are flagged |
| Detection reporting | Hardcoded observations, invented indicators, hardcoded provider | Only what the stored detection contains; demo results labelled on every page |
| Integrity | Always printed "MATCHED … tamper-evident" | Stored file is re-hashed for each report; wording says what a match does and does not show |
| Download | Unknown report ID created a fake detection and a new report | Unknown ID returns 404 and creates nothing |

## Root causes

The two supplied reports are the files in `backend/storage/reports/` (`FX_RPT_2026_001.pdf`, `FX_RPT_2026_002.pdf`). Each problem was traced to code:

### Layout
- The "Detection Result" table had **three** column widths (174 mm) but rows of **four** cells. ReportLab auto-sized the fourth column, making the table about 100 mm wider than the page; being centred, it was pushed off both edges. That is the clipped "VERDICT", "nce Percentage" and truncated model name.
- Cells were plain strings, which ReportLab never wraps. The long "Observations" sentence ran off the page.
- A plain-string cell contained `&amp;`, which printed literally.
- Tables were sized to the page width minus margins, ignoring the frame's 6 pt padding, so tables and headings did not line up.

### Report IDs
- `get_all_reports()` called `_seed_sample_reports()` whenever a user had no reports. It **wrote PDFs for the hardcoded IDs `FX-RPT-2026-001…003` before inserting the rows**. If those IDs already existed, the insert failed and was rolled back, but the existing PDF had already been overwritten with fabricated content. This is how two different documents came to carry `FX-RPT-2026-001`.
- The next ID was "highest ID in the table + 1", so deleting the newest report made its number available again, and the new report's PDF overwrote the old file. (The dev database shows this: `FX_RPT_2026_002.pdf` exists on disk with no matching row.)
- The PDF was written before the row was committed, and nothing but the `report_uid` index guarded against two concurrent requests; there was no constraint on `detection_id`.
- `GET /api/reports/<id>/download` called `generate_report(<id>)` for an unknown ID, which **created a fake "deepfake, 94.2%" detection, fake evidence with the hash of an empty string, and a new report**.

### File metadata
- Metadata was stored under `mimeType`, but the report read `mime_type`, found nothing, and fell back to `image/jpeg` for every image. Hence `…png` / `image/jpeg` / `PNG`.
- The stored `mimeType` itself came from `mimetypes.guess_type()` on the **filename**.
- Video "format" was a lookup on the extension that also asserted a codec (`MP4 (H.264)`). Video uploads were validated by extension only.
- File size was `round(MB, 2)` formatted through `value and f'…'`; anything under ~5 KB became the string `0.0`.
- Missing values were filled with defaults (`1920x1080`, `2.4 MB`, `00:00:15`).

### Detection and confidence
- "Face Detection Status" and "Detected Face Count: 1" were hardcoded; nothing detects faces.
- "Observations & Findings" was one of two canned sentences. The sample SUSPICIOUS report says "No synthetic manipulation detected".
- If a detection had no indicators, the report invented some ("Facial Texture Consistency 5%").
- "Inference Provider" was the constant `FAKENIX Deep Learning Pipeline / Groq`, including on demo results.
- "Confidence Percentage" and "Deepfake Probability" were the same number, so a REAL result printed "REAL (18.5% Confidence)".
- A REAL verdict produced a "Certificate of Authenticity".
- `Detection.model_name` defaulted to `EfficientNet-B4`. The EfficientNet modules in `app/ai/` are not called by any route; all image/video analysis goes through `app/ai/groq_analyzer.py`.
- The analyzer did not check that the model's verdict and probability agreed, crashed with a 500 on valid JSON that was not an object, and turned a JSON `null` into the text `"None"`.

### Evidence integrity
- "Integrity Status: MATCHED — Cryptographic verification complete & tamper-evident" was a constant. No comparison was performed.
- When a detection had no evidence, the report created an evidence record with the SHA-256 and MD5 of an empty string.

## Files changed

Backend
- `app/services/report_pdf.py` (new) — PDF layout only.
- `app/services/report_service.py` — rewritten: report records, ID allocation, report content, integrity check.
- `app/routes/report_routes.py` — 404 handling, download no longer creates records.
- `app/services/metadata_service.py` — byte-level format detection, consistency flags.
- `app/services/image_service.py` — validation uses the shared detector; video content is checked.
- `app/services/detection_service.py`, `app/routes/detection_routes.py` — measured metadata, analysis provenance.
- `app/ai/groq_analyzer.py` — verdict policy, malformed-response handling, provenance fields.
- `app/models/report.py` — unique index on `detection_id`; `isDemo` and `deepfakeProbability` in `to_dict()`.
- `app/models/detection.py` — removed the `EfficientNet-B4` default; exposes `analysis`.
- `app/utils/ids.py` — `floor` argument.
- `app/services/database_service.py`, `app/__init__.py` — `ensure_report_constraints()` at startup.
- `tests/test_reports.py` (new), `scripts/generate_sample_reports.py` (new).
- `pyproject.toml`, `uv.lock` — `pypdf` added to the **dev** group (used by tests to read PDFs).

Frontend
- `src/pages/Reports.jsx` — the score column is labelled "Deepfake Likelihood"; DEMO badge also uses the report's own flag.
- `src/utils/normalize.js` — passes through `deepfakeProbability` and `isDemo`.

The frontend already used the server's report ID and Blob download; no change was needed there.

## Database changes

One addition, no migration file (the project has no migration versions; tables are created with `db.create_all()`):

- Unique index `uq_reports_detection_id` on `reports.detection_id` (one report per detection; multiple NULLs are allowed).

For an existing database, `ensure_report_constraints()` adds the index at startup. If historical rows already share a detection, it logs a warning and does **not** create the index or delete anything; the application then keeps returning the oldest report for that detection.

**The real dev database has not been modified.** The index will be added the next time the backend starts. On a copy of `instance/fakenix_dev.db` it was created without error (no duplicates exist).

No columns were added. Analysis provenance is stored inside the existing `detections.metadata_json` under `aiAnalysis`.

## PDF layout corrections

- Margins 18 mm left/right/top, 22 mm bottom; content width is the frame's inner width.
- All tables have explicit column widths that sum to the content width. All cells are `Paragraph`s, so text wraps; words longer than a line are split.
- The verdict is a full-width box with centred, wrapping text, coloured for REAL / FAKE / SUSPICIOUS (and UNDETERMINED when no verdict is stored).
- Footer on every page: report ID and "Page X of Y"; demo reports also carry "DEMO / SIMULATED" in the footer.
- Dynamic text is XML-escaped. Fonts stay at 7.5–8.5 pt body, 16 pt verdict.
- PDFs are written to a temporary file and moved into place.

## Report-ID correction

- The report row is inserted and committed first (status `generating`), which reserves the ID; the PDF is written afterwards.
- Concurrency: `report_uid` and `detection_id` are both unique. A request that loses either race rolls back and adopts the existing report for that detection, or retries with the next ID.
- IDs are never reissued: PDFs already in the report folder count as used numbers.
- `POST /api/reports` for a detection that already has a report returns that report.
- Downloads serve the stored file. The file is rebuilt, under the same ID, only when it is missing or was produced by the old layout. Rebuilt files get a new name (`FX_RPT_2026_001_v2.pdf`); **the old PDF is left on disk**.
- Sample-report seeding and the fake-detection fallback were removed.

## Metadata and evidence-integrity corrections

- Format and MIME type come from the file's magic bytes (JPEG, PNG, WEBP, GIF, BMP, MP4, MOV, AVI, MKV, WebM, 3GPP, HEIF).
- Stored separately: `fileExtension`, `extensionFormat`, `detectedFormat`, `mimeType` (detected), `clientMimeType` (what the browser declared), `fileSizeBytes`.
- A disagreement sets `formatMismatch` and adds a sentence to `inconsistencies`, which the PDF prints in a highlighted box. The upload is still accepted if the content is an allowed type.
- Video uploads must contain a video container; a text file named `.mp4` is rejected with 400.
- Video duration, frame rate and codec come from OpenCV and stay empty when OpenCV cannot read them.
- For each report the stored evidence file is re-hashed and compared with the SHA-256 recorded at upload. The report prints one of: MATCH, MISMATCH (with the current hash), NOT VERIFIED (file unavailable), NO EVIDENCE FILE. The check is read-only.
- The report states that a match shows the stored file equals the uploaded file, not that the media is genuine. MD5 is labelled reference-only.
- The custody list is titled "Recorded handling event" and is followed by a statement that it is an application log, not a complete legal chain of custody.

## Detection-score and report consistency

Field definitions, as printed in the report:

| Field | Meaning |
|---|---|
| Manipulation likelihood | The model's own 0–100% estimate that the media is fake. Self-reported by a language model; **not** calibrated. Stored as `deepfake_probability` (and `confidence`, same value). |
| Authentic complement | 100% minus the likelihood. Not a separate measurement. Stored as `real_probability`. |
| Risk level | Derived from the likelihood: below 30% low, 30–70% medium, 70%+ high, 95%+ critical. |
| Verdict | The model's classification: REAL, FAKE or SUSPICIOUS. |

Verdict policy (in `groq_analyzer._apply_verdict_policy`): if the model answers "real" with a likelihood of 30% or more, or "fake" with a likelihood below 30%, the result is stored as **suspicious**. The model's literal answer is kept in `aiAnalysis.rawVerdict` / `rawProbability`, and the reason is printed in the report. An ambiguous answer is never stored as REAL.

Other points:
- Model and provider are taken from the stored detection (`aiAnalysis`, or the `(Groq)` suffix on older records).
- Demo records (`is_demo`) get a banner, "Simulated Indicators", provider "None", and no model observations.
- Indicators and observations are printed only if stored, with a source line saying they are AI-generated and not independently verified. Nothing is invented when they are absent.
- A stored verdict that contradicts its stored score (older records) is printed as stored and flagged as inconsistent.
- Groq failures and unusable responses return HTTP 502 with a message and store nothing. There is no simulated fallback for uploads.
- All timestamps are UTC and labelled as such.

## Tests executed and actual results

All commands were run from `backend/` on Windows 11, Python 3.12 (the project venv).

| Run | Result |
|---|---|
| `pytest tests/test_reports.py` | **74 passed** |
| Full suite, before any change (two live-Groq tests excluded) | 60 passed, 3 failed |
| Full suite, after the change (including the two live-Groq tests) | **137 passed, 2 failed** |

The two remaining failures existed before this work and are unrelated to reports: `test_auth.py::TestProfile::test_me_unauthenticated` and `test_detection.py::TestImageDetection::test_detection_unauthenticated` expect 401, but the testing config runs with `DEMO_MODE=True`, which admits requests without a token. They were left alone. The third pre-existing failure, `test_report_not_visible_to_other_user`, now passes.

`tests/test_reports.py` uses its own in-memory database and temporary folders and never calls Groq. Coverage against the requested list:

1. Valid PDF, page numbers, all text inside the margins (positions read back from the PDF).
2. Long verdict, model name, file name and indicator text wrap and are not truncated.
3. Unique IDs; simulated ID collision; simulated same-detection race; no reissue after deletion; index added to an existing database.
4. Each PDF contains its own detection ID, evidence ID, file name and hash, and not another report's.
5. Format detection table; PNG as `.png`; JPEG as `.png`; mismatched client Content-Type; small file size; non-media rejected; synthetic AVI uploaded as `.mp4`.
6. Hashes equal `hashlib` of the uploaded bytes; match, mismatch, missing file, no evidence.
7. REAL / FAKE / SUSPICIOUS agree across database, API and PDF; contradictory answers; no invented indicators; demo labelling.
8. Missing detection → 404, nothing created. Incomplete detection → 400.
9. Unknown report IDs → 404 JSON, nothing created.
10. Repeated downloads return identical bytes and create nothing; missing and old-layout PDFs are rebuilt under the same ID.
11. Groq error, missing API key, and eleven malformed responses → 502, nothing stored.
12. **Not done:** the frontend has no test runner, so there is no automated Blob-download test. `npm run build` succeeds.

The position check was also run against the two original PDFs and reported five out-of-margin text runs in each, so it does detect the original defect.

### Sample reports

`docs/sample_reports/` holds two reports generated by `scripts/generate_sample_reports.py --live` in an isolated database:

| Report | File | Analysis | Verdict |
|---|---|---|---|
| `FX-RPT-2026-001` | `sample_portrait.png` (JPEG bytes, deliberately misnamed) | Real Groq call, `qwen/qwen3.8-27b` | REAL, 0.0% |
| `FX-RPT-2026-002` | `sample_scene.png` | Demo record, labelled | SUSPICIOUS, 47.4% |

Checked for both: different IDs, valid PDF, text inside margins, SHA-256 in the PDF equals the hash of the sample file, repeat download identical, demo labelled only where it applies. Both were opened and inspected page by page; neither has clipped or overlapping text. Sample 1 shows the extension/content mismatch flagged.

### Checks against real data and a real server

Run on a **copy** of the dev database and storage (the originals were checksummed before and after and are unchanged):

- The existing `FX-RPT-2026-001` was rebuilt as `FX_RPT_2026_001_v2.pdf` under the same ID; the old file was untouched.
- Reports for the other seven detections got `003`–`009`. `002` was skipped because its orphaned PDF exists.
- A second pass created no reports.
- With the backend running over HTTP: download returned `200`, `Content-Type: application/pdf`, an attachment filename and the CORS header for the frontend origin; unknown report and unknown detection returned 404; two downloads were byte-identical.

No browser automation is available in this environment, so the click-to-download path in the browser was not exercised.

## Remaining issues and limitations

- **Existing reports are not rebuilt until downloaded.** The real `FX-RPT-2026-001` still has the old PDF on disk until someone downloads it.
- **Old demo records keep their stored values.** They are now labelled as simulated, but seeded evidence hashes in those records are placeholders and print as "NOT VERIFIED" because no file exists.
- **Report text is limited to Windows-1252.** Characters outside it (for example Cyrillic or CJK in a file name) print as `?`. Fixing this needs a bundled Unicode font.
- **The likelihood is not calibrated.** The report says so; calibrating it would need a labelled evaluation set.
- **The custody log is not tamper-proof.** Events are written by the application with no signing. The report says so rather than fixing it.
- **`evidence.integrity_status` is still set to `verified` at upload**, and the Evidence page shows it. The PDF no longer relies on it. Changing its meaning would affect the Evidence page, which was out of scope.
- **URL analysis in demo mode still returns a random, demo-labelled result** and an evidence ID that is not stored. Reports for such detections state that no evidence file exists.
- **Ownership is stricter than before.** Reports and detections belonging to another user are now "not found", and an unauthenticated request outside demo mode sees only ownerless reports (previously it saw all reports).
- **`detections.model_name` is 50 characters.** A longer model ID would be truncated on MySQL.
- **Report type** is printed as "Forensic Analysis Report" for all verdicts. Older rows stored as "Authenticity Certificate" keep that value in the database and the reports list.
- The unused EfficientNet modules in `app/ai/` were left in place.

## Commands

Backend (from `backend/`):

```bash
uv sync --group dev          # install, including test dependencies
uv run python run.py         # start the API (http://127.0.0.1:5000)
```

Frontend (from `frontend/`):

```bash
npm install
npm run dev                  # http://localhost:3000
```

Tests (from `backend/`):

```bash
uv run pytest tests/test_reports.py     # report tests, offline
uv run pytest                           # full suite; two tests call the Groq API
```

Sample reports (from `backend/`):

```bash
uv run python scripts/generate_sample_reports.py          # demo-labelled samples, offline
uv run python scripts/generate_sample_reports.py --live   # sample 1 analysed by Groq (one API call)
```
