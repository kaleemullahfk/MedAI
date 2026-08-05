from typing import List, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.models.patient_profile import PatientProfile
from app.models.doctor_profile import DoctorProfile
from app.schemas.user import UserResponse
from app.services.auth import hash_password
from app.services.role_checker import require_role

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


class AdminCreateUser(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["patient", "doctor", "admin"] = "patient"
    # Optional profile fields for patients/doctors
    specialization: str = "General Physician"
    qualification: str = "MBBS"
    hospital: str = "City Hospital"


class AdminResetPassword(BaseModel):
    new_password: str = Field(min_length=8, max_length=128)


def _create_profile_shell(db: Session, user: User) -> None:
    """Create the default profile shell for a newly created user, matching
    what public registration does."""
    if user.role == "patient":
        db.add(
            PatientProfile(
                user_id=user.id,
                age=30,
                gender="Not Specified",
                phone="",
                address="",
                blood_group="Unknown",
            )
        )
    elif user.role == "doctor":
        db.add(
            DoctorProfile(
                user_id=user.id,
                specialization="General Physician",
                qualification="MBBS",
                experience=1,
                hospital="City Hospital",
                consultation_fee=50,
                available_days="Monday - Friday",
                available_time="09:00 AM - 05:00 PM",
                is_verified=False,
            )
        )


@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    return db.query(User).order_by(User.id.asc()).all()


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: AdminCreateUser,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    existing = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.strip().lower(),
        password=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create the profile shell so the new user has a complete record.
    try:
        _create_profile_shell(db, user)
        db.commit()
    except Exception:
        db.rollback()

    return user


@router.patch("/users/{user_id}/toggle-active", response_model=UserResponse)
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account.",
        )

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account.",
        )

    # Delete dependent records first to avoid orphans.
    db.query(PatientProfile).filter(PatientProfile.user_id == user.id).delete()
    db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).delete()
    db.delete(user)
    db.commit()


@router.post("/users/{user_id}/reset-password", response_model=UserResponse)
def reset_user_password(
    user_id: int,
    payload: AdminResetPassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.password = hash_password(payload.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    db.refresh(user)
    return user
