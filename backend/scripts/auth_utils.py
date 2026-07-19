import os
import uuid

import bcrypt

from backend.app.db.models import User as SqlUser
from backend.app.db.session import async_session as async_session_factory
from sqlalchemy.future import select

# ---------------------------------------------------------------------------
# Seed password – never hardcoded.
# The caller MUST export SEED_DEFAULT_PASSWORD before running any seed script.
# There is intentionally no fallback: a missing variable is a loud failure
# rather than a silent backdoor.
# ---------------------------------------------------------------------------

def _get_seed_password_hash() -> str:
    """Hash the seed password from the environment variable at call time."""
    raw = os.environ.get("SEED_DEFAULT_PASSWORD", "").strip()
    if not raw:
        raise RuntimeError(
            "SEED_DEFAULT_PASSWORD environment variable is not set. "
            "Export it before running seed scripts, e.g.:\n"
            "  export SEED_DEFAULT_PASSWORD='<choose-a-strong-password>'"
        )
    return bcrypt.hashpw(raw.encode(), bcrypt.gensalt(rounds=12)).decode()


async def seed_auth_user(email: str, name: str, role: str) -> SqlUser:
    async with async_session_factory() as session:
        stmt = select(SqlUser).where(SqlUser.email == email)
        result = await session.execute(stmt)
        u = result.scalar_one_or_none()
        if not u:
            u = SqlUser(
                id=str(uuid.uuid4()),
                email=email,
                password_hash=_get_seed_password_hash(),
                role=role,
            )
            session.add(u)
        else:
            # Update role only – never overwrite a password that may have
            # been legitimately changed after the initial seed.
            u.role = role
        await session.commit()
        await session.refresh(u)
        return u
