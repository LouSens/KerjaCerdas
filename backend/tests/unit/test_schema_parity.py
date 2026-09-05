"""
KerjaCerdas — Unit Tests: ORM / Pydantic schema parity
=========================================================

`backend.app.db.models` (SQLAlchemy ORM) is the single source of truth for
persisted columns; `backend.app.db.schemas` provides typed API/repository
projections of those same tables (see that module's docstring). The two are
hand-written in separate files, so nothing stops them drifting apart the
moment someone adds a column to one side and forgets the other — that
exact drift previously left `db.schemas.User` missing a `name` field while
`backend/app/api/routers/employer.py` read `.name` off instances of it,
crashing at runtime whenever the lookup actually resolved a user.

This test makes that class of drift a CI failure instead of a production
500: for every repository pair registered in `Repositories`, the Pydantic
schema's field set must exactly match its ORM model's column set.
"""

from __future__ import annotations

import pytest

from backend.app.db.postgres_store import Repositories

_REPO_ATTRS = [
    "users",
    "seekers",
    "employers",
    "jobs",
    "applications",
    "skill_gaps",
    "courses",
]


@pytest.mark.parametrize("repo_attr", _REPO_ATTRS)
def test_schema_fields_match_orm_columns(repo_attr: str) -> None:
    repos = Repositories()
    repo = getattr(repos, repo_attr)

    schema_fields = set(repo.schema.model_fields.keys())
    model_columns = {c.name for c in repo.model.__table__.columns}

    missing_from_schema = model_columns - schema_fields
    missing_from_model = schema_fields - model_columns

    assert not missing_from_schema, (
        f"{repo.model.__name__} has columns not exposed on {repo.schema.__name__}: "
        f"{sorted(missing_from_schema)}. Add them to db/schemas.py."
    )
    assert not missing_from_model, (
        f"{repo.schema.__name__} declares fields with no matching column on "
        f"{repo.model.__name__}: {sorted(missing_from_model)}. Either the ORM "
        "model is missing a column, or the schema field is stale and should "
        "be removed."
    )
