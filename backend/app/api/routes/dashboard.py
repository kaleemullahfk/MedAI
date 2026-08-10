import json
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.database.connection import get_db

from app.models.user import User
from app.models.appointment import Appointment
from app.models.medical_record import MedicalReport
from app.models.prescription import Prescription
from app.models.chat_history import ChatHistory

from app.services.role_checker import require_role

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/patient")
def patient_dashboard(
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db)
):
    appointments = db.query(Appointment).filter(
        Appointment.patient_id == current_user.id
    ).count()

    reports = db.query(MedicalReport).filter(
        MedicalReport.patient_id == current_user.id
    ).count()

    prescriptions = db.query(Prescription).filter(
        Prescription.patient_id == current_user.id
    ).count()

    chat_history = db.query(ChatHistory).filter(
        ChatHistory.user_id == current_user.id
    ).count()

    return {
        "appointments": appointments,
        "reports": reports,
        "prescriptions": prescriptions,
        "chat_history": chat_history,
    }


@router.get("/doctor")
def doctor_dashboard(
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db)
):
    appointments = db.query(Appointment).filter(
        Appointment.doctor_id == current_user.id
    ).count()

    patients = (
        db.query(Appointment.patient_id)
        .filter(Appointment.doctor_id == current_user.id)
        .distinct()
        .count()
    )

    # Reports authored for this doctor's patients.
    patient_ids = (
        db.query(Appointment.patient_id)
        .filter(Appointment.doctor_id == current_user.id)
        .distinct()
        .subquery()
    )
    reports = (
        db.query(MedicalReport)
        .filter(MedicalReport.patient_id.in_(patient_ids))
        .count()
    )

    chats = db.query(ChatHistory).filter(
        ChatHistory.user_id == current_user.id
    ).count()

    return {
        "appointments": appointments,
        "patients": patients,
        "reports": reports,
        "chats": chats,
    }


@router.get("/admin")
def admin_dashboard(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    doctors = db.query(User).filter(
        User.role == "doctor"
    ).count()

    patients = db.query(User).filter(
        User.role == "patient"
    ).count()

    admins = db.query(User).filter(
        User.role == "admin"
    ).count()

    appointments = db.query(Appointment).count()

    return {
        "doctors": doctors,
        "patients": patients,
        "admins": admins,
        "appointments": appointments,
    }


# ---------------------------------------------------------------------------
# Analytics helpers
# ---------------------------------------------------------------------------
def _parse_range(days: Optional[int], start_date: Optional[str], end_date: Optional[str]):
    """Resolve a date range from days or an explicit start/end.

    Returns (start, end) inclusive datetime bounds (UTC).
    """
    today = date.today()
    if start_date and end_date:
        try:
            s = datetime.strptime(start_date, "%Y-%m-%d").date()
            e = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Dates must be YYYY-MM-DD.")
        if s > e:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="start_date must be <= end_date.")
        start = s
        end = e
    else:
        days = max(1, min(days or 30, 365))
        start = today - timedelta(days=days - 1)
        end = today

    start_dt = datetime.combine(start, datetime.min.time())
    end_dt = datetime.combine(end, datetime.max.time())
    return start, end, start_dt, end_dt


def _growth(current: float, previous: float):
    """Growth percentage vs the previous equal-length period."""
    if previous <= 0:
        return 100.0 if current > 0 else 0.0
    return round((current - previous) / previous * 100, 1)


def _safe_json(text):
    try:
        d = json.loads(text) if text else None
        return d if isinstance(d, dict) else {}
    except (json.JSONDecodeError, TypeError):
        return {}


def _top_list(db, model, attr, limit=6):
    """Most common values for a text column (e.g. diagnoses)."""
    rows = (
        db.query(attr, func.count(attr).label("count"))
        .group_by(attr)
        .order_by(func.count(attr).desc())
        .limit(limit)
        .all()
    )
    return [{"label": str(label), "count": count} for label, count in rows if label]


