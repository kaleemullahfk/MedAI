import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

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


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    clean_email = user_in.email.strip().lower()

    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    role = user_in.role.lower().strip()
    if role not in ["patient", "doctor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'patient', 'doctor', or 'admin'."
        )

    new_user = User(
        full_name=user_in.full_name.strip(),
        email=clean_email,
        password=hash_password(user_in.password),
        role=role,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize default profile shell for patients and doctors
    if role == "patient":
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

    elif role == "doctor":
        doctor_shell = DoctorProfile(
            user_id=new_user.id,
            specialization="General Physician",
            qualification="MBBS",
            experience=5,
            hospital="City Hospital",
            consultation_fee=50,
            available_days="Monday - Friday",
            available_time="09:00 AM - 05:00 PM",
            is_verified=True
        )
        db.add(doctor_shell)
        db.commit()

    return new_user


@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    clean_email = user_credentials.email.strip().lower()

    db_user = db.query(User).filter(User.email == clean_email).first()

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
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user:
        # Avoid user enumeration - return success message regardless
        return {"message": "If that email is registered, a password reset link has been generated."}

    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)

    db.commit()

    return {
        "message": "Password reset token generated successfully.",
        "reset_token": reset_token  # Returned for easy testing / dev flow
    }


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == req.token).first()

    if not user or not user.reset_token_expires or user.reset_token_expires.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
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