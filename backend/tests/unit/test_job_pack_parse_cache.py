"""POST /uploads/job-pack — server-side parse cache.

Retrying an upload of the identical PDF (a lost response, a reloaded tab, a
different browser or device) must return the exact same parsed postings as
the first attempt. Gemini extraction isn't perfectly deterministic even at
low temperature, so without this cache a second parse of the same bytes
could reword a title or reformat a salary just enough to change
JobPackUploader's client_ref — which the backend then treats as a brand-new
posting instead of a replay, producing a duplicate vacancy on confirm.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

_MOCK_PARSE_RESULT = {
    "postings": [
        {
            "title": "Backend Engineer",
            "description": "Build APIs",
            "required_skills": ["Python", "FastAPI"],
            "region_code": "3171",
            "salary_min": 8_000_000,
            "salary_max": 12_000_000,
        },
        {
            "title": "Frontend Engineer",
            "description": "Build UI",
            "required_skills": ["React"],
            "region_code": "3171",
            "salary_min": 7_000_000,
            "salary_max": 10_000_000,
        },
    ],
}

# Minimal valid PDF signature + padding so the %PDF- header check passes.
_FAKE_PDF_BYTES = b"%PDF-1.4\n%fake pdf content for tests\n"


def _upload(client: TestClient, headers: dict):
    return client.post(
        "/api/v1/uploads/job-pack",
        files={"file": ("pack.pdf", _FAKE_PDF_BYTES, "application/pdf")},
        headers=headers,
    )


class TestJobPackParseCache:
    def test_first_upload_calls_the_parser(self, client: TestClient, employer_account: dict) -> None:
        with patch(
            "backend.app.api.routers.uploads.parse_job_pack",
            new=AsyncMock(return_value=_MOCK_PARSE_RESULT),
        ) as mock_parse:
            resp = _upload(client, employer_account["headers"])
            assert resp.status_code == 200, resp.text
            body = resp.json()
            assert len(body["jobs"]) == 2
            assert body["jobs"][0]["title"] == "Backend Engineer"
            mock_parse.assert_called_once()

    def test_retry_of_identical_file_replays_cache_without_reparsing(
        self, client: TestClient, employer_account: dict
    ) -> None:
        """The whole point: a second upload of the SAME bytes must not call
        Gemini again, and must return byte-identical postings (including
        local_id) so a client-computed idempotency key stays stable."""
        with patch(
            "backend.app.api.routers.uploads.parse_job_pack",
            new=AsyncMock(return_value=_MOCK_PARSE_RESULT),
        ) as mock_parse:
            first = _upload(client, employer_account["headers"])
            second = _upload(client, employer_account["headers"])

        assert first.status_code == 200 and second.status_code == 200
        mock_parse.assert_called_once(), "the second upload must be served from cache, not re-parsed"
        assert first.json()["jobs"] == second.json()["jobs"]

    def test_retry_is_stable_even_if_a_real_reparse_would_drift(
        self, client: TestClient, employer_account: dict
    ) -> None:
        """Simulates the exact failure mode this fixes: if parse_job_pack
        WERE called again and returned slightly different text (as real
        Gemini extraction can), the cache must still win and the client
        never sees the drifted version."""
        drifted_result = {
            "postings": [
                {
                    "title": "Backend Engineer II",  # reworded on a hypothetical re-parse
                    "description": "Build APIs",
                    "required_skills": ["Python", "FastAPI"],
                    "region_code": "3171",
                    "salary_min": 8_500_000,  # reformatted on a hypothetical re-parse
                    "salary_max": 12_000_000,
                },
            ],
        }
        with patch(
            "backend.app.api.routers.uploads.parse_job_pack",
            new=AsyncMock(side_effect=[_MOCK_PARSE_RESULT, drifted_result]),
        ):
            first = _upload(client, employer_account["headers"])
            second = _upload(client, employer_account["headers"])

        assert first.json()["jobs"] == second.json()["jobs"], (
            "a cache hit must win over a would-be re-parse, even if the "
            "mocked parser is configured to return drifted content"
        )
        assert second.json()["jobs"][0]["title"] == "Backend Engineer"

    def test_different_files_are_not_conflated(
        self, client: TestClient, employer_account: dict
    ) -> None:
        """Different file bytes must produce different cache entries — a
        genuinely different upload is not a retry of the first one."""
        other_result = {
            "postings": [
                {
                    "title": "Data Analyst",
                    "description": "Analyze data",
                    "required_skills": ["SQL"],
                    "region_code": "3171",
                    "salary_min": 6_000_000,
                    "salary_max": 9_000_000,
                },
            ],
        }
        with patch(
            "backend.app.api.routers.uploads.parse_job_pack",
            new=AsyncMock(side_effect=[_MOCK_PARSE_RESULT, other_result]),
        ) as mock_parse:
            first = client.post(
                "/api/v1/uploads/job-pack",
                files={"file": ("pack-a.pdf", _FAKE_PDF_BYTES + b"A", "application/pdf")},
                headers=employer_account["headers"],
            )
            second = client.post(
                "/api/v1/uploads/job-pack",
                files={"file": ("pack-b.pdf", _FAKE_PDF_BYTES + b"B", "application/pdf")},
                headers=employer_account["headers"],
            )

        assert mock_parse.call_count == 2, "distinct files must each be parsed"
        assert first.json()["jobs"][0]["title"] == "Backend Engineer"
        assert second.json()["jobs"][0]["title"] == "Data Analyst"

    def test_local_id_is_stable_across_the_cached_retry(
        self, client: TestClient, employer_account: dict
    ) -> None:
        with patch(
            "backend.app.api.routers.uploads.parse_job_pack",
            new=AsyncMock(return_value=_MOCK_PARSE_RESULT),
        ):
            first = _upload(client, employer_account["headers"])
            second = _upload(client, employer_account["headers"])

        first_ids = [j["local_id"] for j in first.json()["jobs"]]
        second_ids = [j["local_id"] for j in second.json()["jobs"]]
        assert first_ids == second_ids
