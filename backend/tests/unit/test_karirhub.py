"""Unit 3 — MOCK Karirhub connector + router.

Imports only the lightweight karirhub router (not the full app) so the suite
runs without the heavy AI stack or a live database.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.app.api.routers.karirhub import router
from backend.app.services.integrations import karirhub


def _client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/api/v1")
    return TestClient(app)


def test_pull_verified_listings_are_flagged() -> None:
    items = karirhub.pull_verified_listings()
    assert items
    assert all(i["verified"] is True and i["source"] == "karirhub" for i in items)


def test_pull_verified_listings_region_filter() -> None:
    all_items = karirhub.pull_verified_listings()
    region = all_items[0]["region_code"]
    filtered = karirhub.pull_verified_listings(region=region)
    assert filtered
    assert all(i["region_code"] == region for i in filtered)


def test_push_vacancies_ack() -> None:
    ack = karirhub.push_vacancies([{"id": "a"}, {"id": "b"}])
    assert ack["status"] == "accepted"
    assert ack["pushed"] == 2
    assert len(ack["national_ids"]) == 2


def test_listings_endpoint() -> None:
    res = _client().get("/api/v1/karirhub/listings")
    assert res.status_code == 200
    body = res.json()
    assert body["total"] >= 1
    assert all(i["verified"] is True and i["source"] == "karirhub" for i in body["items"])


def test_sync_endpoint() -> None:
    res = _client().post("/api/v1/karirhub/sync", json={})
    assert res.status_code == 200
    assert res.json()["status"] == "accepted"
