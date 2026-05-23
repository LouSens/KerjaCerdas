"""
KerjaCerdas — Auth Service
============================
JWT token management and password hashing via bcrypt.

ANTIGRAVITY PROTOCOL: RULE-01 — No hardcoded secrets.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt  # PyJWT

logger = logging.getLogger(__name__)

# Defaults – overridden by settings at runtime
_SECRET_KEY: str | None = None
_ALGORITHM = "HS256"
_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


def _get_secret_key() -> str:
    """Return the configured signing secret or fail closed."""
    if not _SECRET_KEY:
        raise RuntimeError("Auth service has not been configured with a JWT secret key")
    return _SECRET_KEY


def configure(secret_key: str, expire_minutes: int = 60 * 24) -> None:
    """
    Configure auth service at app startup.

    Args:
        secret_key: JWT signing secret (from .env).
        expire_minutes: Token lifetime in minutes.
    """
    global _SECRET_KEY, _ACCESS_TOKEN_EXPIRE_MINUTES
    if not secret_key:
        raise ValueError("secret_key must be provided")
    _SECRET_KEY = secret_key
    _ACCESS_TOKEN_EXPIRE_MINUTES = expire_minutes
    logger.info("AuthService configured")


# ──────────────────────────────────────────────────────────────────────────────
#  Password Hashing
# ──────────────────────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    """
    Hash a plaintext password with bcrypt.

    Args:
        plain: Raw password string.

    Returns:
        Bcrypt hash string.
    """
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """
    Verify a plaintext password against a bcrypt hash.

    Args:
        plain: Raw password string.
        hashed: Stored bcrypt hash.

    Returns:
        True if password matches.
    """
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ──────────────────────────────────────────────────────────────────────────────
#  JWT Tokens
# ──────────────────────────────────────────────────────────────────────────────

def create_access_token(user_id: str, role: str, name: str, email: str) -> str:
    """
    Create a signed JWT access token.

    Args:
        user_id: User UUID.
        role: User role ('seeker' or 'employer').
        name: User display name.
        email: User email.

    Returns:
        Encoded JWT string.
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=_ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "role": role,
        "name": name,
        "email": email,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, _get_secret_key(), algorithm=_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """
    Decode and validate a JWT access token.

    Args:
        token: Encoded JWT string.

    Returns:
        Token payload dict, or None if expired/invalid.
    """
    try:
        payload = jwt.decode(token, _get_secret_key(), algorithms=[_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        return None
