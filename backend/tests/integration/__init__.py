"""Integration tests — require a live Postgres + pgvector database.

Run with:
    pytest backend/tests/integration/ -v --timeout=30

These tests are skipped in CI unit-test gate (Gate 2) and only execute in
Gate 3 where the postgres service is available.
"""
