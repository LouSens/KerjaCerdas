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

from src.api import database as database_module
from src.api.main import app
from src.api.models import JobPosting, SeekerProfile
from src.api.schemas.auth import UserLoginRequest, UserRegisterRequest


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
        assert data["version"] == "0.1.0"


class TestMatchEndpoint:
    """Test job matching endpoint."""

    def test_match_returns_results(self, client: TestClient) -> None:
        """Match endpoint should return ranked job results."""
        payload = {
            "seeker_profile": {
                "name": "Budi Santoso",
                "skills": ["Python", "SQL", "Excel"],
                "experience_years": 1,
                "education_level": "S1",
                "region_code": "3171",
                "salary_expectation": 12000000,
            },
            "top_k": 5,
        }
        response = client.post("/api/v1/match", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "matches" in data
        assert "request_id" in data
        assert len(data["matches"]) <= 5

    def test_match_scores_are_sorted(self, client: TestClient) -> None:
        """Match results should be sorted by match_score descending."""
        payload = {
            "seeker_profile": {
                "name": "Test User",
                "skills": ["Python"],
                "experience_years": 0,
                "education_level": "S1",
                "region_code": "3171",
                "salary_expectation": 8000000,
            },
            "top_k": 10,
        }
        response = client.post("/api/v1/match", json=payload)
        data = response.json()
        scores = [m["match_score"] for m in data["matches"]]
        assert scores == sorted(scores, reverse=True)


class TestSkillGapEndpoint:
    """Test skill gap analysis endpoint."""

    def test_skill_gap_identifies_missing(self, client: TestClient) -> None:
        """Skill gap should correctly identify missing skills."""
        payload = {
            "seeker_skills": ["Python", "SQL"],
            "required_skills": ["Python", "SQL", "Docker", "Kubernetes"],
        }
        response = client.post("/api/v1/skill-gap", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "docker" in data["missing_skills"]
        assert "python" in data["matching_skills"]

    def test_skill_gap_severity_levels(self, client: TestClient) -> None:
        """Severity should reflect gap ratio correctly."""
        # Low gap: 1 missing out of 4
        payload = {
            "seeker_skills": ["Python", "SQL", "Excel"],
            "required_skills": ["Python", "SQL", "Excel", "Tableau"],
        }
        response = client.post("/api/v1/skill-gap", json=payload)
        assert response.json()["gap_severity"] == "low"


class TestJobsEndpoint:
    """Test jobs listing endpoint."""

    def test_list_jobs(self, client: TestClient) -> None:
        """Jobs endpoint should return a list of job postings."""
        response = client.get("/api/v1/jobs?limit=3")
        assert response.status_code == 200
        data = response.json()
        assert "jobs" in data
        assert len(data["jobs"]) <= 3


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
        assert data["message"] == "Identitas berhasil diverifikasi pada mode demo."
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
        assert data["message"] == "Verifikasi identitas gagal pada mode demo."
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

        monkeypatch.setattr("src.api.main.reconfigure", fake_reconfigure)
        monkeypatch.setattr("src.api.main.init_db", fake_init_db)
        monkeypatch.setattr("src.api.main.configure_auth", fake_configure_auth)
        monkeypatch.setattr(
            "src.api.main.settings.database_url",
            "postgresql://kerja:password@localhost:5432/kerjacerdas",
        )
        monkeypatch.setattr("src.api.main.settings.jwt_secret_key", "configured-secret")
        monkeypatch.setattr("src.api.main.settings.app_env", "development")

        async with app.router.lifespan_context(app):
            pass

        assert calls[0] == ("reconfigure", "sqlite+aiosqlite:///./kerjacerdas.db")
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

        monkeypatch.setattr("src.api.main.reconfigure", fake_reconfigure)
        monkeypatch.setattr("src.api.main.init_db", fake_init_db)
        monkeypatch.setattr("src.api.main.configure_auth", fake_configure_auth)
        monkeypatch.setattr("src.api.main.settings.database_url", "postgresql://example/db")
        monkeypatch.setattr("src.api.main.settings.jwt_secret_key", "configured-secret")
        monkeypatch.setattr("src.api.main.settings.app_env", "development")

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

        monkeypatch.setattr("src.api.main.reconfigure", fake_reconfigure)
        monkeypatch.setattr("src.api.main.init_db", fake_init_db)
        monkeypatch.setattr("src.api.main.configure_auth", fake_configure_auth)
        monkeypatch.setattr("src.api.main.settings.jwt_secret_key", "")
        monkeypatch.setattr("src.api.main.settings.app_env", "development")

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

        monkeypatch.setattr("src.api.main.reconfigure", fake_reconfigure)
        monkeypatch.setattr("src.api.main.init_db", fake_init_db)
        monkeypatch.setattr("src.api.main.settings.jwt_secret_key", "")
        monkeypatch.setattr("src.api.main.settings.app_env", "production")

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


class TestBackendCompatibility:
    """Test backend model and schema compatibility."""

    def test_auth_schemas_validate_email_fields(self) -> None:
        """Auth request schemas should accept valid email payloads."""
        register = UserRegisterRequest(
            email="user@example.com",
            name="Test User",
            password="supersecret",
            role="seeker",
        )
        login = UserLoginRequest(email="user@example.com", password="supersecret")

        assert str(register.email) == "user@example.com"
        assert str(login.email) == "user@example.com"

    def test_json_columns_compile_for_postgresql(self) -> None:
        """Model tables with JSON columns should compile for PostgreSQL."""
        seeker_sql = str(CreateTable(SeekerProfile.__table__).compile(dialect=postgresql.dialect()))
        job_sql = str(CreateTable(JobPosting.__table__).compile(dialect=postgresql.dialect()))

        assert "skills JSON" in seeker_sql
        assert "required_skills JSON" in job_sql
