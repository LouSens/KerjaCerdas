# Analytics Events & A/B Experiments

Files:
- `backend/app/api/routers/events.py` — event ingestion
- `backend/app/api/routers/experiments.py` — variant assignment

These two are designed as a pair: **experiments assign variants → events record outcomes tagged with the variant** → analysis closes the loop.

## Events — `POST /api/v1/events/track`

**Fire-and-forget by design:** returns `202 Accepted` immediately and swallows failures — analytics must never add latency or errors to the user path.

Tracked shape:

| Field | Examples |
|---|---|
| `event_type` | `job_viewed`, `apply_clicked`, `band_clicked` |
| `job_id` | which listing |
| `band` | match band at click time (`strong` / `possible` / `stretch`) |
| `ab_variant` | active experiment variant |
| `session_id` | client-supplied session identifier (defaults to empty string) |
| `payload` | free-form JSON extras |

Auth is optional (`get_current_user_optional`) — `user_id` is stored when a Bearer token is present, `None` for anonymous callers, so events from logged-out browsing still get recorded.

**Why `band` is on every event:** it makes match-quality measurable. Apply-rate per band is the core health metric of the matching algorithm — if `stretch` converts like `strong`, banding is miscalibrated (see `01-matching-algorithm.md`, research §7). The within-band shuffle also means click data *within* a band is nearly position-unbiased — unusually clean training signal for future learning-to-rank.

## Experiments — `GET /api/v1/experiments/assignments`

**Deterministic, stateless, weighted assignment** (`get_variant()` in `experiments.py`):

```
hash_val   = int(MD5(f"{user_id}:{experiment_name}").hexdigest(), 16)
position   = (hash_val % 10_000) / 10_000.0        # a stable point in [0, 1)
variant    = first variant whose cumulative allocation exceeds `position`
```

This is a weighted cumulative-distribution pick, not a plain `% len(variants)` — each experiment declares its own `allocation` list (currently all 50/50 splits, but the mechanism supports uneven traffic splits like 90/10 without code changes). Auth is optional; anonymous callers are assigned under the literal user id `"anonymous"`.

Properties:
- **No DB writes, no lookup tables** — assignment is recomputed identically anywhere, any time.
- **Sticky** — a user always lands in the same variant for a given experiment.
- **Independent across experiments** — the experiment name in the hash decorrelates assignments, so being in variant A of one test doesn't bias which arm you get in another.

Registry: in-code `EXPERIMENTS` dict, currently 5 experiments:

| Experiment | Variants | Split |
|---|---|---|
| `onboarding_flow` | `cv_first` vs `skill_wizard` | 50/50 |
| `band_legend_default` | `collapsed` vs `open` | 50/50 |
| `stretch_band_copy` | `challenge_framing` vs `goal_framing` | 50/50 |
| `unlock_cta_copy` | `buka_kontak` vs `hubungi_kandidat` | 50/50 |
| `profile_completeness_nudge` | `progress_bar` vs `tooltip_nudge` | 50/50 |

`GET /api/v1/experiments/assignments` returns all active assignments for the current user (or `"anonymous"`) in one call; the frontend branches on them and stamps `ab_variant` onto every tracked event. A second endpoint, `GET /api/v1/experiments/list`, returns the raw experiment definitions (variants/allocation/description) for admin/debug tooling — no `admin_routes_enabled` gate on this one, unlike `/inquiries`.

## Limitations Worth Knowing

- MD5-mod assignment gives ~uniform splits but no traffic ramping (no 5% canary), no exclusion groups, and no server-side exposure logging (an unexposed user still "has" a variant). Fine at this stage; a real experimentation platform adds those later.
- Events land in Postgres via the repository layer — at serious volume this becomes an append-heavy table wanting partitioning or a move to a columnar/stream sink.
