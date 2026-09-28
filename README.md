# FAKENIX 2.0

AI-powered deepfake detection and digital forensics platform: image and video analysis,
SHA-256 evidence records, PDF forensic reports, and cybercrime incident report preparation.

## Repository layout

```
FakeNix-v1/
├── backend/     Flask REST API (Python 3.12, managed with uv)
│   ├── app/             application package (routes, services, models, ai)
│   ├── migrations/      Flask-Migrate / Alembic
│   ├── scripts/         init_db.py, seed_demo_data.py
│   ├── tests/           pytest suite
│   ├── pyproject.toml   dependencies
│   ├── uv.lock          locked versions
│   └── run.py           entry point
└── frontend/    React + Vite single-page app
    ├── src/
    ├── public/
    └── package.json
```

## Prerequisites

- [uv](https://docs.astral.sh/uv/) (installs Python 3.12 automatically)
- Node.js 18+ and npm

## Quick start

### Backend (http://127.0.0.1:5000)

```bash
cd backend
cp .env.example .env              # then edit values
uv sync                           # creates .venv and installs dependencies
uv run python scripts/init_db.py
uv run python scripts/seed_demo_data.py   # optional: demo user demo@fakenix.ai / Demo@123
uv run python run.py
```

Image and video analysis is performed by a vision LLM on [Groq](https://console.groq.com/).
Set `GROQ_API_KEY` and `GROQ_MODEL` (e.g. `qwen/qwen3.8-27b`) in `backend/.env`. There is no
offline fallback: without a valid key, uploads fail with a clear error.

### Frontend (http://localhost:5173)

```bash
cd frontend
cp .env.example .env              # VITE_API_BASE_URL defaults to http://localhost:5000/api
npm install
npm run dev
```

## Tests

```bash
cd backend
uv run pytest
```

## Documentation

- [backend/README.md](backend/README.md): database setup, migrations, API endpoints, storage, security
- [frontend/README.md](frontend/README.md): frontend features and structure

## License

[MIT](LICENSE)
