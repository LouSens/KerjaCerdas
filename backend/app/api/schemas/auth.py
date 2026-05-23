"""
KerjaCerdas — Auth Schemas
============================
Pydantic schemas for User registration, login, and token responses.
"""
from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    """Payload for user registration."""
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8)
    role: str = Field(pattern="^(seeker|employer)$")


class UserLoginRequest(BaseModel):
    """Payload for user login."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Response returned upon successful login."""
    access_token: str
    token_type: str = "bearer"
    user: dict[str, str]  # id, name, email, role
