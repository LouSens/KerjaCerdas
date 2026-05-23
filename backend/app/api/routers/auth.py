"""
KerjaCerdas — Auth Router
=========================
FastAPI router for user authentication (Login/Register).

ANTIGRAVITY PROTOCOL: Password must be hashed before DB insert.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.api.database import get_session
from src.api.models import User
from src.api.schemas.auth import TokenResponse, UserLoginRequest, UserRegisterRequest
from src.api.services.auth_service import create_access_token, hash_password, verify_password

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(request: UserRegisterRequest, db: AsyncSession = Depends(get_session)):
    """
    Register a new user (Seeker or Employer).

    - Hashes password.
    - Saves user to DB.
    - Returns JWT token.
    """
    hashed_pwd = hash_password(request.password)

    new_user = User(
        email=request.email.lower(),
        name=request.name.strip(),
        password_hash=hashed_pwd,
        role=request.role,
    )

    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    logger.info(f"New user registered: {new_user.email} as {new_user.role}")

    # Generate token immediately after registration
    token = create_access_token(
        user_id=new_user.id,
        role=new_user.role,
        name=new_user.name,
        email=new_user.email
    )

    return TokenResponse(
        access_token=token,
        user={
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role
        }
    )


@router.post("/login", response_model=TokenResponse)
async def login_user(request: UserLoginRequest, db: AsyncSession = Depends(get_session)):
    """
    Authenticate a user.
    Uses JSON request for simplicity.
    """
    stmt = select(User).where(User.email == request.email.lower())
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive"
        )

    logger.info(f"User logged in: {user.email}")

    token = create_access_token(
        user_id=user.id,
        role=user.role,
        name=user.name,
        email=user.email
    )

    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    )
