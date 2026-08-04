from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    # Public registration is limited to patients and doctors. Admins are only
    # created through the admin-only route or the seed script.
    role: Literal["patient", "doctor"] = "patient"

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Full name cannot be blank.")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str, info) -> str:
        if value != value.strip():
            raise ValueError("Password cannot start or end with whitespace.")
        if any(ch.isspace() for ch in value):
            raise ValueError("Password cannot contain whitespace.")
        # Reject trivial passwords that mirror the account email prefix.
        email = (info.data.get("email") or "").split("@")[0].lower()
        if email and email in value.lower():
            raise ValueError("Password cannot contain the email prefix.")
        return value


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserResponse] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
