import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.connection import get_db
from app.models.user import User
from app.models.patient_profile import PatientProfile
from app.models.doctor_profile import DoctorProfile
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserLogin,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.services.auth import hash_password, verify_password, create_access_token
from app.services.current_user import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


def _as_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Return *dt* as a timezone-aware UTC datetime.

    The ``reset_token_expires`` column is a naive ``DateTime``: aware values
    written to SQLite/Postgres have their tzinfo stripped. Normalize on read
    before comparing against ``datetime.now(timezone.utc)``.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Schema already restricts role to patient|doctor (Literal). Defensive check
    # keeps the guarantee even if the schema is loosened later.
    if user_in.role not in ("patient", "doctor"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public registration only supports 'patient' or 'doctor' roles."
        )

    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    new_user = User(
        full_name=user_in.full_name,
        email=user_in.email,
        password=hash_password(user_in.password),
        role=user_in.role,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize default profile shell for patients and doctors
    if user_in.role == "patient":
        patient_shell = PatientProfile(
            user_id=new_user.id,
            age=30,
            gender="Not Specified",
            phone="",
            address="",
            blood_group="Unknown"
        )
        db.add(patient_shell)
        db.commit()

    elif user_in.role == "doctor":
        doctor_shell = DoctorProfile(
            user_id=new_user.id,
            specialization="General Physician",
            qualification="MBBS",
            experience=5,
            hospital="City Hospital",
            consultation_fee=50,
            available_days="Monday - Friday",
            available_time="09:00 AM - 05:00 PM",
            is_verified=False
        )
        db.add(doctor_shell)
        db.commit()

    return new_user


@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_credentials.email).first()

    if not db_user or not verify_password(user_credentials.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact admin."
        )

    token = create_access_token(
        data={
            "sub": db_user.email,
            "role": db_user.role,
            "user_id": db_user.id
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": db_user
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()

    # Avoid user enumeration: respond identically whether or not the account
    # exists. The reset token is never returned in this response body.
    if not user:
        return {"message": "If that email is registered, a password reset link has been generated."}

    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)

    db.commit()

    return {"message": "If that email is registered, a password reset link has been generated."}


@router.get("/dev/reset-link/{email}")
def dev_reset_link(email: str, db: Session = Depends(get_db)):
    """Development-only helper: reveals the reset token so the flow can be
    tested without an email server. Returns 404 outside development."""
    if settings.ENVIRONMENT != "development":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found."
        )

    user = db.query(User).filter(User.email == email.strip().lower()).first()
    if not user or not user.reset_token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active reset token for this email."
        )

    return {
        "email": user.email,
        "reset_token": user.reset_token,
        "expires_at": _as_utc(user.reset_token_expires).isoformat()
    }


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == req.token).first()

    expires = _as_utc(user.reset_token_expires) if user else None
    if not user or expires is None or expires < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )

    user.password = hash_password(req.new_password)
    user.reset_token = None
    user.reset_token_expires = None

    db.commit()

    return {"message": "Password reset successful. You can now log in with your new password."}


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out."}
