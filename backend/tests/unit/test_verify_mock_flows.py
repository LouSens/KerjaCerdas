"""Verification feature tests — NIK e-KYC, OTP, education and NPWP mocks.

These endpoints are explicitly mock implementations. The point of these tests
is to pin down what the mock actually guarantees today, so the contract does
not drift when a real provider is wired in.
"""

from __future__ import annotations

import hashlib
import re

import pytest
from fastapi.testclient import TestClient

from backend.app.api.services.identity_verifier import MockIdentityVerificationService

VALID_NIK = "3171010101900001"
FAILING_NIK = "9971010101900001"  # demo rule: prefix "99" always fails


# ── Mock service unit level ──────────────────────────────────────────────────


class TestMockIdentityService:
    def test_valid_nik_passes(self) -> None:
        r = MockIdentityVerificationService.verify_identity(VALID_NIK, "Budi Santoso")
        assert r["is_valid"] is True
        assert r["match_score"] == pytest.approx(98.5)

    def test_nik_prefixed_99_fails(self) -> None:
        r = MockIdentityVerificationService.verify_identity(FAILING_NIK, "Budi Santoso")
        assert r["is_valid"] is False

    @pytest.mark.parametrize("nik", ["", "123", "3171010101900001234"])
    def test_wrong_length_nik_fails(self, nik: str) -> None:
        assert MockIdentityVerificationService.verify_identity(nik, "Budi")["is_valid"] is False

    def test_hash_is_deterministic_and_not_reversible(self) -> None:
        a = MockIdentityVerificationService.generate_verification_hash(VALID_NIK, "Budi")
        b = MockIdentityVerificationService.generate_verification_hash(VALID_NIK, "Budi")
        assert a == b
        assert len(a) == 64
        assert VALID_NIK not in a

    def test_hash_binds_name_to_nik(self) -> None:
        """Same NIK with a different name must not produce the same hash."""
        a = MockIdentityVerificationService.generate_verification_hash(VALID_NIK, "Budi")
        b = MockIdentityVerificationService.generate_verification_hash(VALID_NIK, "Siti")
        assert a != b

    def test_non_digit_nik_of_correct_length_is_accepted(self) -> None:
        """Documents a known gap: the mock only length-checks, never digit-checks."""
        r = MockIdentityVerificationService.verify_identity("ABCDEFGHIJKLMNOP", "Budi")
        assert r["is_valid"] is True, "mock accepts non-numeric NIK — tighten before going live"


# ── /verify/identity endpoint ────────────────────────────────────────────────


