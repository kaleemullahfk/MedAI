import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session, joinedload

from app.database.connection import get_db
from app.models.prescription import Prescription
from app.models.user import User
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse
from app.services.current_user import get_current_user
from app.services.role_checker import require_role
from app.services.pdf_service import extract_text_from_pdf
from app.services.ocr_service import extract_text_from_image
from app.services.file_service import validate_and_save
from app.services.groq_service import ask_groq_json, wrap_user_input, PROMPT_INJECTION_GUARD
from app.prompts.prescription_prompt import SYSTEM_PROMPT

router = APIRouter(
    prefix="/prescription",
    tags=["Prescriptions & AI Analyzer"]
)


@router.post("", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
def create_prescription(
    prescription: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    patient = db.query(User).filter(User.id == prescription.patient_id, User.role == "patient").first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient user not found.")

    new_prescription = Prescription(
        doctor_id=current_user.id,
        patient_id=prescription.patient_id,
        appointment_id=prescription.appointment_id,
        diagnosis=prescription.diagnosis.strip(),
        medicines=prescription.medicines.strip(),
        instructions=prescription.instructions.strip() if prescription.instructions else None,
    )

    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)

    return new_prescription


@router.get("/my", response_model=List[PrescriptionResponse])
def get_my_prescriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["patient"]))
):
    # Patient Data Privacy: Return only this patient's prescriptions
    prescriptions = (
        db.query(Prescription)
        .options(joinedload(Prescription.doctor))
        .filter(Prescription.patient_id == current_user.id)
        .order_by(Prescription.created_at.desc())
        .all()
    )

    return prescriptions


@router.get("/doctor", response_model=List[PrescriptionResponse])
def get_doctor_prescriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    # Doctor Data Privacy: Return prescriptions created by this doctor
    prescriptions = (
        db.query(Prescription)
        .options(joinedload(Prescription.patient))
        .filter(Prescription.doctor_id == current_user.id)
        .order_by(Prescription.created_at.desc())
        .all()
    )

    return prescriptions


@router.delete("/{prescription_id}")
def delete_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    prescription = db.query(Prescription).filter(
        Prescription.id == prescription_id,
        Prescription.doctor_id == current_user.id
    ).first()

    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found or not owned by doctor.",
        )

    db.delete(prescription)
    db.commit()

    return {"message": "Prescription deleted successfully."}


@router.post("/analyze-file")
def analyze_prescription_file(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["patient"]))
):
    file_path, stored_name = validate_and_save(file, "prescriptions")
    extension = os.path.splitext(stored_name)[1].lower()

    try:
        text = (
            extract_text_from_pdf(str(file_path))
            if extension == ".pdf"
            else extract_text_from_image(str(file_path))
        )
    except Exception:  # noqa: BLE001 - normalize extraction failures
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Could not extract text from the uploaded file. Please upload a clear, legible PDF or image.",
        )

    if not text or not text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="No readable text was found in the uploaded file. Please upload a clear, legible PDF or image.",
        )

    prompt = f"""
{SYSTEM_PROMPT}

{PROMPT_INJECTION_GUARD}

Prescription Document Text:
{wrap_user_input(text.strip())}
"""

    try:
        return ask_groq_json(prompt)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service is unavailable. Please try again.",
            headers={"X-MEDAI-CODE": "AI_UNAVAILABLE"},
        )
