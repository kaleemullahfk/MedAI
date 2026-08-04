import json
import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.medical_record import MedicalReport
from app.models.user import User
from app.schemas.report import MedicalReportResponse
from app.services.current_user import get_current_user
from app.services.role_checker import require_role
from app.services.pdf_service import extract_text_from_pdf
from app.services.ocr_service import extract_text_from_image
from app.services.file_service import validate_and_save
from app.services.groq_service import ask_groq_json, wrap_user_input, PROMPT_INJECTION_GUARD
from app.prompts.report_prompt import SYSTEM_PROMPT

router = APIRouter(
    prefix="/report",
    tags=["Medical Reports"]
)


def _extract_text(file_path: str, extension: str) -> str:
    """Extract text from an uploaded file or fail explicitly.

    Returns a non-empty, stripped string. Raises 422 when extraction fails or
    produces nothing — we never feed placeholder text to the AI.
    """
    try:
        text = (
            extract_text_from_pdf(file_path)
            if extension == ".pdf"
            else extract_text_from_image(file_path)
        )
    except Exception as exc:  # noqa: BLE001 - normalize extraction failures
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Could not extract text from the uploaded file. Please upload a clear, legible PDF or image.",
        ) from exc

    if not text or not text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="No readable text was found in the uploaded file. Please upload a clear, legible PDF or image.",
        )

    return text.strip()


@router.post("/upload", response_model=MedicalReportResponse, status_code=status.HTTP_201_CREATED)
def upload_and_analyze_report(
    title: str = Form("Medical Report"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["patient"]))
):
    file_path, stored_name = validate_and_save(file, "reports")
    extension = os.path.splitext(stored_name)[1].lower()

    extracted_text = _extract_text(str(file_path), extension)

    prompt = f"""
{SYSTEM_PROMPT}

{PROMPT_INJECTION_GUARD}

Medical Report Text:
{wrap_user_input(extracted_text)}
"""

    try:
        analysis = ask_groq_json(prompt)
    except Exception:
        # The file is stored but the AI failed; persist what we know so the
        # user keeps the report and can retry analysis later.
        analysis = {
            "summary": "AI analysis is currently unavailable.",
            "findings": [],
            "recommendations": ["Please try analyzing this report again later."],
        }

    report_record = MedicalReport(
        patient_id=current_user.id,
        title=title.strip(),
        file_name=file.filename,
        file_path=str(file_path),
        file_type=extension.replace(".", ""),
        extracted_text=extracted_text,
        ai_analysis=json.dumps(analysis),
    )

    db.add(report_record)
    db.commit()
    db.refresh(report_record)

    return report_record


@router.get("/my", response_model=List[MedicalReportResponse])
def get_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["patient"]))
):
    # Patient Data Privacy: Return only this patient's medical reports
    reports = db.query(MedicalReport).filter(
        MedicalReport.patient_id == current_user.id
    ).order_by(MedicalReport.uploaded_at.desc()).all()

    return reports


@router.get("/patient/{patient_id}", response_model=List[MedicalReportResponse])
def get_patient_reports(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor", "admin"]))
):
    # Doctor Data Privacy: Doctors or Admins can view reports for a specific patient
    reports = db.query(MedicalReport).filter(
        MedicalReport.patient_id == patient_id
    ).order_by(MedicalReport.uploaded_at.desc()).all()

    return reports


@router.delete("/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()

    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    if current_user.role == "patient" and report.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this report.")

    if os.path.exists(report.file_path):
        try:
            os.remove(report.file_path)
        except OSError:
            # Log and continue: the DB record is still removed, so we do not
            # block deletion on a filesystem hiccup. The orphan is harmless.
            import logging
            logging.getLogger(__name__).warning(
                "Could not remove report file %s", report.file_path
            )

    db.delete(report)
    db.commit()

    return {"message": "Medical report deleted successfully."}


@router.get("/download/{report_id}")
def download_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()

    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    if current_user.role == "patient" and report.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to download this report.")

    if not os.path.exists(report.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Physical file missing from server storage.")

    return FileResponse(
        path=report.file_path,
        filename=report.file_name,
        media_type="application/octet-stream"
    )
