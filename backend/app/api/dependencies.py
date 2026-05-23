"""
KerjaCerdas — API Dependencies
================================
FastAPI dependencies for authentication, database sessions, and role checks.

ANTIGRAVITY PROTOCOL: Every secured endpoint MUST use get_current_user.
"""
from __future__ import annotations

import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.api.database import get_session
from src.api.models import User
from src.api.services.auth_service import decode_access_token

logger = logging.getLogger(__name__)

# Production frontend will pass the token in Authorization: Bearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_session),
) -> User:
    """
    Validate JWT token and return the current User object.
    
    Raises 401 Unauthorized if token is missing, invalid, or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Query the user from database
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        logger.warning(f"Valid token but user {user_id} not found in DB")
        raise credentials_exception
        
    if not user.is_active:
        logger.warning(f"Inactive user {user_id} attempted access")
        raise HTTPException(status_code=400, detail="Inactive user account")

    return user


async def require_employer(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that ensures the user is an employer."""
    if current_user.role != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Employer access required"
        )
    return current_user


async def require_seeker(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that ensures the user is a job seeker."""
    if current_user.role != "seeker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Seeker access required"
        )
    return current_user
