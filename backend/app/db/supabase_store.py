"""
Supabase adapter (Postgres + pgvector). Stub — wire when SUPABASE_URL is set.

Tables map 1:1 to Pydantic models in schemas.py. Embedding columns are
declared as `vector(768)` (text-embedding-004 dim) with `ivfflat` indexes for
cosine similarity.
"""
from __future__ import annotations

import os
from typing import Generic, Type, TypeVar

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class SupabaseRepository(Generic[T]):
    def __init__(self, model: Type[T], table: str) -> None:
        self.model = model
        self.table = table
        self._client = None  # lazily init supabase.Client to keep import optional

    def _client_or_raise(self):
        if self._client is not None:
            return self._client
        try:
            from supabase import create_client
        except ImportError as e:
            raise RuntimeError("supabase-py not installed") from e
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        self._client = create_client(url, key)
        return self._client

    async def get(self, oid: str) -> T | None:
        c = self._client_or_raise()
        resp = c.table(self.table).select("*").eq("id", oid).maybe_single().execute()
        return self.model.model_validate(resp.data) if resp.data else None

    async def upsert(self, obj: T) -> T:
        c = self._client_or_raise()
        c.table(self.table).upsert(obj.model_dump(mode="json")).execute()
        return obj

    async def knn_by_embedding(
        self, query_embedding: list[float], top_k: int = 10
    ) -> list[T]:
        """Calls a SQL RPC `match_<table>(query_embedding vector, match_count int)`.
        Each RPC returns rows ordered by `embedding <=> query_embedding` (cosine)."""
        c = self._client_or_raise()
        resp = c.rpc(
            f"match_{self.table}",
            {"query_embedding": query_embedding, "match_count": top_k},
        ).execute()
        return [self.model.model_validate(r) for r in (resp.data or [])]
