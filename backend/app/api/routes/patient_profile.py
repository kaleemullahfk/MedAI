from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.patient_profile import PatientProfile
from app.models.user import User
from app.schemas.patient_profile import (
    PatientProfileCreate,
    PatientProfileUpdate,
    PatientProfileResponse,
)
from app.services.current_user import get_current_user
from app.services.role_checker import require_role

router = APIRouter(
    prefix="/patient-profile",
    tags=["Patient Profile"]
)


@router.post("/", response_model=PatientProfileResponse, status_code=status.HTTP_201_CREATED)
def create_patient_profile(
    profile: PatientProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["patient"]))
):
    existing_profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()

    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient profile already exists. Use PUT /patient-profile/me to update."
        )

    new_profile = PatientProfile(
        user_id=current_user.id,
        age=profile.age,
        gender=profile.gender,
        phone=profile.phone,
        address=profile.address,
        blood_group=profile.blood_group,
        height=profile.height,
        weight=profile.weight,
        emergency_contact=profile.emergency_contact,
        medical_history=profile.medical_history,
        allergies=profile.allergies,
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile


@router.get("/me", response_model=PatientProfileResponse)
def get_my_patient_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Read-only: never fabricate a profile as a GET side effect.
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found. Create one with POST /patient-profile/.",
        )

    return profile


@router.put("/me", response_model=PatientProfileResponse)
def update_patient_profile(
    profile_update: PatientProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["patient"]))
):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()

    if not profile:
        profile = PatientProfile(user_id=current_user.id)
        db.add(profile)

    update_data = profile_update.model_dump(exclude_unset=True)
    if update_data:
        for field, val in update_data.items():
            setattr(profile, field, val)

    db.commit()
    db.refresh(profile)

    return profile