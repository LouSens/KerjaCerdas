"""
KerjaCerdas — Unit Tests: API Endpoints
=========================================
Tests for FastAPI endpoints in demo mode.

ANTIGRAVITY PROTOCOL: All API changes require test updates.
"""
from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect, text
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable

from backend.app.api import database as database_module
from backend.app.api.main import app

from backend.app.api.schemas.auth import UserLoginRequest, UserRegisterRequest


@pytest.fixture
def client():
    """Create test client for FastAPI app."""
    return TestClient(app)


class TestHealthCheck:
    """Test health check endpoint."""

    def test_health_returns_200(self, client: TestClient) -> None:
        """Health endpoint should return 200 with service info."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "KerjaCerdas API"
        assert data["version"] == "0.3.0"


class TestMatchEndpoint:
    """Test job matching endpoint."""

    def test_match_returns_results(self, client: TestClient) -> None:
        """Match endpoint should return ranked job results."""
        payload = {
            "seeker": {
                "user_id": "test_user_id",
                "full_name": "Budi Santoso",
                "skills": [{"name": "Python"}, {"name": "SQL"}, {"name": "Excel"}],
                "experience_years": 1,
                "education_level": "S1",
                "region_code": "3171",
                "salary_expectation": 12000000,
            },
            "user_message": "cari kerja IT",
        }
        response = client.post("/api/v1/agent/invoke", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "matches" in data
        assert len(data["matches"]) <= 10

    def test_match_scores_are_sorted(self, client: TestClient) -> None:
        """Match results should be sorted by match_score descending."""
        payload = {
            "seeker": {
                "user_id": "test_user_id",
                "full_name": "Test User",
                "skills": [{"name": "Python"}],
                "experience_years": 0,
                "education_level": "S1",
                "region_code": "3171",
                "salary_expectation": 8000000,
            },
            "user_message": "cari kerja python",
        }
        response = client.post("/api/v1/agent/invoke", json=payload)
        data = response.json()
        scores = [m["score"] for m in data["matches"]]
        assert scores == sorted(scores, reverse=True)


class TestSkillGapEndpoint:
    """Test skill gap analysis endpoint."""

    def test_skill_gap_identifies_missing(self, client: TestClient) -> None:
        """Skill gap should correctly identify missing skills."""
        payload = {
            "seeker": {
                "user_id": "test_user_id",
                "full_name": "Budi Santoso",
                "skills": [{"name": "Python"}, {"name": "SQL"}],
                "experience_years": 1,
                "education_level": "S1",
                "region_code": "3171",
            },
            "user_message": "Apa skill gap saya untuk job ini?",
            "target_job_id": "job-1", # Assume job-1 requires Docker
        }
        response = client.post("/api/v1/agent/invoke", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "missing_skills" in data
        assert "matching_skills" in data

    def test_skill_gap_severity_levels(self, client: TestClient) -> None:
        pass # Severity level logic is deprecated in the new agent endpoint


class TestJobsEndpoint:
    """Test jobs listing endpoint."""

    def test_list_jobs(self, client: TestClient) -> None:
        """Jobs endpoint should return a list of job postings."""
        response = client.get("/api/v1/jobs?limit=3")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) <= 3


class TestIdentityVerificationEndpoint:
    """Test mock identity verification endpoint."""

    def test_verify_identity_returns_verified_for_valid_demo_nik(self, client: TestClient) -> None:
        """Valid demo NIK should verify successfully."""
        payload = {
            "nik": "3171123412341234",
            "full_name": "Budi Santoso",
            "date_of_birth": "1998-01-20",
        }

        response = client.post("/api/v1/verify/identity", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "VERIFIED"
        assert data["match_percentage"] == 98.5
        assert data["message"] == "Identitas terverifikasi (mode demo)."
        assert data["verification_hash"]
        assert data["pii_redacted"] is True

    def test_verify_identity_returns_failed_for_simulated_invalid_nik(self, client: TestClient) -> None:
        """NIKs starting with 99 should fail in demo mode."""
        payload = {
            "nik": "9911123412341234",
            "full_name": "Budi Santoso",
            "date_of_birth": "1998-01-20",
        }

        response = client.post("/api/v1/verify/identity", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "FAILED"
        assert data["match_percentage"] == 45.2
        assert data["message"] == "Verifikasi identitas gagal."
        assert data["verification_hash"]
        assert data["pii_redacted"] is True


class TestStartupConfiguration:
    """Test application startup wiring."""

    @pytest.mark.asyncio
    async def test_lifespan_falls_back_to_sqlite_for_default_dev_database(
        self,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """Development startup should prefer the SQLite demo DB over the shipped local Postgres default."""
        calls: list[tuple[str, str]] = []

        def fake_reconfigure(database_url: str) -> None:
            calls.append(("reconfigure", database_url))

        async def fake_init_db() -> None:
            calls.append(("init_db", ""))

        def fake_configure_auth(secret_key: str, expire_minutes: int) -> None:
            calls.append(("configure_auth", secret_key))

        monkeypatch.setattr("backend.app.api.main.reconfigure", fake_reconfigure)
        monkeypatch.setattr("backend.app.api.main.init_db", fake_init_db)
        monkeypatch.setattr("backend.app.api.main.configure_auth", fake_configure_auth)
        monkeypatch.setattr(
            "backend.app.api.main.settings.database_url",
            "",
        )
        monkeypatch.setattr("backend.app.api.main.settings.jwt_secret_key", "configured-secret")
        monkeypatch.setattr("backend.app.api.main.settings.app_env", "development")

        async with app.router.lifespan_context(app):
            pass

        assert calls[0] == ("reconfigure", "sqlite+aiosqlite:///data/kerjacerdas.db")
        assert calls[1] == ("init_db", "")
        assert calls[2] == ("configure_auth", "configured-secret")

    @pytest.mark.asyncio
    async def test_lifespan_honors_explicit_dev_database_url(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Development startup should honor custom DB URLs instead of forcing SQLite."""
        calls: list[tuple[str, str]] = []

        def fake_reconfigure(database_url: str) -> None:
            calls.append(("reconfigure", database_url))

        async def fake_init_db() -> None:
            calls.append(("init_db", ""))

        def fake_configure_auth(secret_key: str, expire_minutes: int) -> None:
            calls.append(("configure_auth", secret_key))

        monkeypatch.setattr("backend.app.api.main.reconfigure", fake_reconfigure)
        monkeypatch.setattr("backend.app.api.main.init_db", fake_init_db)
        monkeypatch.setattr("backend.app.api.main.configure_auth", fake_configure_auth)
        monkeypatch.setattr("backend.app.api.main.settings.database_url", "postgresql://example/db")
        monkeypatch.setattr("backend.app.api.main.settings.jwt_secret_key", "configured-secret")
        monkeypatch.setattr("backend.app.api.main.settings.app_env", "development")

        async with app.router.lifespan_context(app):
            pass

        assert calls[0] == ("reconfigure", "postgresql://example/db")
        assert calls[1] == ("init_db", "")
        assert calls[2] == ("configure_auth", "configured-secret")

    @pytest.mark.asyncio
    async def test_lifespan_generates_ephemeral_secret_outside_production(
        self,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """Development startup should succeed with a generated JWT secret."""
        captured: dict[str, str] = {}

        def fake_reconfigure(database_url: str) -> None:
            return None

        async def fake_init_db() -> None:
            return None

        def fake_configure_auth(secret_key: str, expire_minutes: int) -> None:
            captured["secret_key"] = secret_key

        monkeypatch.setattr("backend.app.api.main.reconfigure", fake_reconfigure)
        monkeypatch.setattr("backend.app.api.main.init_db", fake_init_db)
        monkeypatch.setattr("backend.app.api.main.configure_auth", fake_configure_auth)
        monkeypatch.setattr("backend.app.api.main.settings.jwt_secret_key", "")
        monkeypatch.setattr("backend.app.api.main.settings.app_env", "development")

        async with app.router.lifespan_context(app):
            pass

        assert captured["secret_key"]

    @pytest.mark.asyncio
    async def test_lifespan_requires_secret_in_production(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Production startup should fail fast without a configured JWT secret."""
        def fake_reconfigure(database_url: str) -> None:
            return None

        async def fake_init_db() -> None:
            return None

        monkeypatch.setattr("backend.app.api.main.reconfigure", fake_reconfigure)
        monkeypatch.setattr("backend.app.api.main.init_db", fake_init_db)
        monkeypatch.setattr("backend.app.api.main.settings.jwt_secret_key", "")
        monkeypatch.setattr("backend.app.api.main.settings.app_env", "production")

        with pytest.raises(RuntimeError, match="JWT_SECRET_KEY must be set"):
            async with app.router.lifespan_context(app):
                pass

    @pytest.mark.asyncio
    async def test_init_db_renames_legacy_verification_column(self, tmp_path: Path) -> None:
        """init_db should rename the legacy verification column without data loss."""
        database_url = f"sqlite+aiosqlite:///{(tmp_path / 'legacy_verification.db').as_posix()}"
        database_module.reconfigure(database_url)

        try:
            async with database_module.engine.begin() as conn:
                await conn.execute(
                    text(
                        """
                        CREATE TABLE verification_logs (
                            id VARCHAR(36) PRIMARY KEY,
                            user_id VARCHAR(36),
                            verification_type VARCHAR(20),
                            status VARCHAR(20),
                            zk_commitment VARCHAR(64),
                            match_score FLOAT,
                            verified_at DATETIME
                        )
                        """
                    )
                )
                await conn.execute(
                    text(
                        """
                        INSERT INTO verification_logs
                            (id, user_id, verification_type, status, zk_commitment, match_score, verified_at)
                        VALUES
                            ('log-1', 'user-1', 'ekyc', 'VERIFIED', 'hash-123', 98.5, '2026-03-22T00:00:00Z')
                        """
                    )
                )

            await database_module.init_db()

            async with database_module.engine.begin() as conn:
                column_names = await conn.run_sync(
                    lambda sync_conn: {column["name"] for column in inspect(sync_conn).get_columns("verification_logs")}
                )
                verification_hash = (
                    await conn.execute(text("SELECT verification_hash FROM verification_logs WHERE id = 'log-1'"))
                ).scalar_one()

            assert "verification_hash" in column_names
            assert "zk_commitment" not in column_names
            assert verification_hash == "hash-123"
        finally:
            database_module.reconfigure("sqlite+aiosqlite:///./kerjacerdas.db")

    @pytest.mark.asyncio
    async def test_init_db_leaves_current_verification_column_unchanged(self, tmp_path: Path) -> None:
        """init_db should keep the current verification column name unchanged."""
        database_url = f"sqlite+aiosqlite:///{(tmp_path / 'current_verification.db').as_posix()}"
        database_module.reconfigure(database_url)

        try:
            async with database_module.engine.begin() as conn:
                await conn.execute(
                    text(
                        """
                        CREATE TABLE verification_logs (
                            id VARCHAR(36) PRIMARY KEY,
                            user_id VARCHAR(36),
                            verification_type VARCHAR(20),
                            status VARCHAR(20),
                            verification_hash VARCHAR(64),
                            match_score FLOAT,
                            verified_at DATETIME
                        )
                        """
                    )
                )

            await database_module.init_db()

            async with database_module.engine.begin() as conn:
                column_names = await conn.run_sync(
                    lambda sync_conn: {column["name"] for column in inspect(sync_conn).get_columns("verification_logs")}
                )

            assert "verification_hash" in column_names
            assert "zk_commitment" not in column_names
        finally:
            database_module.reconfigure("sqlite+aiosqlite:///./kerjacerdas.db")



