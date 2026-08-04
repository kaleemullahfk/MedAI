# MedAI 🚑

AI-powered healthcare platform: a **FastAPI** backend (auth, appointments, AI symptom checker, medical report & prescription analysis via Groq, chatbot) and a **Next.js** frontend for patients, doctors, and admins.

## Repo layout

| Path | What it is |
|---|---|
| `backend/` | FastAPI + SQLAlchemy API (`app/`) |
| `medai-frontend/` | Next.js 16 app (the frontend) |
| `docs/` `dataset/` `screenshots/` | Supporting assets (empty placeholders) |

## Prerequisites

- Python 3.11+ (tested on 3.14)
- Node 20.9+ (required by Next.js 16)

## 1. Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   |  macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env     # then fill in DATABASE_URL, SECRET_KEY, GROQ_API_KEY

alembic upgrade head     # create/migrate the database schema

uvicorn app.main:app --reload
```

- API docs (Swagger): <http://127.0.0.1:8000/docs>
- Health check: <http://127.0.0.1:8000/health>

> **`.env` is not tracked.** `SECRET_KEY` must be set outside development. Generate one with `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
> Admin account: `python -m app.scripts.seed_admin` (idempotent, uses `ADMIN_EMAIL`/`ADMIN_PASSWORD`).

## 2. Frontend

```bash
cd medai-frontend
npm install

cp .env.example .env.local   # set BACKEND_URL=http://127.0.0.1:8000 and JWT_SECRET (same value as backend SECRET_KEY)

npm run dev
```

Open <http://localhost:3000>.

## How auth works (frontend ↔ backend)

The frontend never sees the JWT in JavaScript: login is handled by a Next.js route handler that stores the token in an **HttpOnly cookie**; `proxy.ts` guards `/patient`, `/doctor`, `/admin` by decoding the cookie, and a catch-all BFF route forwards `/api/*` calls to the backend with the token attached server-side.

## Tests

```bash
# Backend
cd backend && pytest

# Frontend
cd medai-frontend && npm run lint && npm run typecheck && npm run build
```
