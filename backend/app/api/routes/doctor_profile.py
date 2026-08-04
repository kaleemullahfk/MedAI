from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.database.connection import get_db
from app.models.doctor_profile import DoctorProfile
from app.models.user import User
from app.schemas.doctor_profile import (
    DoctorProfileCreate,
    DoctorProfileUpdate,
    DoctorProfileResponse
)
from app.services.current_user import get_current_user
from app.services.role_checker import require_role

router = APIRouter(
    prefix="/doctor-profile",
    tags=["Doctor Profile"]
)


@router.get("/doctors", response_model=List[DoctorProfileResponse])
def list_doctors(
    search: Optional[str] = Query(None, description="Search by doctor name or specialization"),
    specialization: Optional[str] = Query(None, description="Filter by specialization"),
    hospital: Optional[str] = Query(None, description="Filter by hospital"),
    db: Session = Depends(get_db)
):
    query = (
        db.query(DoctorProfile)
        .join(User)
        .options(joinedload(DoctorProfile.user))
        .filter(User.is_active == True)  # noqa: E712
    )

    if specialization:
        query = query.filter(DoctorProfile.specialization.ilike(f"%{specialization}%"))

    if hospital:
        query = query.filter(DoctorProfile.hospital.ilike(f"%{hospital}%"))

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_pattern)) |
            (DoctorProfile.specialization.ilike(search_pattern)) |
            (DoctorProfile.hospital.ilike(search_pattern))
        )

    return query.all()


@router.post("/", response_model=DoctorProfileResponse, status_code=status.HTTP_201_CREATED)
def create_doctor_profile(
    profile: DoctorProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    existing = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor profile already exists. Use PUT /doctor-profile/me to update."
        )

    doctor = DoctorProfile(
        user_id=current_user.id,
        specialization=profile.specialization,
        qualification=profile.qualification,
        experience=profile.experience,
        hospital=profile.hospital,
        consultation_fee=profile.consultation_fee,
        available_days=profile.available_days,
        available_time=profile.available_time,
    )

    db.add(doctor)
    db.commit()
    db.refresh(doctor)

    return doctor


@router.get("/me", response_model=DoctorProfileResponse)
def get_my_doctor_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    # Read-only: never fabricate a profile as a GET side effect.
    profile = (
        db.query(DoctorProfile)
        .options(joinedload(DoctorProfile.user))
        .filter(DoctorProfile.user_id == current_user.id)
        .first()
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found. Create one with POST /doctor-profile/.",
        )

    return profile


@router.put("/me", response_model=DoctorProfileResponse)
def update_doctor_profile(
    profile_update: DoctorProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["doctor"]))
):
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()

    if not profile:
        profile = DoctorProfile(user_id=current_user.id)
        db.add(profile)

    update_data = profile_update.model_dump(exclude_unset=True)
    if update_data:
        for field, val in update_data.items():
            setattr(profile, field, val)

    db.commit()
    db.refresh(profile)

    return profile


@router.get("/{doctor_id}", response_model=DoctorProfileResponse)
def get_doctor_profile_by_id(
    doctor_id: int,
    db: Session = Depends(get_db)
):
    # Unambiguous: resolve by the profile's own primary key only. (Previously
    # matched id OR user_id, which could return the wrong doctor.)
    profile = (
        db.query(DoctorProfile)
        .options(joinedload(DoctorProfile.user))
        .filter(DoctorProfile.id == doctor_id)
        .first()
    )

    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found.")

    return profile
