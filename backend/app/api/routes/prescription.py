import json
import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload

from app.database.connection import get_db
from app.models.prescription import Prescription
from app.models.medical_record import MedicalReport
from app.models.user import User
from app.models.patient_profile import PatientProfile
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionResponse,
)
from app.services.current_user import get_current_user
from app.services.role_checker import require_role
from app.services.pdf_service import extract_text_from_pdf
from app.services.ocr_service import extract_text_from_image
from app.services.file_service import validate_and_save
from app.services.groq_service import ask_groq_json, wrap_user_input, PROMPT_INJECTION_GUARD
from app.services.prescription_pdf_service import generate_prescription_pdf
from app.prompts.ai_prescription_prompt import SYSTEM_PROMPT as AI_PRESCRIPTION_PROMPT
from app.prompts.prescription_prompt import SYSTEM_PROMPT

router = APIRouter(
    prefix="/prescription",
    tags=["Prescriptions & AI Analyzer"]
)

APPROVED_STATUSES = {"draft", "approved", "rejected"}


def _to_response(p: Prescription) -> PrescriptionResponse:
    resp = PrescriptionResponse.model_validate(p)
    if p.report:
        resp.report_title = p.report.title
    return resp


# --------------------------------------------------------------------------
# AI generation (doctor)
# --------------------------------------------------------------------------
@router.post("/generate", response_model=PrescriptionResponse)
def generate_ai_prescription(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"])),
):
    """Generate a draft AI prescription from a report's SAVED analysis.

    Never re-runs the report AI: it reads the report's stored ai_analysis and
    builds a structured prescription draft from it. Enforces one approved
    prescription per report (a draft can be regenerated/edited)."""
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    if not report.ai_analysis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This report has no AI analysis to build a prescription from.",
        )

    # Enforce one approved prescription per report.
    existing_approved = (
        db.query(Prescription)
        .filter(Prescription.report_id == report_id, Prescription.status == "approved")
        .first()
    )
    if existing_approved:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An approved prescription already exists for this report (Rx #{existing_approved.id}).",
        )

    try:
        analysis = json.loads(report.ai_analysis) if isinstance(report.ai_analysis, str) else report.ai_analysis
    except (json.JSONDecodeError, TypeError):
        analysis = {}

    patient = db.query(User).filter(User.id == report.patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report has no valid patient.")

    prompt = f"""
{AI_PRESCRIPTION_PROMPT}

{PROMPT_INJECTION_GUARD}

Medical Report Analysis (trusted backend output, do not re-derive):
{json.dumps(analysis, default=str)[:6000]}

Patient name: {patient.full_name}
"""

    try:
        draft = ask_groq_json(prompt)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service is unavailable. Please try again.",
            headers={"X-MEDAI-CODE": "AI_UNAVAILABLE"},
        )

    diagnosis = draft.get("primary_diagnosis") or draft.get("diagnosis") or "Not Available"
    medicines = draft.get("medicines") or [{"medicine": "Not Available"}]

    new_prescription = Prescription(
        doctor_id=current_user.id,
        patient_id=report.patient_id,
        report_id=report.id,
        ai_analysis_ref=report.ai_analysis,
        status="draft",
        diagnosis=str(diagnosis),
        clinical_findings=json.dumps(draft.get("clinical_summary", []), default=str) if draft.get("clinical_summary") else None,
        ai_summary=str(draft.get("clinical_summary") or draft.get("summary") or ""),
        severity=str(draft.get("severity") or ""),
        medicines=json.dumps(medicines, default=str),
        lifestyle_advice="\n".join(draft.get("lifestyle_advice", []) or []),
        diet_recommendations="\n".join(draft.get("diet_recommendations", []) or []),
        exercise_recommendations="\n".join(draft.get("exercise_recommendations", []) or []),
        hydration_advice="\n".join(draft.get("hydration_advice", []) or []),
        follow_up=str(draft.get("follow_up_interval") or ""),
        lab_tests="\n".join(draft.get("recommended_lab_tests", []) or []),
        emergency_warnings="\n".join(draft.get("emergency_warning_signs", []) or []),
        interactions="\n".join(draft.get("drug_interaction_warnings", []) or []),
        notes=str(draft.get("notes") or ""),
    )
    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)
    return _to_response(new_prescription)


