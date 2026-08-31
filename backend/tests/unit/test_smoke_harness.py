"""Sanity check that the shared harness boots the app end-to-end."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    assert client.get("/health").status_code == 200


def test_register_and_login(client: TestClient, seeker_account: dict) -> None:
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": seeker_account["email"], "password": seeker_account["password"]},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["access_token"]


def test_authenticated_profile_call(client: TestClient, seeker_account: dict) -> None:
    resp = client.get("/api/v1/seeker/profile", headers=seeker_account["headers"])
    assert resp.status_code in (200, 404), resp.text
