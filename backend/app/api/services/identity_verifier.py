import hashlib
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class MockIdentityVerificationService:
    """
    Simulates identity verification for demo use.

    This service applies deterministic local rules and returns a stable
    verification hash so the mock API can behave consistently.
    """

    @staticmethod
    def generate_verification_hash(nik: str, name: str) -> str:
        """
        Generate a deterministic verification hash from the submitted identity.
        """
        payload = f"{nik}:{name}".encode("utf-8")
        return hashlib.sha256(payload).hexdigest()

    @staticmethod
    def verify_identity(nik: str, full_name: str) -> Dict[str, Any]:
        """
        Apply demo verification rules and return a neutral mock result.
        """
        logger.info("[IDENTITY_VERIFIER] Starting mock identity verification")

        # Demo rule: NIKs that start with 99 simulate a failed verification.
        is_valid = not nik.startswith("99") and len(nik) == 16
        match_score = 98.5 if is_valid else 45.2

        verification_hash = MockIdentityVerificationService.generate_verification_hash(
            nik,
            full_name,
        )

        return {
            "is_valid": is_valid,
            "match_score": match_score,
            "verification_hash": verification_hash,
            "pii_redacted": True
        }
