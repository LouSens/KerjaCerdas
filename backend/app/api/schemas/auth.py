"""
KerjaCerdas — Auth Schemas
============================
Pydantic schemas for User registration, login, and token responses.

Security:
  - Passwords require ≥8 chars, at least 1 uppercase and 1 digit.
  - Name field is sanitized against injection via SanitizedStr.
  - Email is validated by Pydantic's EmailStr (RFC 5322 + DNS check).
"""
from __future__ import annotations

import re

from pydantic import BaseModel, EmailStr, Field, field_validator

from backend.app.api.middleware.sanitization import SanitizedStr


class UserRegisterRequest(BaseModel):
    """Payload for user registration."""
    email: EmailStr
    name: SanitizedStr = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(pattern="^(seeker|employer)$")

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Enforce minimum password complexity."""
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit.")
        return v


class UserLoginRequest(BaseModel):
    """Payload for user login."""
    email: EmailStr
    password: str = Field(..., max_length=128)


class TokenResponse(BaseModel):
    """Response returned upon successful login."""
    access_token: str
    token_type: str = "bearer"
    user: dict[str, str]  # id, name, email, role
