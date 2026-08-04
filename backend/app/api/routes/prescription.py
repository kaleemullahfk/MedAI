import os
import shutil
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session, joinedload

from app.database.connection import get_db
from app.models.prescription import Prescription
from app.models.user import User
from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate, PrescriptionResponse
from app.services.current_user import get_current_user
from app.services.role_checker import require_role
from app.services.pdf_service import extract_text_from_pdf
from app.services.ocr_service import extract_text_from_image
from app.services.groq_service import ask_groq
from app.prompts.prescription_prompt import SYSTEM_PROMPT

router = APIRouter(
    prefix="/prescription",
    tags=["Prescriptions & AI Analyzer"]
)


@router.post("/", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
def create_prescription(
    prescription: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    patient = db.query(User).filter(User.id == prescription.patient_id, User.role == "patient").first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient user not found.")

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
        raise HTTPException(status_code=404, detail="Prescription not found or not owned by doctor.")

    db.delete(prescription)
    db.commit()

    return {"message": "Prescription deleted successfully."}


@router.post("/analyze-file")
def analyze_prescription_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    upload_dir = "app/uploads/prescriptions"
    os.makedirs(upload_dir, exist_ok=True)

    safe_filename = f"{current_user.id}_{file.filename}"
    file_path = os.path.join(upload_dir, safe_filename)

    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in [".pdf", ".jpg", ".jpeg", ".png", ".jfif"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, JPG, or PNG.")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        if extension == ".pdf":
            extracted_text = extract_text_from_pdf(file_path)
        else:
            extracted_text = extract_text_from_image(file_path)
    except Exception as e:
        extracted_text = f"Text extraction summary for prescription file: {file.filename}"

    prompt = f"""
{SYSTEM_PROMPT}

Prescription Document Text:
{extracted_text}
"""

    ai_response = ask_groq(prompt)

    try:
        parsed_json = json.loads(ai_response)
        return parsed_json
    except Exception:
        return {
            "analysis": ai_response,
            "raw_text": extracted_text,
            "filename": file.filename
        }