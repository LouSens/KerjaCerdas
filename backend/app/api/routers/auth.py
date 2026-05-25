"""
KerjaCerdas — Auth Router
=========================
FastAPI router for user authentication (Login/Register).

ANTIGRAVITY PROTOCOL: Password must be hashed before DB insert.
On employer registration, an Employer profile is auto-created in the JSON
store so the user can post jobs immediately without a separate onboarding step.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.api.database import get_session
from backend.app.api.models import User
from backend.app.api.schemas.auth import TokenResponse, UserLoginRequest, UserRegisterRequest
from backend.app.api.services.auth_service import create_access_token, hash_password, verify_password
from backend.app.db.json_store import get_repositories
from backend.app.db.schemas import Employer, User as JsonUser, UserRole

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

    # Auto-create domain profile in JSON store ---------------------------------
    repos = get_repositories()
    # Mirror user into JSON store so agents/matchers can resolve user lookups.
    # Note: db/schemas.py User does NOT have a `name` field (name lives in the
    # ORM User for auth; the JSON store only needs id/email/role for lookups).
    json_user = JsonUser(
        id=new_user.id,
        email=new_user.email,
        password_hash=new_user.password_hash,
        role=UserRole(new_user.role),
    )
    await repos.users.upsert(json_user)

    if new_user.role == "employer":
        # Auto-create employer profile so the user can post jobs immediately
        employer = Employer(
            user_id=new_user.id,
            company_name=new_user.name,   # editable later via /employer/profile
            region_code="3171",           # default Jakarta — editable
            industry="",
        )
        existing_emp = await repos.employers.find(lambda e: e.user_id == new_user.id)
        if not existing_emp:
            await repos.employers.upsert(employer)
            logger.info("Auto-created employer profile for %s", new_user.email)

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