class TestIdentityEndpoint:
    def test_requires_authentication(self, client: TestClient) -> None:
        resp = client.post("/api/v1/verify/identity", json={"nik": VALID_NIK, "full_name": "Budi"})
        assert resp.status_code == 401

    def test_valid_nik_returns_pending_not_verified(
        self, client: TestClient, seeker_account: dict
    ) -> None:
        """A format-valid NIK is PENDING, never VERIFIED — the mock check
        never confirms the NIK belongs to the submitting seeker, so it has
        no authority to claim a real identity is confirmed."""
        resp = client.post(
            "/api/v1/verify/identity",
            json={"nik": VALID_NIK, "full_name": "Budi Santoso"},
            headers=seeker_account["headers"],
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["status"] == "PENDING"
        assert body["pii_redacted"] is True

    def test_response_never_echoes_the_raw_nik(
        self, client: TestClient, seeker_account: dict
    ) -> None:
        resp = client.post(
            "/api/v1/verify/identity",
            json={"nik": VALID_NIK, "full_name": "Budi Santoso"},
            headers=seeker_account["headers"],
        )
        assert VALID_NIK not in resp.text

    def test_failing_nik_returns_failed(self, client: TestClient, seeker_account: dict) -> None:
        resp = client.post(
            "/api/v1/verify/identity",
            json={"nik": FAILING_NIK, "full_name": "Budi Santoso"},
            headers=seeker_account["headers"],
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "FAILED"

    @pytest.mark.parametrize("nik", ["123", "31710101019000012345"])
    def test_length_is_enforced_by_schema(
        self, client: TestClient, seeker_account: dict, nik: str
    ) -> None:
        resp = client.post(
            "/api/v1/verify/identity",
            json={"nik": nik, "full_name": "Budi"},
            headers=seeker_account["headers"],
        )
        assert resp.status_code == 422

    def test_raw_nik_never_reaches_storage(
        self, client: TestClient, seeker_account: dict
    ) -> None:
        """UU-PDP-2022: the raw NIK must never reach storage.

        /verify/identity persists the PENDING/FAILED *outcome* to the
        seeker's profile (nik_verified — see the persistence tests above),
        but the raw NIK itself must never be part of that write. Pinned
        explicitly so a future change can't silently start storing the
        plaintext NIK alongside the status.
        """
        client.post(
            "/api/v1/seeker/profile",
            json={"full_name": "Budi Santoso", "region_code": "3171", "skills": []},
            headers=seeker_account["headers"],
        )
        client.post(
            "/api/v1/verify/identity",
            json={"nik": VALID_NIK, "full_name": "Budi Santoso"},
            headers=seeker_account["headers"],
        )
        profile = client.get("/api/v1/seeker/profile", headers=seeker_account["headers"]).json()
        stored_nik = (profile or {}).get("nik") or ""
        assert stored_nik != VALID_NIK
        if stored_nik:
            assert stored_nik == hashlib.sha256(VALID_NIK.encode()).hexdigest()

    def test_pending_status_is_persisted_to_the_seeker_profile(
        self, client: TestClient, seeker_account: dict
    ) -> None:
        """/verify/identity is a demo-mode interface mock — the check itself
        is not a real Dukcapil call and never confirms the NIK belongs to
        the submitting seeker — so a pass is persisted as PENDING, never
        VERIFIED, to the seeker's own profile (nik_verified). PENDING still
        survives a reload or a login from another browser instead of living
        only in the frontend's local store — durability and authority are
        separate properties, and this mock only earns the former."""
        client.post(
            "/api/v1/seeker/profile",
            json={"full_name": "Budi Santoso", "region_code": "3171", "skills": []},
            headers=seeker_account["headers"],
        )
        verify_resp = client.post(
            "/api/v1/verify/identity",
            json={"nik": VALID_NIK, "full_name": "Budi Santoso"},
            headers=seeker_account["headers"],
        )
        assert verify_resp.json()["status"] == "PENDING"
        profile = client.get("/api/v1/seeker/profile", headers=seeker_account["headers"]).json()
        assert profile["nik_verified"] == "pending"

    def test_mock_check_never_produces_verified(
        self, client: TestClient, seeker_account: dict
    ) -> None:
        """No input to this mock endpoint can ever result in a durable
        'verified' status — that value must be reserved for a real Dukcapil
        integration this build doesn't have. Regression test for the exact
        finding this fixes: a format-only check granting an authoritative
        identity claim."""
        client.post(
            "/api/v1/seeker/profile",
            json={"full_name": "Budi Santoso", "region_code": "3171", "skills": []},
            headers=seeker_account["headers"],
        )
        client.post(
            "/api/v1/verify/identity",
            json={"nik": VALID_NIK, "full_name": "Budi Santoso"},
            headers=seeker_account["headers"],
        )
        profile = client.get("/api/v1/seeker/profile", headers=seeker_account["headers"]).json()
        assert profile["nik_verified"] != "verified"

    def test_failed_status_is_also_persisted(
        self, client: TestClient, seeker_account: dict
    ) -> None:
        """A failed check must durably record FAILED, not silently leave the
        profile at unverified — otherwise the UI can't distinguish "never
        tried" from "tried and failed"."""
        client.post(
            "/api/v1/seeker/profile",
            json={"full_name": "Budi Santoso", "region_code": "3171", "skills": []},
            headers=seeker_account["headers"],
        )
        verify_resp = client.post(
            "/api/v1/verify/identity",
            json={"nik": FAILING_NIK, "full_name": "Budi Santoso"},
            headers=seeker_account["headers"],
        )
        assert verify_resp.json()["status"] == "FAILED"
        profile = client.get("/api/v1/seeker/profile", headers=seeker_account["headers"]).json()
        assert profile["nik_verified"] == "failed"

    def test_persists_even_without_a_profile_yet(
        self, client: TestClient, seeker_account: dict
    ) -> None:
        """Calling /verify/identity before a profile exists must not 500 —
        there's simply nothing to persist the outcome onto yet."""
        resp = client.post(
            "/api/v1/verify/identity",
            json={"nik": VALID_NIK, "full_name": "Budi Santoso"},
            headers=seeker_account["headers"],
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "PENDING"


# ── /verify/otp/* endpoints ──────────────────────────────────────────────────


class TestOtpFlow:
    def test_send_requires_authentication(self, client: TestClient) -> None:
        assert client.post("/api/v1/verify/otp/send", json={"phone": "+628111"}).status_code == 401

    def test_send_rejects_non_e164(self, client: TestClient, seeker_account: dict) -> None:
        resp = client.post(
            "/api/v1/verify/otp/send",
            json={"phone": "08123456789"},
            headers=seeker_account["headers"],
        )
        assert resp.status_code == 400

    def test_happy_path_send_then_verify(self, client: TestClient, seeker_account: dict) -> None:
        h = seeker_account["headers"]
        sent = client.post("/api/v1/verify/otp/send", json={"phone": "+6281234567890"}, headers=h)
        assert sent.status_code == 200, sent.text
        code = sent.json()["demo_code"]
        assert len(code) == 6 and code.isdigit()

        verified = client.post(
            "/api/v1/verify/otp/verify",
            json={"phone": "+6281234567890", "code": code},
            headers=h,
        )
        assert verified.status_code == 200, verified.text
        assert verified.json()["status"] == "VERIFIED"

    def test_wrong_code_is_rejected_and_counts_down(
        self, client: TestClient, seeker_account: dict
    ) -> None:
        h = seeker_account["headers"]
        client.post("/api/v1/verify/otp/send", json={"phone": "+6281200000001"}, headers=h)
        resp = client.post(
            "/api/v1/verify/otp/verify",
            json={"phone": "+6281200000001", "code": "000000"},
            headers=h,
        )
        assert resp.status_code == 400
        assert "tersisa" in resp.json()["detail"]

    def test_attempts_are_capped(self, client: TestClient, seeker_account: dict) -> None:
        h = seeker_account["headers"]
        phone = "+6281200000002"
        client.post("/api/v1/verify/otp/send", json={"phone": phone}, headers=h)
        codes = ["000000", "000001", "000002", "000003", "000004", "000005", "000006"]
        statuses = [
            client.post(
                "/api/v1/verify/otp/verify", json={"phone": phone, "code": c}, headers=h
            ).status_code
            for c in codes
        ]
        assert 429 in statuses, f"brute force was never throttled: {statuses}"

    def test_verify_without_send_is_404(self, client: TestClient, seeker_account: dict) -> None:
        resp = client.post(
            "/api/v1/verify/otp/verify",
            json={"phone": "+6289999999999", "code": "123456"},
            headers=seeker_account["headers"],
        )
        assert resp.status_code == 404

    def test_otp_is_scoped_to_the_requesting_user(
        self, client: TestClient, seeker_account: dict, other_seeker_account: dict
    ) -> None:
        """User B must not be able to burn or consume User A's OTP."""
        phone = "+6281200000003"
        sent = client.post(
            "/api/v1/verify/otp/send",
            json={"phone": phone},
            headers=seeker_account["headers"],
        )
        code = sent.json()["demo_code"]
        stolen = client.post(
            "/api/v1/verify/otp/verify",
            json={"phone": phone, "code": code},
            headers=other_seeker_account["headers"],
        )
        assert stolen.status_code == 404, "OTP leaked across users"

    def test_resend_invalidates_the_previous_code(
        self, client: TestClient, seeker_account: dict
    ) -> None:
        h = seeker_account["headers"]
        phone = "+6281200000004"
        first = client.post("/api/v1/verify/otp/send", json={"phone": phone}, headers=h).json()
        client.post("/api/v1/verify/otp/send", json={"phone": phone}, headers=h)
        replay = client.post(
            "/api/v1/verify/otp/verify",
            json={"phone": phone, "code": first["demo_code"]},
            headers=h,
        )
        assert replay.status_code == 400, "superseded OTP still accepted"

    def test_code_is_not_stored_or_returned_in_plaintext_on_verify(
        self, client: TestClient, seeker_account: dict
    ) -> None:
        h = seeker_account["headers"]
        phone = "+6281200000005"
        code = client.post("/api/v1/verify/otp/send", json={"phone": phone}, headers=h).json()[
            "demo_code"
        ]
        resp = client.post(
            "/api/v1/verify/otp/verify", json={"phone": phone, "code": code}, headers=h
        )
        assert code not in resp.text


class TestOtpDemoCodeExposure:
    """`demo_code` is only ever returned in an explicitly enabled demo mode."""

    def test_demo_mode_is_on_outside_production(self, client: TestClient) -> None:
        from backend.app.config.settings import settings

        assert settings.otp_demo_enabled is True

    def test_production_refuses_to_send_and_leaks_nothing(
        self, client: TestClient, seeker_account: dict, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from backend.app.config.settings import settings

        monkeypatch.setattr(settings, "app_env", "production")
        monkeypatch.setattr(settings, "otp_demo_mode", None)
        resp = client.post(
            "/api/v1/verify/otp/send",
            json={"phone": "+6281299999999"},
            headers=seeker_account["headers"],
        )
        assert resp.status_code == 503, resp.text
        assert "demo_code" not in resp.text
        assert not re.search(r"\b\d{6}\b", resp.text), "a 6-digit code leaked into the 503 body"

    def test_production_can_opt_back_in_explicitly(
        self, client: TestClient, seeker_account: dict, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """OTP_DEMO_MODE=1 is an override someone has to set on purpose."""
        from backend.app.config.settings import settings

        monkeypatch.setattr(settings, "app_env", "production")
        monkeypatch.setattr(settings, "otp_demo_mode", True)
        resp = client.post(
            "/api/v1/verify/otp/send",
            json={"phone": "+6281299999999"},
            headers=seeker_account["headers"],
        )
        assert resp.status_code == 200
        assert resp.json()["mode"] == "demo"

    def test_demo_mode_off_outside_production_also_refuses(
        self, client: TestClient, seeker_account: dict, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from backend.app.config.settings import settings

        monkeypatch.setattr(settings, "otp_demo_mode", False)
        resp = client.post(
            "/api/v1/verify/otp/send",
            json={"phone": "+6281299999999"},
            headers=seeker_account["headers"],
        )
        assert resp.status_code == 503


# ── Education / NPWP mocks ───────────────────────────────────────────────────


class TestEducationAndNpwpMocks:
    def test_education_pending_not_verified(self, client: TestClient, seeker_account: dict) -> None:
        """A format-valid diploma number is PENDING, never VERIFIED — the
        mock check never confirms the diploma against a real SIVIL record."""
        resp = client.post(
            "/api/v1/verify/education",
            json={"ijazah_number": "IJZ-123", "university_name": "UI", "major": "TI"},
            headers=seeker_account["headers"],
        )
        assert resp.json()["status"] == "PENDING"

    def test_education_sentinel_rejected(self, client: TestClient, seeker_account: dict) -> None:
        resp = client.post(
            "/api/v1/verify/education",
            json={"ijazah_number": "000000", "university_name": "UI", "major": "TI"},
            headers=seeker_account["headers"],
        )
        assert resp.json()["status"] == "NOT_FOUND"

    def test_education_too_short_is_rejected(
        self, client: TestClient, seeker_account: dict
    ) -> None:
        # Below the minimum plausible length for a real diploma number.
        resp = client.post(
            "/api/v1/verify/education",
            json={"ijazah_number": "12345", "university_name": "UI", "major": "TI"},
            headers=seeker_account["headers"],
        )
        assert resp.status_code == 422

    def test_education_pending_is_persisted_to_the_seeker_profile(
        self, client: TestClient, seeker_account: dict
    ) -> None:
        """/verify/education is a demo-mode interface mock — no real SIVIL
        integration, and it never confirms the diploma against a real
        record — so a pass persists as PENDING, never VERIFIED, to the
        seeker's own profile (ijazah_verified), for the same reason as
        /verify/identity above. PENDING is still durable — it survives a
        reload or a login from another browser."""
        client.post(
            "/api/v1/seeker/profile",
            json={"full_name": "Budi Santoso", "region_code": "3171", "skills": []},
            headers=seeker_account["headers"],
        )
        verify_resp = client.post(
            "/api/v1/verify/education",
            json={"ijazah_number": "IJZ-123", "university_name": "UI", "major": "TI"},
            headers=seeker_account["headers"],
        )
        assert verify_resp.json()["status"] == "PENDING"
        profile = client.get("/api/v1/seeker/profile", headers=seeker_account["headers"]).json()
        assert profile["ijazah_verified"] == "pending"

    def test_education_mock_check_never_produces_verified(
        self, client: TestClient, seeker_account: dict
    ) -> None:
        """Regression test for the fixed finding: no input to this mock
        endpoint can ever result in a durable 'verified' status."""
        client.post(
            "/api/v1/seeker/profile",
            json={"full_name": "Budi Santoso", "region_code": "3171", "skills": []},
            headers=seeker_account["headers"],
        )
        client.post(
            "/api/v1/verify/education",
            json={"ijazah_number": "IJZ-123", "university_name": "UI", "major": "TI"},
            headers=seeker_account["headers"],
        )
        profile = client.get("/api/v1/seeker/profile", headers=seeker_account["headers"]).json()
        assert profile["ijazah_verified"] != "verified"

    def test_education_not_found_persists_as_failed(
        self, client: TestClient, seeker_account: dict
    ) -> None:
        client.post(
            "/api/v1/seeker/profile",
            json={"full_name": "Budi Santoso", "region_code": "3171", "skills": []},
            headers=seeker_account["headers"],
        )
        verify_resp = client.post(
            "/api/v1/verify/education",
            json={"ijazah_number": "000000", "university_name": "UI", "major": "TI"},
            headers=seeker_account["headers"],
        )
        assert verify_resp.json()["status"] == "NOT_FOUND"
        profile = client.get("/api/v1/seeker/profile", headers=seeker_account["headers"]).json()
        assert profile["ijazah_verified"] == "failed"

    @pytest.mark.parametrize(
        ("npwp", "expected"),
        [
            ("12.345.678.9-012.000", "VERIFIED"),
            ("123456789012345", "VERIFIED"),
            ("000000000000000", "NOT_FOUND"),
            ("12345", "NOT_FOUND"),
            ("abcdefghijklmno", "NOT_FOUND"),
        ],
    )
    def test_npwp_rules(
        self, client: TestClient, employer_account: dict, npwp: str, expected: str
    ) -> None:
        resp = client.post(
            "/api/v1/verify/npwp",
            json={"npwp": npwp, "company_name": "PT Demo"},
            headers=employer_account["headers"],
        )
        assert resp.json()["status"] == expected

    def test_documents_endpoint_requires_auth(self, client: TestClient) -> None:
        assert client.get("/api/v1/verify/documents").status_code == 401
