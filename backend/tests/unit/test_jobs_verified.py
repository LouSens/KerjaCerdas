"""Unit 4 — verified-listing trust flag (pure helper, DB-free)."""
from __future__ import annotations

from backend.app.api.routers.jobs import _is_verified
from backend.app.db.schemas import Employer, VerificationStatus


def _employer(status: VerificationStatus) -> Employer:
    return Employer(
        user_id="u-1",
        company_name="PT Contoh",
        region_code="3171",
        verified=status,
    )


def test_verified_employer_is_trusted() -> None:
    assert _is_verified(_employer(VerificationStatus.VERIFIED)) is True


def test_unverified_employer_is_not_trusted() -> None:
    assert _is_verified(_employer(VerificationStatus.UNVERIFIED)) is False
    assert _is_verified(_employer(VerificationStatus.PENDING)) is False


def test_missing_employer_is_not_trusted() -> None:
    assert _is_verified(None) is False
