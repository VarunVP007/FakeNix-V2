# FAKENIX 2.0

**AI-Powered Deepfake Detection & Digital Forensics Platform**

An end-to-end investigative platform for analyzing suspicious media, assessing manipulation risks, preserving cryptographic evidence, and preparing structured incident reports for law enforcement and digital forensics investigations.

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Repository Structure](#repository-structure)
5. [Architecture & Workflow](#architecture--workflow)
6. [Prerequisites](#prerequisites)
7. [Installation & Setup](#installation--setup)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
8. [Environment Configuration](#environment-configuration)
9. [Running the Application](#running-the-application)
10. [Docker & Containerized Setup](#docker--containerized-setup)
11. [Production Deployment](#production-deployment)
    - [Vercel (Frontend SPA)](#vercel-deployment-frontend)
    - [Render (Backend Web Service)](#render-deployment-backend)
12. [Testing](#testing)
13. [API Endpoints](#api-endpoints)
14. [Evidence & Report Workflow](#evidence--report-workflow)
15. [Troubleshooting](#troubleshooting)
16. [Security & Responsible Use](#security--responsible-use)
17. [Documentation](#documentation)
18. [License](#license)

---

## Overview

FAKENIX 2.0 is a comprehensive digital forensics platform designed to combat synthetic media threats. It provides investigators, journalists, law enforcement, and security operations centers (SOCs) with a unified toolkit to:

- **Analyze** suspicious images and videos for deepfake indicators
- **Assess** manipulation probabilities using AI-powered vision models
- **Verify** cryptographic evidence with SHA-256 hashing and chain-of-custody tracking
- **Report** structured cybercrime incident dossiers compliant with law enforcement standards

The platform integrates image and video analysis, EXIF/metadata extraction, AI-assisted deepfake detection via Groq's hosted vision LLM, automatic evidence sealing, and court-ready PDF forensic report generation into a single forensic-first workflow.

---

## Key Features

- **Multi-Format Media Analysis:** Support for JPEG, PNG, WEBP images; MP4, AVI, MOV videos; and URL-based analysis
- **AI Deepfake Detection:** Powered by Groq's hosted vision LLM (e.g., Qwen 3.8-27B) analyzing facial artifacts, lighting inconsistencies, and frame anomalies
- **Frame-by-Frame Analysis:** For videos, sample frames analyzed independently with per-frame confidence scores and temporal anomaly curves
- **Metadata Extraction:** Automatic EXIF and header metadata parsing for images; resolution, duration, and codec details for videos
- **Cryptographic Evidence Sealing:** Immediate SHA-256 and MD5 hashing of all uploaded media with tamper-evident verification
- **Chain of Custody Tracking:** Immutable audit logs recording who uploaded, analyzed, and sealed each evidence artifact
- **Forensic Report Generation:** PDF-exportable forensic dossiers with analysis results, risk assessments, and evidence summaries compliant with Section 65B electronic evidence standards
- **Cybercrime Incident Reporting:** Standardized report templates for preparing law enforcement complaint packets
- **User Authentication:** Secure JWT-based authentication with role-based access control
- **Dashboard & Analytics:** SOC command center with detection trends, activity streams, and real-time metrics
- **Demo Mode:** Complete offline simulation mode with realistic mock detections for evaluation and training

---

## Technology Stack

| Component             | Technology                                     |
| --------------------- | ---------------------------------------------- |
| **Frontend**          | React 18, Vite 5, React Router v6              |
| **Backend**           | Flask 3.x, Python 3.12                         |
| **Database**          | MySQL 8+ (or SQLite for development)           |
| **ORM**               | Flask-SQLAlchemy 3.x / SQLAlchemy 2.x          |
| **Migrations**        | Flask-Migrate 4.x / Alembic                    |
| **Authentication**    | Flask-JWT-Extended (JWT 24h expiry)            |
| **AI Analysis**       | Groq-hosted vision LLM (e.g., qwen/qwen3.8-27b) |
| **PDF Reporting**     | ReportLab 4.x                                  |
| **Image Processing**  | OpenCV (headless), Pillow                      |
| **Metadata Parsing**  | pymediainfo 6.x                                |
| **HTTP Client**       | Axios (frontend), Requests (backend)           |
| **Data Visualization**| Recharts (React charting)                      |
| **Dependency Mgmt**   | uv (backend), npm (frontend)                   |

---

## Repository Structure

```
FakeNix-v1/
├── backend/                  Flask REST API (Python 3.12, managed with uv)
│   ├── app/
│   │   ├── routes/           API endpoints (auth, detection, evidence, reports)
│   │   ├── services/         Business logic (detection, evidence, reporting)
│   │   ├── models/           Database models (User, Detection, Evidence, Report)
│   │   ├── ai/               AI analysis modules (Groq integration, preprocessing)
│   │   ├── utils/            Validators, decorators, response formatters, loggers
│   │   ├── config.py         Environment configuration
│   │   └── extensions.py     Flask extensions (db, jwt, cors, migrate)
│   ├── migrations/           Alembic database migrations
│   ├── scripts/
│   │   ├── init_db.py        Database initialization
│   │   └── seed_demo_data.py Demo data seeding
│   ├── tests/                pytest test suite
│   ├── storage/
│   │   ├── uploads/          Raw uploaded images and videos
│   │   ├── processed/        Processed frames and artifacts
│   │   ├── reports/          Generated PDF reports
│   │   └── evidence/         Evidence-related files
│   ├── pyproject.toml        Project metadata and dependencies
│   ├── uv.lock               Locked dependency versions
│   ├── .env.example          Environment variable template
│   ├── .python-version       Python version pinning (3.12)
│   ├── run.py                Entry point
│   └── README.md             Backend-specific documentation
│
├── frontend/                 React + Vite single-page application
│   ├── src/
│   │   ├── components/       React components (detection, forensic, dashboard)
│   │   ├── pages/            Page views (20+ investigation and reporting pages)
│   │   ├── services/         API client, auth, detection services
│   │   ├── hooks/            useAuth, useDetection custom hooks
│   │   ├── utils/            Formatters, validators, risk calculators
│   │   ├── data/             Mock fixtures for demo mode
│   │   ├── App.jsx           Application routing and context
│   │   ├── index.css         Cybersecurity design system
│   │   └── main.jsx          Application entry point
│   ├── public/               Static assets
│   ├── index.html            HTML5 template
│   ├── package.json          Dependencies and build scripts
│   ├── vite.config.js        Vite configuration
│   ├── .env.example          Environment variable template
│   └── README.md             Frontend-specific documentation
│
├── LICENSE                   MIT License
└── README.md                 This file

```

---

## Architecture & Workflow

```mermaid
flowchart TD
    User["👤 User / Investigator"]
    
    User -->|Upload Media| Frontend["React + Vite<br/>Frontend"]
    Frontend -->|Secure Request| Backend["Flask REST API<br/>Backend"]
    
    Backend -->|Validate & Store| Storage["Storage Layer<br/>uploads/"]
    Backend -->|Extract Metadata| Metadata["📊 EXIF & Metadata<br/>Extraction"]
    
    Backend -->|Send to Groq| AI["🧠 Groq Vision LLM<br/>AI Analysis"]
    AI -->|Return Verdict| Detection["📈 Detection Result<br/>Confidence & Risk"]
    
    Detection -->|SHA-256 Hash| Evidence["🔐 Evidence Sealing<br/>Cryptographic Hashing"]
    Evidence -->|Store Record| DB["🗄️ Database<br/>Detections, Evidence"]
    
    DB -->|Generate| Report["📄 Forensic Report<br/>PDF Generation"]
    Report -->|Store & Link| Storage
    
    Frontend -->|Display Results| User
    User -->|Download| Report

    style Frontend fill:#1e40af
    style Backend fill:#059669
    style AI fill:#7c3aed
    style Evidence fill:#dc2626
    style Report fill:#ea580c
```

**Workflow Steps:**

1. **Upload** — User selects an image, video, or URL via the React frontend
2. **Validation** — Backend validates file format, size, and integrity
3. **Metadata Extraction** — EXIF data, resolution, codec, and technical details are captured
4. **AI Analysis** — Media is sent to Groq's vision LLM for deepfake assessment
5. **Risk Assessment** — Confidence scores are computed; risk level determined (Critical, High, Medium, Low)
6. **Evidence Sealing** — SHA-256 hash generated and stored with chain-of-custody metadata
7. **Report Generation** — PDF forensic dossier compiled with findings and evidence references
8. **Results & Download** — User reviews analysis in frontend; downloads evidence and reports

---

## Prerequisites

- **Python 3.12** — [Download](https://www.python.org/downloads/)
- **uv** — Fast Python package manager. [Install](https://docs.astral.sh/uv/)
  - Automatically installs Python 3.12 if needed
- **Node.js 18+** — [Download](https://nodejs.org/)
- **npm** — Included with Node.js
- **MySQL 8+** (optional; SQLite available for development) — [Download](https://dev.mysql.com/)
- **Groq API Key** — Required for AI analysis. [Sign up](https://console.groq.com/)

---

## Installation & Setup

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` and set required variables:**
   - `GROQ_API_KEY` — Your Groq API key (required)
   - `GROQ_MODEL` — Groq model (e.g., `qwen/qwen3.8-27b`)
   - `SECRET_KEY` and `JWT_SECRET_KEY` — Generate random 32+ character strings
   - `DATABASE_URL` — MySQL connection string or SQLite path
   - `FRONTEND_URL` — Frontend origin (default: `http://localhost:5173`)

4. **Install dependencies:**
   ```bash
   uv sync
   ```

5. **Initialize database:**
   ```bash
   uv run python scripts/init_db.py
   ```

6. **(Optional) Seed demo data:**
   ```bash
   uv run python scripts/seed_demo_data.py
   ```
   Creates demo user: `demo@fakenix.ai` / `Demo@123`

7. **Start backend server:**
   ```bash
   uv run python run.py
   ```

   Backend runs at: **`http://127.0.0.1:5000`**

### Frontend Setup

1. **Open new terminal, navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   Frontend runs at: **`http://localhost:5173`**

---

## Environment Configuration

### Backend (.env)

```env
# Flask
FLASK_ENV=development
SECRET_KEY=your_secure_random_32_char_minimum_secret_key
PORT=5000

# Database
# MySQL (recommended for production):
DATABASE_URL=mysql+pymysql://fakenix_user:password@localhost/fakenix_db

# SQLite (development fallback):
# DATABASE_URL=sqlite:///fakenix_dev.db

# JWT
JWT_SECRET_KEY=your_secure_random_32_char_minimum_jwt_secret
JWT_ACCESS_TOKEN_EXPIRES_HOURS=24

# Frontend (for CORS)
FRONTEND_URL=http://localhost:5173

# Demo Mode
DEMO_MODE=true  # Set to false when using real Groq API

# AI Analysis (Groq) — REQUIRED
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b
GROQ_TIMEOUT_SECONDS=90
GROQ_VIDEO_FRAMES=2

# File Upload Limits (100 MB in bytes)
MAX_CONTENT_LENGTH=104857600

# Storage Paths
UPLOAD_FOLDER=storage/uploads
REPORT_FOLDER=storage/reports
PROCESSED_FOLDER=storage/processed
EVIDENCE_FOLDER=storage/evidence

# Logging
LOG_LEVEL=INFO
```

### Frontend (.env)

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:5000/api

# App Name
VITE_APP_NAME=FAKENIX
```

**Important:**
- Never commit `.env` files to Git (they are in `.gitignore`)
- Keep `GROQ_API_KEY` and `JWT_SECRET_KEY` secure
- Do not expose secrets in logs or error messages

---

## Running the Application

### Start Backend (Terminal 1)

```bash
cd backend
uv run python run.py
```

Expected output:
```
============================================================
  FAKENIX 2.0 Backend
  Running at: http://127.0.0.1:5000
  Environment: development
  Demo Mode: true
============================================================
```

### Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

### Verify Setup

- **Frontend:** Open `http://localhost:5173` in your browser
- **API Health:** `curl http://127.0.0.1:5000/health` (or `/api/health`)
- **Demo Login:** Use `demo@fakenix.ai` / `Demo@123`

---

## Docker & Containerized Setup

For local consistency or Docker-based production hosting, use Docker Compose:

```bash
# Build and start both services
docker compose up --build -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

Services exposed:
- **Frontend SPA (Nginx):** `http://localhost:80`
- **Backend API (Gunicorn):** `http://localhost:5000`

---

## Production Deployment

The recommended production architecture decouples the frontend and backend:
- **Frontend:** Hosted on **Vercel** (Global CDN, Edge network, zero-config React SPA)
- **Backend:** Hosted on **Render** (Managed Python Web Service with Gunicorn, persistent disk or cloud storage, and optional managed PostgreSQL)

```
Browser
   │
   ▼ HTTPS
Vercel (React Vite SPA) ──► HTTPS /api ──► Render (Flask + Gunicorn)
                                                    │
                                                    ▼
                                           PostgreSQL / Storage
```

### Vercel Deployment (Frontend)

1. **Connect Repository on Vercel:**
   - Log into [Vercel Dashboard](https://vercel.com).
   - Click **Add New Project** and import the `FakeNix-v1` repository.

2. **Configure Project Settings:**
   - **Root Directory:** Click `Edit` and select `frontend`.
   - **Framework Preset:** Vite (detected automatically).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

3. **Set Environment Variables in Vercel:**
   | Variable | Value | Description |
   | --- | --- | --- |
   | `VITE_API_BASE_URL` | `https://your-backend.onrender.com/api` | Render backend API endpoint |
   | `VITE_APP_NAME` | `FAKENIX` | Application display title |

4. **Deploy:**
   - Click **Deploy**.
   - Direct nested route navigation and SPA refresh are handled automatically via `frontend/vercel.json`.

---

### Render Deployment (Backend)

The repository provides a `render.yaml` Blueprint specification for one-click setup, or you can configure a Web Service manually.

#### Option A: One-Click via Render Blueprint
1. In the [Render Dashboard](https://dashboard.render.com), go to **Blueprints**.
2. Click **New Blueprint Instance** and select your repository.
3. Render automatically reads `render.yaml` and provisions:
   - Web Service: `fakenix-backend` (Python 3.11/3.12, Gunicorn)
   - Health check path: `/health`
   - Configured environment variable templates.

#### Option B: Manual Web Service Setup
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Select your repository.
3. Configure the service settings:
   - **Name:** `fakenix-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt` (or Docker if preferred)
   - **Start Command:** `gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 app:create_app()`
   - **Health Check Path:** `/health`

4. **Configure Environment Variables in Render:**
   | Variable | Example Value | Description |
   | --- | --- | --- |
   | `FLASK_ENV` | `production` | Production mode |
   | `PORT` | `10000` | Injected automatically by Render |
   | `SECRET_KEY` | *(generate 32+ random chars)* | Flask session secret |
   | `JWT_SECRET_KEY` | *(generate 32+ random chars)* | JWT signing secret |
   | `CORS_ORIGINS` | `https://your-frontend.vercel.app` | Vercel frontend URL (comma-separated if multiple) |
   | `FRONTEND_URL` | `https://your-frontend.vercel.app` | Primary frontend domain |
   | `DATABASE_URL` | `postgresql://user:pass@host/db` | Render Postgres or MySQL URL |
   | `GROQ_API_KEY` | `gsk_...` | Groq API key for vision AI |
   | `GROQ_MODEL` | `qwen/qwen3.8-27b` | AI vision model |
   | `DEMO_MODE` | `false` | Set `false` for real AI inference |
   | `MAX_CONTENT_LENGTH` | `104857600` | 100 MB upload limit |

5. **Initialize Database on Render:**
   - Open the **Shell** tab in your Render Web Service dashboard and run:
     ```bash
     python scripts/init_db.py
     ```

---

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
uv run pytest -v

# Run specific test file
uv run pytest tests/test_auth.py -v

# Run with coverage report
uv run pytest --cov=app --cov-report=term-missing
```

Tests use an **in-memory SQLite database** — production data is never touched.

### Available Test Suites

| Test File             | Coverage                                    |
| --------------------- | ------------------------------------------- |
| `test_database.py`    | Database connection, CRUD, hashing, rollback |
| `test_auth.py`        | Registration, login, JWT, profile endpoints |
| `test_detection.py`   | Image/video uploads, detection history      |
| `test_health.py`      | Health check endpoints, API root routes     |

### Frontend Tests

Currently, the frontend does not have automated tests configured. Manual testing via the browser is recommended.

---

## API Endpoints

All endpoints return JSON responses with the following structure:

```json
{
  "success": true,
  "data": { ... },
  "message": "...",
  "timestamp": "ISO-8601 timestamp"
}
```

### Health & Root

| Method | Endpoint       | Auth | Description              |
| ------ | -------------- | ---- | ------------------------ |
| GET    | `/`            | None | Root service info        |
| GET    | `/api`         | None | API root with endpoint list |
| GET    | `/api/health`  | None | Health check             |

### Authentication

| Method | Endpoint              | Auth | Description              |
| ------ | --------------------- | ---- | ------------------------ |
| POST   | `/api/auth/register`  | None | Register new user        |
| POST   | `/api/auth/login`     | None | Login, receive JWT token |
| GET    | `/api/auth/me`        | JWT  | Current user profile     |
| POST   | `/api/auth/logout`    | None | Client-side token clear  |

### Detection (Analysis)

| Method | Endpoint                       | Auth | Description                    |
| ------ | ------------------------------ | ---- | ------------------------------ |
| POST   | `/api/detect/image`            | JWT  | Upload and analyze image file  |
| POST   | `/api/detect/video`            | JWT  | Upload and analyze video file  |
| POST   | `/api/detect/url`              | JWT  | Analyze URL (demo mode)        |
| GET    | `/api/detections`              | JWT  | List detection history         |
| GET    | `/api/detections/<uid>`        | JWT  | Get single detection result    |
| DELETE | `/api/detections/<uid>`        | JWT  | Delete a detection record      |

### Evidence

| Method | Endpoint                         | Auth | Description              |
| ------ | -------------------------------- | ---- | ------------------------ |
| GET    | `/api/evidence`                  | JWT  | List evidence records    |
| GET    | `/api/evidence/<uid>`            | JWT  | Get single evidence      |
| GET    | `/api/evidence/<uid>/verify`     | JWT  | Verify SHA-256 integrity |

### Reports

| Method | Endpoint                       | Auth | Description              |
| ------ | ------------------------------ | ---- | ------------------------ |
| POST   | `/api/reports`                 | JWT  | Generate PDF report      |
| GET    | `/api/reports`                 | JWT  | List user's reports      |
| GET    | `/api/reports/<uid>`           | JWT  | Get single report        |
| GET    | `/api/reports/<uid>/download`  | JWT  | Download report PDF      |

### Cybercrime Reports

| Method | Endpoint                         | Auth | Description                    |
| ------ | -------------------------------- | ---- | ------------------------------ |
| POST   | `/api/cybercrime/report`         | JWT  | Prepare incident report        |
| GET    | `/api/cybercrime/reports`        | JWT  | List incident reports          |
| GET    | `/api/cybercrime/reports/<uid>`  | JWT  | Get single incident report     |

### User

| Method | Endpoint              | Auth | Description              |
| ------ | --------------------- | ---- | ------------------------ |
| GET    | `/api/user/profile`   | JWT  | Get user profile         |
| PUT    | `/api/user/profile`   | JWT  | Update user profile      |

### Dashboard

| Method | Endpoint                       | Auth | Description              |
| ------ | ------------------------------ | ---- | ------------------------ |
| GET    | `/api/dashboard/detection-trend` | JWT  | Detection trend analytics |
| GET    | `/api/dashboard/stats`         | JWT  | Summary statistics       |

---

## Evidence & Report Workflow

### Evidence Records

When a file is uploaded and analyzed:

1. **File Ingestion** — Original media stored in `storage/uploads/`
2. **Hash Computation** — SHA-256 and MD5 checksums calculated
3. **Metadata Capture** — EXIF, resolution, codec, and analysis parameters stored
4. **Chain of Custody** — Immutable audit trail with upload timestamp, user, and analysis timestamp
5. **Evidence Sealing** — Record created with evidence UID (format: `FX-YYYY-NNNNN`)

Evidence records link to detections but survive if a detection is deleted (forensic requirement).

### Forensic Reports

After analysis, users can generate PDF reports:

1. **Detection Summary** — Analysis results, AI verdict, confidence scores
2. **Risk Assessment** — Risk level classification and indicator breakdowns
3. **Evidence References** — Links to SHA-256 hashes and cryptographic evidence IDs
4. **Metadata & Artifacts** — EXIF data, extracted frames (for video), technical findings
5. **Chain of Custody** — Complete audit trail of analysis and report generation
6. **PDF Export** — Court-ready dossier saved to `storage/reports/` and linked in database

### Cybercrime Incident Reporting

Users can prepare structured incident report packets:

1. **Incident Details** — Type, date, description, platforms affected
2. **Evidence Linkage** — Reference evidence UIDs and uploaded media
3. **Report Assembly** — Structured packet formatted for law enforcement submission
4. **Status Tracking** — Reports marked as "prepared" (not auto-submitted)

**Important:** FAKENIX prepares reports only. Actual submission to law enforcement is the user's sole responsibility.

---

## Troubleshooting

### Backend Issues

#### `uv command not found`
- Ensure uv is installed: `pip install uv` or use the [official installer](https://docs.astral.sh/uv/installation/)
- Add uv to PATH (Windows users may need to restart terminal after installation)

#### `Python 3.12 not found`
- uv should install Python 3.12 automatically
- If not, manually install from [python.org](https://www.python.org/downloads/)
- Verify: `python --version`

#### `GROQ_API_KEY missing or invalid`
- Ensure `backend/.env` contains a valid Groq API key
- Sign up at [console.groq.com](https://console.groq.com/)
- Without a valid key, image/video uploads return HTTP 502

#### `Database connection failed`
- If using MySQL:
  - Verify MySQL is running: `mysql -u root -p -e "SELECT 1"`
  - Ensure database and user exist: run `scripts/mysql_setup.sql` or create manually
  - Check `DATABASE_URL` in `.env` is correct
- If using SQLite:
  - Set `DATABASE_URL=sqlite:///fakenix_dev.db` in `.env`
  - No MySQL setup needed

#### `Port 5000 already in use`
- Find and stop the process using port 5000
  - **Windows:** `netstat -ano | findstr :5000` then `taskkill /PID <pid> /F`
  - **Linux/Mac:** `lsof -i :5000` then `kill -9 <pid>`
- Or change `PORT` in `.env`

#### `FileNotFoundError: storage/uploads not found`
- Backend creates storage directories automatically on startup
- If missing, manually create: `mkdir -p backend/storage/{uploads,reports,processed,evidence}`

### Frontend Issues

#### `Module not found` or `npm ERR! code ERESOLVE`
- Clear node_modules and reinstall:
  ```bash
  cd frontend
  rm -rf node_modules package-lock.json
  npm install
  ```

#### `Port 5173 already in use`
- Change the dev port in `frontend/vite.config.js` or stop the process

#### `Cannot connect to backend (CORS error)`
- Ensure backend is running at `http://127.0.0.1:5000`
- Verify `VITE_API_BASE_URL` in `frontend/.env` is correct
- Check backend `FRONTEND_URL` in `backend/.env` includes `http://localhost:5173`

#### `API returns 401 Unauthorized`
- Token may be expired; log out and log back in
- Verify `JWT_SECRET_KEY` in backend `.env` is set correctly
- In demo mode, use `demo@fakenix.ai` / `Demo@123`

### General Issues

#### `GROQ API rate limit exceeded`
- Groq's on-demand tier allows ~7,000 input tokens per minute
- Video analysis consumes ~3,600 tokens (2 frames × 1,800 tokens each)
- Wait a few minutes before retrying; client retries automatically

#### `Large file uploads timeout`
- Increase `MAX_CONTENT_LENGTH` in `backend/.env` (default: 100 MB)
- Increase `GROQ_TIMEOUT_SECONDS` for large videos (default: 90)

---

## Security & Responsible Use

### Code Security

- **No hardcoded secrets** — All credentials stored in `.env` only
- **SQL injection prevention** — SQLAlchemy ORM with parameterized queries
- **CSRF protection** — CORS configured to trusted frontend origins only
- **Password hashing** — PBKDF2-SHA256 via Werkzeug (never plaintext storage)
- **JWT security** — 24-hour token expiry; signed with `JWT_SECRET_KEY`
- **File upload validation** — Extension and MIME type checks; 100 MB size limit
- **Error handling** — Generic error messages in production; detailed logs server-side

### Operational Security

- **Never commit `.env` files** — Secrets are listed in `.gitignore`
- **Use authorized media only** — Only analyze media you have permission to test
- **Preserve original files** — Keep unmodified copies for forensic integrity
- **Handle data responsibly** — Treat uploaded media and analysis results as sensitive

### Platform Limitations

- **AI classification is analytical** — Deepfake predictions assist investigation but are not absolute proof
- **Not legally certified** — FAKENIX does not provide legally conclusive forensic certification
- **No auto-submission** — Cybercrime reports are prepared only; users must submit to authorities
- **Groq dependency** — Real AI analysis requires internet and valid Groq API access

### Compliance Considerations

- **Section 65B (India)** — Forensic reports prepared compliant with electronic evidence standards
- **GDPR / Data Privacy** — Uploaded media should be handled per applicable privacy laws
- **Chain of Custody** — Immutable audit trails support forensic evidence requirements

---

## Documentation

For detailed information on specific areas, refer to:

- **[backend/README.md](backend/README.md)** — Database schema, migrations, Groq AI integration, storage architecture, security controls
- **[frontend/README.md](frontend/README.md)** — React architecture, component structure, demo mode, styling system, custom hooks

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

Copyright © 2026 FAKENIX 2.0 Contributors

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -am 'Add feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## Support

- **Issues & Bugs:** Report via GitHub Issues
- **Questions:** Check existing documentation or open a discussion
- **Security:** Do not open public issues for security vulnerabilities. Contact maintainers privately.

---

**FAKENIX 2.0** — *Detect. Verify. Investigate. Report.*
#   F a k e N i x - V 2  
 