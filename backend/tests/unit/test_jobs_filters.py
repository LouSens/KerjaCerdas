"""GET /jobs/regions, /jobs/industries, and the industry filter on GET /jobs.

Covers the fix for the location filter being hardcoded to 3 cities and the
category/division filter not existing at all: both now derive from the
employer/job data actually present, so UMKM/non-tech postings surface as
real filterable dimensions instead of being invisible or lumped together.
"""

from __future__ import annotations

from fastapi.testclient import TestClient


def _post_job(client: TestClient, headers: dict, **overrides) -> dict:
    payload = {
        "title": "Kasir Toko",
        "description": "Transaksi kasir harian.",
        "region_code": "3573",
        **overrides,
    }
    resp = client.post("/api/v1/employer/jobs", json=payload, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


def _set_industry(client: TestClient, headers: dict, industry: str) -> None:
    resp = client.post(
        "/api/v1/employer/profile", json={"industry": industry}, headers=headers
    )
    assert resp.status_code == 200, resp.text


class TestRegionsEndpoint:
    def test_regions_reflects_active_job_region_with_display_name(
        self, client: TestClient, employer_account: dict, stub_embedder
    ) -> None:
        _post_job(client, employer_account["headers"], region_code="3271")

        resp = client.get("/api/v1/jobs/regions")
        assert resp.status_code == 200
        items = resp.json()["items"]
        bogor = next((r for r in items if r["code"] == "3271"), None)
        assert bogor is not None, items
        assert bogor["name"] == "Bogor"
        assert bogor["job_count"] >= 1


class TestIndustriesEndpoint:
    def test_industries_reflects_employer_industry_with_count(
        self, client: TestClient, employer_account: dict, stub_embedder
    ) -> None:
        _set_industry(client, employer_account["headers"], "Kuliner / UMKM F&B")
        _post_job(client, employer_account["headers"])

        resp = client.get("/api/v1/jobs/industries")
        assert resp.status_code == 200
        items = resp.json()["items"]
        culinary = next((i for i in items if i["name"] == "Kuliner / UMKM F&B"), None)
        assert culinary is not None, items
        assert culinary["job_count"] >= 1

    def test_job_without_industry_set_falls_back_to_lainnya(
        self, client: TestClient, employer_account: dict, stub_embedder
    ) -> None:
        _post_job(client, employer_account["headers"])

        resp = client.get("/api/v1/jobs/industries")
        names = [i["name"] for i in resp.json()["items"]]
        assert "" not in names, "an empty industry must not be exposed as a filter option"


class TestIndustryFilter:
    def test_filtering_by_industry_excludes_other_industries(
        self,
        client: TestClient,
        employer_account: dict,
        register,
        stub_embedder,
    ) -> None:
        _set_industry(client, employer_account["headers"], "Kuliner / UMKM F&B")
        culinary_job = _post_job(
            client, employer_account["headers"], title="Kasir Warung Makan"
        )

        tech_employer = register(client, "employer")
        _set_industry(client, tech_employer["headers"], "Tech / Marketplace")
        _post_job(
            client,
            tech_employer["headers"],
            title="Backend Engineer",
            region_code="3174",
        )

        resp = client.get("/api/v1/jobs", params={"industry": "Kuliner / UMKM F&B"})
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert len(items) == 1
        assert items[0]["id"] == culinary_job["job_id"]
        assert items[0]["industry"] == "Kuliner / UMKM F&B"

    def test_filtering_by_the_displayed_lainnya_category_actually_returns_jobs(
        self, client: TestClient, employer_account: dict, stub_embedder
    ) -> None:
        """/jobs/industries shows "Lainnya" (with a real count) for jobs whose
        employer never set an industry. Selecting that exact category in the
        UI has to return those jobs, not silently zero results just because
        the underlying `employer.industry` is "" rather than "Lainnya"."""
        job = _post_job(client, employer_account["headers"])

        listing = client.get("/api/v1/jobs/industries").json()["items"]
        lainnya = next((i for i in listing if i["name"] == "Lainnya"), None)
        assert lainnya is not None, listing
        assert lainnya["job_count"] >= 1

        resp = client.get("/api/v1/jobs", params={"industry": "Lainnya"})
        items = resp.json()["items"]
        assert any(i["id"] == job["job_id"] for i in items), items
