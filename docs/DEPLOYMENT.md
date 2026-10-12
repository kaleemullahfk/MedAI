# Deploying MedAI (free)

MedAI is a monorepo with two deployable services:

- `backend/` — FastAPI (Docker)
- `medai-frontend/` — Next.js (Vercel)

They talk over HTTPS: the frontend's BFF proxies `/api/*` to the backend and
attaches the JWT from an HttpOnly cookie. All LLM calls happen in the backend.

Free stack: **Neon** (Postgres) + **Render** (backend) + **Vercel** (frontend).
Everything on this stack has a free tier sufficient for a demo/academic deploy.

> ⚠️ Before deploying, **commit and push** all changes. Vercel and Render build
> from a git branch — uncommitted work won't be deployed.

```bash
git add -A && git commit -m "deploy prep" && git push
```

---

## Prerequisites (sign up)

All are free, no credit card:

- **Neon** — <https://neon.tech> (database)
- **Render** — <https://render.com> (backend)
- **Vercel** — <https://vercel.com> (frontend)

Also grab your existing values from `backend/.env` (do **not** paste the local
`.env` anywhere — these are secrets you re-enter in the dashboards):

- `SECRET_KEY` — must be the same value on Render **and** Vercel (as `JWT_SECRET`)
- `GROQ_API_KEY`

---

## 1. Database — Neon

1. Create a new Neon project (free). Note the **region** — keep it close to where
   you'll host Render for lower latency.
2. Neon gives you two connection strings:
   - **Direct** — use this one for the app (psycopg2 works with it).
   - Pooled (pgbouncer) — not needed here.
3. Copy the **Direct connection string**. It looks like:
   ```
   postgresql://USER:PASS@ep-xxx.region.aws.neon.tech/mediadb?sslmode=require
   ```
   Keep the `?sslmode=require` part — Neon requires TLS.
4. **Create the schema.** Do this once (idempotent). From `backend/`:
   ```bash
   DATABASE_URL="postgresql://USER:PASS@host/mediadb?sslmode=require" \
   ".venv/Scripts/python.exe" -m alembic upgrade head
   ```
   (On Linux/macOS use `./.venv/bin/python -m alembic upgrade head`.)
5. **Optional — seed an admin.** Requires `ADMIN_EMAIL` + `ADMIN_PASSWORD` set
   the same way:
   ```bash
   ADMIN_EMAIL=you@medai.dev ADMIN_PASSWORD="<strong>" \
   DATABASE_URL="postgresql://USER:PASS@host/mediadb?sslmode=require" \
   ".venv/Scripts/python.exe" -m app.scripts.seed_admin
   ```

> **Headless note:** if you can't reach the local shell, you can instead run
> these as one-off commands in Render's *Shell* (see step 2) against the same
> `DATABASE_URL`.

---

## 2. Backend — Render

1. **New → Web Service** → connect the `kaleemullahfk/MedAI` GitHub repo.
   - **Root Directory:** `backend`  ← important, it's a monorepo
   - **Region:** same as Neon
   - **Runtime:** **Docker** (a `Dockerfile` already exists in `backend/`)
   - Plan: **Free**
2. **Environment Variables** (Render → service → *Environment*):
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Neon **Direct** connection string (with `?sslmode=require`) |
   | `SECRET_KEY` | same value as Vercel's `JWT_SECRET` (use a strong random string) |
   | `GROQ_API_KEY` | your Groq key |
   | `ENVIRONMENT` | `production` |
   | `CORS_ORIGINS` | your Vercel URL, e.g. `https://medai.vercel.app` |
   | `UPLOAD_DIR` | `/app/uploads` |
   | `ALGORITHM` | `HS256` |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` |
3. **Pre-deploy command** (service settings → *Pre-deploy Command*), so the
   schema is always current on deploy:
   ```
   python -m alembic upgrade head
   ```
   *(Runs inside the container where `DATABASE_URL` is already set. Idempotent.)*
4. **Deploy.** Render builds the image, runs the pre-deploy migrations, starts
   the container.
5. When ready, copy the service's **public URL**, e.g. `https://medai-api.onrender.com`.
   Verify it: open `<url>/health` → should return `{"status":"Healthy"}`.

**Free-tier gotchas (expected, not bugs):**
- **Cold starts:** the free web service sleeps after ~15 min idle and takes
  ~30–60s to wake on the next request. Fine for a demo; not for production.
- **Ephemeral disk:** files in `/app/uploads` don't survive a redeploy or
  scale event. Report/prescription *file* uploads are transient. The DB-backed
  data (users, appointments, analyses, prescription records) persists in Neon.

---

## 3. Frontend — Vercel

1. **Add New → Project** → import the `kaleemullahfk/MedAI` repo.
   - **Framework Preset:** Next.js
   - **Root Directory / Directory:** `medai-frontend`  ← monorepo
2. **Environment Variables** (Project → *Settings* → *Environment Variables*),
   for **Production** (and, if you use a preview, Preview/Development too):
   | Key | Value |
   |---|---|
   | `BACKEND_URL` | the Render public URL (`https://medai-api.onrender.com`) |
   | `JWT_SECRET` | **identical** to Render's `SECRET_KEY` |
3. **Deploy.**
4. Vercel gives you a URL (custom or `https://medai.vercel.app`). Set the same
   value in the backend's `CORS_ORIGINS` (step 2.2) if it's a custom domain.

The login flow: Vercel's `/api/auth/login` route handler stores the JWT in an
HttpOnly cookie; `proxy.ts` verifies it locally with `JWT_SECRET` and enforces
roles. That's why `JWT_SECRET` (Vercel) and `SECRET_KEY` (Render) **must match**.

---

## Verify

1. Open the Vercel URL.
2. Register a new **patient** or **doctor** (public registration is open for those
   roles), or log in as the seeded **admin**.
3. Try a full flow: book an appointment, upload a **PDF** report, run the AI
   symptom checker / chatbot, and generate a prescription.

## Known limitations on the free setup

- **No Tesseract on Render** → image OCR of uploaded prescription/report *images*
  won't work. **PDFs** (PyMuPDF) and all Groq-based features (symptom checker,
  medicine/disease explanation, chatbot, AI prescription drafts) work fine.
  If you need image OCR, add a Tesseract build stage to the Dockerfile and set
  `TESSERACT_CMD`.
- **Cold starts** (Render free tier) — first request after idle is slow.

### Swapping platforms (if you prefer)
- Backend: **Fly.io** (always-on, ~$5/mo free credit) instead of Render →
  faster, no sleeping; `fly launch` builds from the same Dockerfile.
- Database: **Supabase** instead of Neon (also free Postgres).
