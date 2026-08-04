# Import all models

from fastapi import FastAPI
from app.api.routes import (
    auth,
    users,
    dashboard,
    patient_profile,
    doctor_profile,
    symptom,
    medicine,
    disease,
    doctor_profile,
    report,
    prescription,
    appointment,
    chatbot
)
from app.database.connection import engine
from app.database.base import Base
import app.models.user
import app.models.patient_profile
from fastapi.middleware.cors import CORSMiddleware



# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="MEDAI API",
    description="Medical AI Assistant Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.get("/")
def root():
    return {
        "message": "Welcome to MEDAI 🚑"
    }


@app.get("/health")
def health():
    return {
        "status": "Healthy",
        "version": "1.0.0"
    }