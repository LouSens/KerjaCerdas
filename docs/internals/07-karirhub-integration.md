# KarirHub Integration (National Job System)

Files:
- `backend/app/services/integrations/karirhub.py` — service (mock)
- `backend/app/api/routers/karirhub.py` — endpoints

> **Status: mock.** Simulates integration with **KarirHub / SIAPkerja** (Kemnaker's national employment platform). The interface models the real intended data flows so the mock can be swapped for the live API without touching callers.

## Endpoints

| Endpoint | Direction | Behavior (mock) |
|---|---|---|
| `POST /api/v1/karirhub/sync` | **push** | exports all local jobs "to KarirHub", returns synthetic `national_ids` — simulates registering listings in the national system |
| `GET /api/v1/karirhub/listings` | **pull** | returns canned government-verified listings (e.g., "Teknisi Jaringan Junior") tagged `source: "karirhub"`, `verified: true` |

## Why This Exists (product rationale)

1. **Push:** Indonesian employers report vacancies to the government (Wajib Lapor Ketenagakerjaan); auto-syncing listings to KarirHub turns a compliance chore into a checkbox.
2. **Pull:** national listings widen the local job pool with government-verified postings — trust signal + inventory in one.
3. **Interop over silo:** aligning with SIAPkerja positions the platform as infrastructure *alongside* the government system rather than a competitor to it.

## Swapping in the Real API

The mock's contract (push returns national IDs; pull returns listings with `source`/`verified` fields) is the integration seam. A real implementation needs: Kemnaker API credentials, field mapping to their vacancy schema (KBJI codes are already stored on jobs — deliberately, for this), rate limiting, and an idempotency strategy for re-syncs (the mock's synthetic IDs stand in for their registry keys).
