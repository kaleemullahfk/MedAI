# MedAI FastAPI backend — container for Render (or any Docker host).
# Build context: the backend/ directory (see .dockerignore).
#
# Render injects the PORT env var at runtime; we fall back to 8000 for local
# `docker run`. Secrets (DATABASE_URL, SECRET_KEY, GROQ_API_KEY) are provided
# by the host as environment variables, never baked into the image.

FROM python:3.12-slim

# Don't buffer Python output; makes the live logs on Render readable.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install dependencies first so the layer is cached across code changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application. .dockerignore keeps secrets, uploads and caches out.
COPY . .

# Render's container runtime listens on $PORT; 8000 is the local default.
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
