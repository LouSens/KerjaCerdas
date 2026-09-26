"""services/storage — S3-compatible (Cloudflare R2) object storage.

No test reaches the network: the boto3 client is replaced by an in-memory fake.
"""

from __future__ import annotations

import hashlib
import io
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.app.config.settings import settings
from backend.app.services import storage


class FakeS3:
    def __init__(self) -> None:
        self.objects: dict[str, tuple[bytes, str]] = {}
        self.fail = False

    def _check(self, bucket: str) -> None:
        if self.fail:
            raise ConnectionError("r2 unreachable")
        assert bucket == settings.s3_bucket

    def put_object(self, Bucket: str, Key: str, Body: bytes, ContentType: str) -> dict:
        self._check(Bucket)
        self.objects[Key] = (Body, ContentType)
        return {}

    def get_object(self, Bucket: str, Key: str) -> dict:
        self._check(Bucket)
        if Key not in self.objects:
            raise KeyError(Key)
        return {"Body": io.BytesIO(self.objects[Key][0])}

    def delete_object(self, Bucket: str, Key: str) -> dict:
        self._check(Bucket)
        self.objects.pop(Key, None)
        return {}

    def head_bucket(self, Bucket: str) -> dict:
        self._check(Bucket)
        return {}

    def generate_presigned_url(self, op: str, Params: dict, ExpiresIn: int) -> str:
        self._check(Params["Bucket"])
        return f"https://r2.example/{Params['Key']}?op={op}&exp={ExpiresIn}"


@pytest.fixture
def fake_s3(monkeypatch: pytest.MonkeyPatch) -> FakeS3:
    monkeypatch.setattr(settings, "s3_endpoint_url", "https://acct.r2.cloudflarestorage.com")
    monkeypatch.setattr(settings, "s3_bucket", "kerjacerdas-test")
    monkeypatch.setattr(settings, "s3_access_key_id", "test-key")
    monkeypatch.setattr(settings, "s3_secret_access_key", "test-secret")
    monkeypatch.setattr(settings, "s3_key_prefix", "")
    fake = FakeS3()
    monkeypatch.setattr(storage, "_client", lambda: fake)
    return fake


class TestUnconfigured:
    @pytest.fixture(autouse=True)
    def _blank(self, monkeypatch: pytest.MonkeyPatch) -> None:
        for name in ("s3_endpoint_url", "s3_bucket", "s3_access_key_id", "s3_secret_access_key"):
            monkeypatch.setattr(settings, name, "")

    async def test_every_call_degrades_quietly(self) -> None:
        assert storage.storage_configured() is False
        assert await storage.put_object("a.txt", b"x") is False
        assert await storage.get_object("a.txt") is None
        assert await storage.delete_object("a.txt") is False
        assert await storage.presigned_url("a.txt") is None
        assert (await storage.storage_health())["configured"] is False

    def test_one_missing_value_is_unconfigured(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(settings, "s3_endpoint_url", "https://x")
        monkeypatch.setattr(settings, "s3_bucket", "b")
        monkeypatch.setattr(settings, "s3_access_key_id", "k")
        assert storage.storage_configured() is False


class TestConfigured:
    async def test_round_trip(self, fake_s3: FakeS3) -> None:
        assert await storage.put_object("docs/a.pdf", b"%PDF-", "application/pdf") is True
        assert fake_s3.objects["docs/a.pdf"] == (b"%PDF-", "application/pdf")
        assert await storage.get_object("docs/a.pdf") == b"%PDF-"
        assert await storage.delete_object("docs/a.pdf") is True
        assert await storage.get_object("docs/a.pdf") is None

    async def test_prefix_is_applied(self, fake_s3: FakeS3, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(settings, "s3_key_prefix", "staging/")
        await storage.put_object("/a.txt", b"x")
        assert list(fake_s3.objects) == ["staging/a.txt"]

    async def test_path_traversal_keys_are_rejected(self, fake_s3: FakeS3) -> None:
        assert await storage.put_object("a/../../b.txt", b"x") is False
        assert await storage.put_object("", b"x") is False
        assert fake_s3.objects == {}

    async def test_outage_never_raises(self, fake_s3: FakeS3) -> None:
        fake_s3.fail = True
        assert await storage.put_object("a.txt", b"x") is False
        assert await storage.get_object("a.txt") is None
        health = await storage.storage_health()
        assert health == {"configured": True, "reachable": False, "bucket": "kerjacerdas-test"}

    async def test_presigned_url_uses_default_expiry(self, fake_s3: FakeS3) -> None:
        url = await storage.presigned_url("a.pdf")
        assert url and url.endswith(f"exp={settings.s3_presign_expire_seconds}")

    async def test_health_reports_no_secrets(self, fake_s3: FakeS3) -> None:
        health = await storage.storage_health()
        assert health == {"configured": True, "reachable": True, "bucket": "kerjacerdas-test"}
        assert "test-secret" not in repr(health)


_FAKE_PDF = b"%PDF-1.4\n%storage archive test\n"
_PARSED = {"postings": [{"title": "Kasir", "required_skills": ["Excel"], "region_code": "3171"}]}


class TestJobPackArchive:
    def _upload(self, client: TestClient, headers: dict):
        with patch(
            "backend.app.api.routers.uploads.parse_job_pack",
            new=AsyncMock(return_value=_PARSED),
        ):
            return client.post(
                "/api/v1/uploads/job-pack",
                files={"file": ("pack.pdf", _FAKE_PDF, "application/pdf")},
                headers=headers,
            )

    def test_source_pdf_is_archived(
        self, client: TestClient, employer_account: dict, fake_s3: FakeS3
    ) -> None:
        resp = self._upload(client, employer_account["headers"])
        assert resp.status_code == 200, resp.text
        employer_id = resp.json()["employer_id"]
        key = f"job-packs/{employer_id}/{hashlib.sha256(_FAKE_PDF).hexdigest()}.pdf"
        assert fake_s3.objects[key] == (_FAKE_PDF, "application/pdf")

    def test_storage_outage_does_not_fail_the_upload(
        self, client: TestClient, employer_account: dict, fake_s3: FakeS3
    ) -> None:
        fake_s3.fail = True
        resp = self._upload(client, employer_account["headers"])
        assert resp.status_code == 200, resp.text
        assert resp.json()["jobs"][0]["title"] == "Kasir"

    def test_cv_is_never_archived(
        self, client: TestClient, seeker_account: dict, fake_s3: FakeS3
    ) -> None:
        with patch(
            "backend.app.api.routers.uploads.parse_cv",
            new=AsyncMock(return_value={"full_name": "Budi", "skills": [], "resume_text": ""}),
        ):
            resp = client.post(
                "/api/v1/uploads/cv",
                files={"file": ("cv.pdf", _FAKE_PDF, "application/pdf")},
                headers=seeker_account["headers"],
            )
        assert resp.status_code == 200, resp.text
        assert fake_s3.objects == {}