# --------------------------------------------------------------------------
# Create / update / approve / delete
# --------------------------------------------------------------------------
@router.post("", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
def create_prescription(
    prescription: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    patient = db.query(User).filter(User.id == prescription.patient_id, User.role == "patient").first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient user not found.")

    if prescription.status not in APPROVED_STATUSES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Invalid prescription status.")

    # Enforce one approved per report.
    if prescription.report_id and prescription.status == "approved":
        existing = (
            db.query(Prescription)
            .filter(Prescription.report_id == prescription.report_id, Prescription.status == "approved")
            .first()
        )
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An approved prescription already exists for this report.")

    new_prescription = Prescription(
        doctor_id=current_user.id,
        patient_id=prescription.patient_id,
        appointment_id=prescription.appointment_id,
        report_id=prescription.report_id,
        status=prescription.status,
        diagnosis=prescription.diagnosis.strip(),
        clinical_findings=prescription.clinical_findings,
        ai_summary=prescription.ai_summary,
        severity=prescription.severity,
        medicines=prescription.medicines,
        lifestyle_advice=prescription.lifestyle_advice,
        diet_recommendations=prescription.diet_recommendations,
        exercise_recommendations=prescription.exercise_recommendations,
        hydration_advice=prescription.hydration_advice,
        follow_up=prescription.follow_up,
        lab_tests=prescription.lab_tests,
        emergency_warnings=prescription.emergency_warnings,
        interactions=prescription.interactions,
        notes=prescription.notes,
    )
    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)
    return _to_response(new_prescription)


@router.get("/my", response_model=List[PrescriptionResponse])
def get_my_prescriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["patient"]))
):
    # Patient Data Privacy: Return only this patient's prescriptions
    prescriptions = (
        db.query(Prescription)
        .options(joinedload(Prescription.doctor), joinedload(Prescription.report))
        .filter(Prescription.patient_id == current_user.id)
        .order_by(Prescription.created_at.desc())
        .all()
    )
    return [_to_response(p) for p in prescriptions]


@router.get("/doctor", response_model=List[PrescriptionResponse])
def get_doctor_prescriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    # Doctor Data Privacy: Return prescriptions created by this doctor
    prescriptions = (
        db.query(Prescription)
        .options(joinedload(Prescription.patient), joinedload(Prescription.report))
        .filter(Prescription.doctor_id == current_user.id)
        .order_by(Prescription.created_at.desc())
        .all()
    )
    return [_to_response(p) for p in prescriptions]


@router.get("/by-report/{report_id}", response_model=List[PrescriptionResponse])
def get_prescriptions_by_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"])),
):
    prescriptions = (
        db.query(Prescription)
        .options(joinedload(Prescription.patient))
        .filter(Prescription.report_id == report_id)
        .order_by(Prescription.created_at.desc())
        .all()
    )
    return [_to_response(p) for p in prescriptions]


@router.put("/{prescription_id}", response_model=PrescriptionResponse)
def update_prescription(
    prescription_id: int,
    payload: PrescriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    prescription = db.query(Prescription).filter(
        Prescription.id == prescription_id,
        Prescription.doctor_id == current_user.id,
    ).first()
    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found or not owned by doctor.")

    if prescription.status == "approved":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Approved prescriptions cannot be edited.")

    data = payload.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(prescription, field, val)
    db.commit()
    db.refresh(prescription)
    return _to_response(prescription)


@router.post("/{prescription_id}/approve", response_model=PrescriptionResponse)
def approve_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    prescription = db.query(Prescription).filter(
        Prescription.id == prescription_id,
        Prescription.doctor_id == current_user.id,
    ).first()
    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found or not owned by doctor.")

    if prescription.report_id:
        existing = (
            db.query(Prescription)
            .filter(
                Prescription.report_id == prescription.report_id,
                Prescription.status == "approved",
                Prescription.id != prescription.id,
            )
            .first()
        )
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Another approved prescription already exists for this report.")

    prescription.status = "approved"
    db.commit()
    db.refresh(prescription)
    return _to_response(prescription)


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


@router.get("/{prescription_id}/pdf")
def prescription_pdf(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prescription = db.query(Prescription).options(
        joinedload(Prescription.doctor), joinedload(Prescription.patient)
    ).filter(Prescription.id == prescription_id).first()

    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found.")

    # Patient can view/download only their own; doctors only their own or any patient's.
    if current_user.role == "patient" and prescription.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this prescription.")
    if current_user.role == "doctor" and prescription.doctor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this prescription.")

    if prescription.status != "approved" and current_user.role == "patient":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Prescription is not yet approved.")

    pdf_bytes = generate_prescription_pdf(prescription)
    filename = f"prescription_{prescription.id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )


# --------------------------------------------------------------------------
# File analyzer (patient uploads a prescription image/PDF for OCR)
# --------------------------------------------------------------------------
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
