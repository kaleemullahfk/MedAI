"""Generate a professional, printable A4 prescription PDF with PyMuPDF (fitz)."""

import json
from datetime import datetime
from typing import Dict, List, Optional

import fitz  # PyMuPDF

from app.models.prescription import Prescription

# Brand colors (hospital green/blue tones).
PRIMARY = (0.08, 0.36, 0.63)      # deep blue
ACCENT = (0.0, 0.55, 0.35)        # green
TEXT = (0.15, 0.15, 0.15)
MUTED = (0.45, 0.45, 0.45)
LINE = (0.8, 0.8, 0.8)

HOSPITAL_NAME = "MedAI Hospital"
HOSPITAL_ADDRESS = "123 Health Avenue, Wellness City"
HOSPITAL_CONTACT = "Phone: +92-300-1234567 | info@medai.dev"


def _medicines_list(raw: str) -> List[Dict[str, str]]:
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return data
    except (json.JSONDecodeError, TypeError):
        pass
    # Fallback: plain text -> single-row placeholder.
    return [{"medicine": raw, "strength": "", "dosage": "", "frequency": "", "duration": "", "route": "", "instructions": ""}]


def generate_prescription_pdf(prescription: Prescription) -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4
    margin = 48
    width = page.rect.width - 2 * margin
    y = 40

    def text(x, y, s, size=10, color=TEXT, font="helv", bold=False):
        # "hebo" = Helvetica Bold (PyMuPDF built-in), "helv" = regular.
        fname = "hebo" if bold else "helv"
        return page.insert_text((x, y), s, fontsize=size, color=color, fontname=fname)

    def line(yy, x0=margin, x1=width + margin, color=LINE):
        page.draw_line((x0, yy), (x1, yy), color=color, width=0.7)

    # Header
    text(margin, y, HOSPITAL_NAME, size=18, color=PRIMARY, bold=True)
    text(margin, y + 16, HOSPITAL_ADDRESS, size=9, color=MUTED)
    text(margin, y + 28, HOSPITAL_CONTACT, size=9, color=MUTED)

    # Prescription number + date (right side)
    text(width - 60, y + 8, f"Rx No: {prescription.id:05d}", size=12, color=PRIMARY, bold=True)
    text(width - 60, y + 22, f"Date: {prescription.created_at.strftime('%d %b %Y')}", size=9, color=MUTED)
    y += 48
    line(y)
    y += 20

    # Doctor + Patient
    doctor = prescription.doctor
    patient = prescription.patient
    text(margin, y, "DOCTOR", size=9, color=PRIMARY, bold=True)
    text(margin, y + 14, doctor.full_name if doctor else "—", size=11, bold=True)
    text(margin, y + 28, "Specialist / License: see hospital records", size=9, color=MUTED)

    text(width / 2 + margin, y, "PATIENT", size=9, color=ACCENT, bold=True)
    text(width / 2 + margin, y + 14, patient.full_name if patient else "—", size=11, bold=True)
    text(width / 2 + margin, y + 28, f"Patient ID: {prescription.patient_id}", size=9, color=MUTED)
    y += 44
    line(y)
    y += 18

    # Diagnosis
    text(margin, y, "DIAGNOSIS", size=9, color=PRIMARY, bold=True)
    y += 13
    text(margin, y, prescription.diagnosis, size=11, bold=True)
    y += 16
    if prescription.clinical_findings:
        text(margin, y, "Clinical Findings", size=9, color=MUTED, bold=True)
        y += 12
        y += _wrap(page, margin, width, y, prescription.clinical_findings, size=10)
        y += 8

    # Medicines table
    line(y)
    y += 14
    text(margin, y, "MEDICINES", size=9, color=PRIMARY, bold=True)
    y += 12

    meds = _medicines_list(prescription.medicines)
    col_w = [width * 0.22, width * 0.14, width * 0.16, width * 0.16, width * 0.14, width * 0.18]
    headers = ["Medicine", "Strength", "Dosage", "Frequency", "Duration", "Instructions"]
    x = margin
    for i, h in enumerate(headers):
        page.insert_text((x, y), h, fontsize=8, color=MUTED, fontname="hebo")
        x += col_w[i]
    y += 8
    line(y)
    y += 10
    for med in meds:
        x = margin
        cells = [med.get("medicine", ""), med.get("strength", ""), med.get("dosage", ""),
                 med.get("frequency", ""), med.get("duration", ""), med.get("instructions", "")]
        row_h = 12
        for i, c in enumerate(cells):
            page.insert_text((x, y), (c or "—")[:40], fontsize=8, color=TEXT)
            x += col_w[i]
        y += row_h
    y += 8

    # Advice sections
    def section(title, value, yy):
        if not value:
            return yy
        yy += 8
        page.insert_text((margin, yy), title, fontsize=9, color=ACCENT, fontname="hebo")
        yy += 12
        yy = _wrap(page, margin, width, yy, value, size=10)
        return yy

    y = section("Lifestyle Advice", prescription.lifestyle_advice, y)
    y = section("Diet Recommendations", prescription.diet_recommendations, y)
    y = section("Exercise Recommendations", prescription.exercise_recommendations, y)
    y = section("Follow-up", prescription.follow_up, y)
    y = section("Recommended Lab Tests", prescription.lab_tests, y)
    y = section("Emergency Warning Signs", prescription.emergency_warnings, y)
    y = section("Drug Interaction Warnings", prescription.interactions, y)
    y = section("Doctor Notes", prescription.notes, y)

    # Footer
    if y < 760:
        line(782)
        text(margin, 795, "Signature: ______________________", size=9, color=MUTED)
        text(width - 120, 795, "Doctor", size=9, color=MUTED)
        text(margin, 815, HOSPITAL_NAME + " | " + HOSPITAL_CONTACT, size=8, color=MUTED)
        text(width + margin - 50, 815, "Page 1 of 1", size=8, color=MUTED)

    data = doc.tobytes()
    doc.close()
    return data


def _wrap(page, x, width, y, text_value, size=10):
    """Simple word wrap; returns new y."""
    words = text_value.split(" ")
    line = ""
    line_height = size + 4
    for word in words:
        probe = (line + " " + word).strip()
        if fitz.get_text_length(probe, fontname="helv", fontsize=size) > width:
            page.insert_text((x, y), line, fontsize=size, color=TEXT)
            y += line_height
            line = word
        else:
            line = probe
    if line:
        page.insert_text((x, y), line, fontsize=size, color=TEXT)
        y += line_height
    return y