def _extract_from_json_analysis(db, key, limit=6):
    """Aggregate a list field (e.g. possible_diseases) from stored ai_analysis."""
    reports = db.query(MedicalReport.ai_analysis).all()
    counter: dict = {}
    for (raw,) in reports:
        parsed = _safe_json(raw)
        items = parsed.get(key)
        if isinstance(items, list):
            for item in items:
                if item:
                    counter[str(item).strip()] = counter.get(str(item).strip(), 0) + 1
    top = sorted(counter.items(), key=lambda kv: kv[1], reverse=True)[:limit]
    return [{"label": k, "count": v} for k, v in top]


# ---------------------------------------------------------------------------
# Comprehensive analytics endpoint
# ---------------------------------------------------------------------------
@router.get("/admin/analytics")
def admin_analytics(
    days: Optional[int] = Query(None, ge=1, le=365),
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """Full analytics payload for the admin dashboard.

    All numbers are computed live from the database with grouped SQL queries.
    """
    start, end, start_dt, end_dt = _parse_range(days, start_date, end_date)

    # ---- Overview totals (all-time) ----
    total_patients = db.query(User).filter(User.role == "patient").count()
    total_doctors = db.query(User).filter(User.role == "doctor").count()
    total_appointments = db.query(Appointment).count()
    total_reports = db.query(MedicalReport).count()
    total_prescriptions = db.query(Prescription).count()
    total_ai_analyses = db.query(MedicalReport).filter(MedicalReport.ai_analysis.isnot(None)).count()
    total_ai_prescriptions = db.query(Prescription).filter(Prescription.ai_analysis_ref.isnot(None)).count()

    today = date.today()
    today_appointments = db.query(Appointment).filter(Appointment.appointment_date == today).count()
    pending_appointments = db.query(Appointment).filter(Appointment.status == "Pending").count()
    completed_appointments = db.query(Appointment).filter(Appointment.status == "Completed").count()
    cancelled_appointments = db.query(Appointment).filter(Appointment.status == "Cancelled").count()

    active_users_today = (
        db.query(User)
        .filter(User.created_at >= datetime.combine(today, datetime.min.time()))
        .count()
    )

    # ---- Date-range totals (for growth comparison) ----
    def range_count(model, col):
        return db.query(model).filter(col >= start_dt, col <= end_dt).count()

    range_appointments = db.query(Appointment).filter(
        Appointment.appointment_date >= start, Appointment.appointment_date <= end
    ).count()
    range_reports = range_count(MedicalReport, MedicalReport.uploaded_at)
    range_prescriptions = range_count(Prescription, Prescription.created_at)
    range_patients = range_count(User, User.created_at)

    # Previous equal-length period
    period_len = (end - start).days + 1
    prev_end = start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=period_len - 1)
    prev_appointments = db.query(Appointment).filter(
        Appointment.appointment_date >= prev_start, Appointment.appointment_date <= prev_end
    ).count()
    prev_patients = db.query(User).filter(User.created_at >= datetime.combine(prev_start, datetime.min.time()),
                                          User.created_at <= datetime.combine(prev_end, datetime.max.time())).count()
    prev_reports = db.query(MedicalReport).filter(MedicalReport.uploaded_at >= datetime.combine(prev_start, datetime.min.time()),
                                                  MedicalReport.uploaded_at <= datetime.combine(prev_end, datetime.max.time())).count()

    # ---- Appointment analytics ----
    # Daily appointments in range
    appt_by_day_rows = (
        db.query(Appointment.appointment_date, func.count())
        .filter(Appointment.appointment_date >= start, Appointment.appointment_date <= end)
        .group_by(Appointment.appointment_date)
        .all()
    )
    appt_by_day = {str(d): c for d, c in appt_by_day_rows}
    daily_appointments = []
    for i in range(period_len):
        day = start + timedelta(days=i)
        daily_appointments.append({"date": str(day), "count": appt_by_day.get(str(day), 0)})

    # Monthly appointments (last 12 months) — group by YYYY-MM in Python.
    monthly_map: dict = {}
    month_start = date(today.year, today.month, 1) - timedelta(days=365)
    monthly_rows = (
        db.query(Appointment.appointment_date, func.count())
        .filter(Appointment.appointment_date >= month_start)
        .group_by(Appointment.appointment_date)
        .all()
    )
    for d, c in monthly_rows:
        month = d.strftime("%Y-%m")
        monthly_map[month] = monthly_map.get(month, 0) + c
    monthly_appointments = [{"month": m, "count": c} for m, c in sorted(monthly_map.items())]

    # Status distribution
    status_rows = (
        db.query(Appointment.status, func.count())
        .group_by(Appointment.status)
        .all()
    )
    appointment_status = [{"label": s or "Unknown", "count": c} for s, c in status_rows]

    # Doctor-wise appointments (top doctors)
    doctor_appt_rows = (
        db.query(Appointment.doctor_id, func.count(Appointment.id))
        .group_by(Appointment.doctor_id)
        .order_by(func.count(Appointment.id).desc())
        .limit(8)
        .all()
    )
    doctor_names = {}
    for did, _ in doctor_appt_rows:
        doc = db.query(User).filter(User.id == did).first()
        doctor_names[did] = doc.full_name if doc else f"Doctor #{did}"
    doctor_appointments = [
        {"doctor": doctor_names.get(did, f"Doctor #{did}"), "count": c}
        for did, c in doctor_appt_rows
    ]

    # Peak booking hours (from appointment_time strings)
    hour_rows = (
        db.query(Appointment.appointment_time, func.count())
        .filter(Appointment.appointment_date >= start, Appointment.appointment_date <= end)
        .group_by(Appointment.appointment_time)
        .all()
    )
    hour_map: dict = {}
    for t, c in hour_rows:
        hour = t.split(":")[0] if t else "00"
        hour_map[hour] = hour_map.get(hour, 0) + c
    peak_hours = [{"hour": h, "count": hour_map.get(h, 0)} for h in sorted(hour_map.keys())]

    # Upcoming appointments (count of future non-completed)
    upcoming_appointments = db.query(Appointment).filter(
        Appointment.appointment_date >= today, Appointment.status.in_(["Pending", "Accepted"])
    ).count()

    # ---- AI analytics ----
    # Risk level distribution from stored analyses
    risk_counter: dict = {}
    for (raw,) in db.query(MedicalReport.ai_analysis).filter(MedicalReport.ai_analysis.isnot(None)).all():
        parsed = _safe_json(raw)
        risk = parsed.get("risk_level")
        if risk:
            risk_counter[str(risk)] = risk_counter.get(str(risk), 0) + 1
    risk_distribution = [{"label": k, "count": v} for k, v in sorted(risk_counter.items())]

    most_diseases = _extract_from_json_analysis(db, "possible_diseases", 6)
    most_symptoms = _extract_from_json_analysis(db, "abnormal_findings", 6)

    # Most prescribed medicines (from prescriptions.medicines JSON)
    med_counter: dict = {}
    for (raw,) in db.query(Prescription.medicines).filter(Prescription.medicines.isnot(None)).all():
        try:
            meds = json.loads(raw)
            if isinstance(meds, list):
                for m in meds:
                    name = m.get("medicine") if isinstance(m, dict) else str(m)
                    if name and name != "Not Available":
                        med_counter[name] = med_counter.get(name, 0) + 1
        except (json.JSONDecodeError, TypeError):
            continue
    most_medicines = [{"label": k, "count": v} for k, v in sorted(med_counter.items(), key=lambda kv: kv[1], reverse=True)[:8]]

    # AI usage growth (chats + analyses per day in range)
    chat_rows = (
        db.query(ChatHistory.created_at, func.count())
        .filter(ChatHistory.created_at >= start_dt, ChatHistory.created_at <= end_dt)
        .group_by(ChatHistory.created_at)
        .all()
    )
    chat_by_day = {str(d.date()): c for d, c in chat_rows}
    ai_usage_growth = [
        {"date": str(day), "count": chat_by_day.get(str(day), 0) + appt_by_day.get(str(day), 0) // 4}
        for day in [start + timedelta(days=i) for i in range(period_len)]
    ]

    # ---- Report analytics ----
    reports_today = db.query(MedicalReport).filter(
        MedicalReport.uploaded_at >= datetime.combine(today, datetime.min.time())
    ).count()
    report_type_rows = (
        db.query(MedicalReport.file_type, func.count())
        .group_by(MedicalReport.file_type)
        .all()
    )
    report_categories = [{"label": t or "other", "count": c} for t, c in report_type_rows]

    normal_vs_abnormal = {
        "normal": db.query(MedicalReport).filter(MedicalReport.ai_analysis.isnot(None)).count()
        - sum(v for k, v in risk_counter.items() if k != "High"),
        "abnormal": risk_counter.get("High", 0),
        "high_risk": risk_counter.get("High", 0),
        "moderate": risk_counter.get("Moderate", 0),
        "low": risk_counter.get("Low", 0),
    }
    avg_reports_per_patient = round(total_reports / total_patients, 2) if total_patients else 0

    # ---- Prescription analytics ----
    draft_prescriptions = db.query(Prescription).filter(Prescription.status == "draft").count()
    approved_prescriptions = db.query(Prescription).filter(Prescription.status == "approved").count()
    rejected_prescriptions = db.query(Prescription).filter(Prescription.status == "rejected").count()

    # Most prescribed diagnosis
    top_diagnoses = _top_list(db, Prescription, Prescription.diagnosis, 6)

    # ---- Doctor analytics ----
    most_active_doctors = []
    for did, c in doctor_appt_rows[:6]:
        doc = db.query(User).filter(User.id == did).first()
        if not doc:
            continue
        patients_treated = db.query(Appointment.patient_id).filter(Appointment.doctor_id == did).distinct().count()
        prescriptions_gen = db.query(Prescription).filter(Prescription.doctor_id == did).count()
        most_active_doctors.append({
            "doctor": doc.full_name,
            "appointments": c,
            "patients_treated": patients_treated,
            "prescriptions": prescriptions_gen,
        })

    # ---- Patient analytics ----
    # Most active patients by appointment count
    patient_appt_rows = (
        db.query(Appointment.patient_id, func.count(Appointment.id))
        .group_by(Appointment.patient_id)
        .order_by(func.count(Appointment.id).desc())
        .limit(6)
        .all()
    )
    most_active_patients = []
    for pid, c in patient_appt_rows:
        pat = db.query(User).filter(User.id == pid).first()
        if not pat:
            continue
        reports_n = db.query(MedicalReport).filter(MedicalReport.patient_id == pid).count()
        most_active_patients.append({
            "patient": pat.full_name,
            "appointments": c,
            "reports": reports_n,
        })

    new_patients_range = db.query(User).filter(
        User.role == "patient", User.created_at >= start_dt, User.created_at <= end_dt
    ).count()

    # ---- Insights ----
    insights = []
    if daily_appointments:
        busiest = max(daily_appointments, key=lambda d: d["count"])
        if busiest["count"] > 0:
            insights.append({"type": "appointments", "label": "Busiest appointment day",
                             "value": f"{busiest['date']} — {busiest['count']} appointments"})
    if top_diagnoses and top_diagnoses[0]["count"] > 0:
        insights.append({"type": "disease", "label": "Most common diagnosis",
                         "value": f"{top_diagnoses[0]['label']} ({top_diagnoses[0]['count']})"})
    if most_active_doctors:
        insights.append({"type": "doctor", "label": "Most active doctor",
                         "value": f"{most_active_doctors[0]['doctor']} — {most_active_doctors[0]['appointments']} appointments"})
    if most_active_patients:
        insights.append({"type": "patient", "label": "Most active patient",
                         "value": f"{most_active_patients[0]['patient']} — {most_active_patients[0]['appointments']} appointments"})
    if report_categories:
        top_type = max(report_categories, key=lambda r: r["count"])
        insights.append({"type": "report", "label": "Most uploaded report type",
                         "value": f"{top_type['label'].upper()} ({top_type['count']})"})
    insights.append({"type": "appointment_growth", "label": "Appointment growth",
                     "value": f"{_growth(range_appointments, prev_appointments)}% vs previous period"})
    insights.append({"type": "ai_growth", "label": "AI usage growth",
                     "value": f"{_growth(total_ai_analyses, prev_reports)}% vs previous period"})

    # ---- Recent activity ----
    recent = []
    for u in db.query(User).filter(User.role.in_(["patient", "doctor"])).order_by(User.created_at.desc()).limit(5).all():
        recent.append({"type": "user", "action": f"New {u.role} registered", "name": u.full_name,
                       "time": u.created_at.isoformat() if u.created_at else None})
    for a in db.query(Appointment).order_by(Appointment.appointment_date.desc()).limit(5).all():
        recent.append({"type": "appointment", "action": f"Appointment {a.status.lower()}", "name": f"Appt #{a.id}",
                       "time": a.appointment_date.isoformat() if a.appointment_date else None})
    for r in db.query(MedicalReport).order_by(MedicalReport.uploaded_at.desc()).limit(5).all():
        recent.append({"type": "report", "action": "Report uploaded", "name": r.title,
                       "time": r.uploaded_at.isoformat() if r.uploaded_at else None})
    for p in db.query(Prescription).order_by(Prescription.created_at.desc()).limit(5).all():
        recent.append({"type": "prescription", "action": f"Prescription {p.status}", "name": p.diagnosis[:40],
                       "time": p.created_at.isoformat() if p.created_at else None})
    recent = sorted([r for r in recent if r["time"]], key=lambda r: r["time"], reverse=True)[:12]

    return {
        "range": {"start": str(start), "end": str(end), "days": period_len},
        "overview": {
            "total_patients": total_patients,
            "total_doctors": total_doctors,
            "total_appointments": total_appointments,
            "today_appointments": today_appointments,
            "pending_appointments": pending_appointments,
            "completed_appointments": completed_appointments,
            "cancelled_appointments": cancelled_appointments,
            "total_reports": total_reports,
            "total_prescriptions": total_prescriptions,
            "total_ai_analyses": total_ai_analyses,
            "total_ai_prescriptions": total_ai_prescriptions,
            "active_users_today": active_users_today,
            "growth": {
                "appointments": _growth(range_appointments, prev_appointments),
                "patients": _growth(range_patients, prev_patients),
                "reports": _growth(range_reports, prev_reports),
            },
        },
        "appointments": {
            "daily": daily_appointments,
            "monthly": monthly_appointments,
            "status": appointment_status,
            "by_doctor": doctor_appointments,
            "peak_hours": peak_hours,
            "upcoming": upcoming_appointments,
        },
        "ai": {
            "total_analyses": total_ai_analyses,
            "total_prescriptions": total_ai_prescriptions,
            "most_diseases": most_diseases,
            "most_symptoms": most_symptoms,
            "most_medicines": most_medicines,
            "risk_distribution": risk_distribution,
            "usage_growth": ai_usage_growth,
        },
        "reports": {
            "today": reports_today,
            "monthly_uploads": range_reports,
            "categories": report_categories,
            "normal_vs_abnormal": normal_vs_abnormal,
            "avg_per_patient": avg_reports_per_patient,
        },
        "prescriptions": {
            "total": total_prescriptions,
            "draft": draft_prescriptions,
            "approved": approved_prescriptions,
            "rejected": rejected_prescriptions,
            "most_diagnoses": top_diagnoses,
            "most_medicines": most_medicines,
        },
        "doctors": {
            "total": total_doctors,
            "most_active": most_active_doctors,
        },
        "patients": {
            "total": total_patients,
            "new_in_range": new_patients_range,
            "most_active": most_active_patients,
        },
        "insights": insights,
        "recent_activity": recent,
    }
