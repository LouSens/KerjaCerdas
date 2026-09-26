"""
KerjaCerdas — Auth Router
=========================
FastAPI router for user authentication (Login/Register).

Passwords are always hashed (bcrypt) before the ORM insert. On employer
registration, an Employer profile is auto-created via the postgres_store
repositories so the user can post jobs immediately without a separate
onboarding step.
"""

import logging

from backend.app.api.database import get_session
from backend.app.api.dependencies import is_admin_user
from backend.app.api.schemas.auth import TokenResponse, UserLoginRequest, UserRegisterRequest
from backend.app.api.services.auth_service import (
    create_access_token,
    hash_password,
    verify_password,
)
from backend.app.db.models import User
from backend.app.db.postgres_store import find_employer_by_user_id, get_repositories
from backend.app.db.schemas import Employer
from backend.app.services.demo_accounts import DEMO_ACCOUNTS, DEMO_EMAILS
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

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
            status_code=status.HTTP_400_BAD_REQUEST, detail="User with this email already exists"
        )

    logger.info("New user registered: user_id=%s role=%s", new_user.id, new_user.role)

    # `new_user` is already committed to the `users` table above via the ORM
    # session — there is exactly one `users` table, so no second write through
    # the repository layer is needed (it previously wrote a second, divergent
    # copy of the same row through db.schemas.User's field set).
    repos = get_repositories()

    if new_user.role == "employer":
        # Auto-create employer profile so the user can post jobs immediately
        employer = Employer(
            user_id=new_user.id,
            company_name=new_user.name,  # editable later via /employer/profile
            region_code="3171",  # default Jakarta — editable
            industry="",
        )
        existing_emp = await find_employer_by_user_id(new_user.id)
        if not existing_emp:
            await repos.employers.upsert(employer)
            logger.info("Auto-created employer profile for user_id=%s", new_user.id)

    # Generate token immediately after registration
    token = create_access_token(
        user_id=new_user.id,
        role=new_user.role,
        name=new_user.name,
    )

    return TokenResponse(
        access_token=token,
        user={
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "has_prism": False,
            "is_admin": is_admin_user(new_user),
        },
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
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    password_ok = verify_password(request.password, user.password_hash)

    if not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User account is inactive"
        )

    logger.info("User logged in: user_id=%s", user.id)

    token = create_access_token(
        user_id=user.id,
        role=user.role,
        name=user.name,
    )

    return TokenResponse(
        access_token=token,
        user={"id": user.id, "name": user.name, "email": user.email, "role": user.role,
              "is_admin": is_admin_user(user)},
    )


# ── Demo login (DEMO_MODE only) ──────────────────────────────────────────────
# One-click login into the seeded demo accounts, so a booth visitor can try
# every role without a password. Only the fixed list in services/demo_accounts
# is allowed (never an admin), and both endpoints 404 when demo mode is off —
# which is the default in production (settings.demo_unlimited follows APP_ENV).


class DemoLoginRequest(BaseModel):
    email: str = Field(max_length=254)


def _require_demo_mode() -> None:
    from backend.app.config.settings import settings

    if not settings.demo_unlimited:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not Found")


@router.get("/demo-accounts")
async def demo_accounts(db: AsyncSession = Depends(get_session)):
    """The demo accounts that actually exist in this database (run the seed first)."""
    _require_demo_mode()
    emails = [email for email, *_ in DEMO_ACCOUNTS]
    existing = set((await db.execute(select(User.email).where(User.email.in_(emails)))).scalars())
    return {"accounts": [
        {"email": email, "role": role, "name": name, "story": story}
        for email, role, name, story in DEMO_ACCOUNTS if email in existing
    ]}


@router.post("/demo-login", response_model=TokenResponse)
async def demo_login(request: DemoLoginRequest, db: AsyncSession = Depends(get_session)):
    _require_demo_mode()
    email = request.email.strip().lower()
    if email not in DEMO_EMAILS:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bukan akun demo")
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if not user or not user.is_active or is_admin_user(user):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Akun demo belum ada — jalankan seed")
    logger.info("Demo login: user_id=%s", user.id)
    token = create_access_token(user_id=user.id, role=user.role, name=user.name)
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "name": user.name, "email": user.email, "role": user.role, "is_admin": False},
    )
