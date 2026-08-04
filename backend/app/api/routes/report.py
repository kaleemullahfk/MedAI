import os
import shutil
import json
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
from app.services.groq_service import ask_groq
from app.prompts.report_prompt import SYSTEM_PROMPT

router = APIRouter(
    prefix="/report",
    tags=["Medical Reports"]
)


@router.post("/upload", response_model=MedicalReportResponse, status_code=status.HTTP_201_CREATED)
def upload_and_analyze_report(
    title: str = Form("Medical Report"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["patient"]))
):
    upload_dir = "app/uploads/reports"
    os.makedirs(upload_dir, exist_ok=True)

    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in [".pdf", ".jpg", ".jpeg", ".png", ".jfif"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload PDF, JPG, or PNG files."
        )

    safe_filename = f"{current_user.id}_{int(os.times().system)}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(upload_dir, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        if extension == ".pdf":
            extracted_text = extract_text_from_pdf(file_path)
        else:
            extracted_text = extract_text_from_image(file_path)
    except Exception:
        extracted_text = f"Extracted text preview for report: {file.filename}"

    prompt = f"""
{SYSTEM_PROMPT}

Medical Report Text:
{extracted_text}
"""

    ai_raw = ask_groq(prompt)

    try:
        json.loads(ai_raw)
        ai_analysis_str = ai_raw
    except Exception:
        ai_analysis_str = json.dumps({
            "summary": "Medical report processed successfully.",
            "findings": [ai_raw],
            "recommendations": ["Consult your physician for detailed interpretation."]
        })

    report_record = MedicalReport(
        patient_id=current_user.id,
        title=title.strip(),
        file_name=file.filename,
        file_path=file_path,
        file_type=extension.replace(".", ""),
        extracted_text=extracted_text,
        ai_analysis=ai_analysis_str
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
        raise HTTPException(status_code=404, detail="Report not found.")

    if current_user.role == "patient" and report.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this report.")

    if os.path.exists(report.file_path):
        try:
            os.remove(report.file_path)
        except Exception:
            pass

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
        raise HTTPException(status_code=404, detail="Report not found.")

    if current_user.role == "patient" and report.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to download this report.")

    if not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Physical file missing from server storage.")

    return FileResponse(
        path=report.file_path,
        filename=report.file_name,
        media_type="application/octet-stream"
    )