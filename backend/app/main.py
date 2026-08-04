import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.database.connection import engine
from app.database.base import Base
from app.api.routes import (
    auth,
    users,
    dashboard,
    patient_profile,
    doctor_profile,
    symptom,
    medicine,
    disease,
    report,
    prescription,
    appointment,
    chatbot,
    admin,
)
import app.models  # noqa: F401  (registers all models on Base.metadata)

# Set up structured-ish logging early so handlers below can use it.
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)
logger = logging.getLogger("medai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure the upload root exists before any request can write to it.
    upload_root = Path(settings.UPLOAD_DIR).expanduser()
    upload_root.mkdir(parents=True, exist_ok=True)

    if not engine.dialect.has_table(engine.connect(), "alembic_version"):
        logger.warning(
            "No Alembic migration state found. Run `alembic upgrade head` "
            "inside backend/ before relying on the schema."
        )

    yield


app = FastAPI(
    title="MEDAI API",
    description="Medical AI Assistant Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in settings.CORS_ORIGINS.split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s -> %s (%.1f ms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Request validation failed.",
            "code": "VALIDATION_ERROR",
            "errors": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "code": "INTERNAL"},
    )


# Include API Routes
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(patient_profile.router)
app.include_router(doctor_profile.router)
app.include_router(symptom.router)
app.include_router(medicine.router)
app.include_router(disease.router)
app.include_router(report.router)
app.include_router(prescription.router)
app.include_router(appointment.router)
app.include_router(chatbot.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"message": "Welcome to MEDAI 🚑"}


@app.get("/health")
def health():
    return {"status": "Healthy", "version": "1.0.0"}
