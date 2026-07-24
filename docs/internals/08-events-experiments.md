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
| `payload` | free-form JSON extras |

**Why `band` is on every event:** it makes match-quality measurable. Apply-rate per band is the core health metric of the matching algorithm — if `stretch` converts like `strong`, banding is miscalibrated (see `01-matching-algorithm.md`, research §7). The within-band shuffle also means click data *within* a band is nearly position-unbiased — unusually clean training signal for future learning-to-rank.

## Experiments — `GET /api/v1/experiments/assignments`

**Deterministic, stateless assignment:**

```
variant_index = MD5(f"{user_id}:{experiment_name}") % len(variants)
```

Properties:
- **No DB writes, no lookup tables** — assignment is recomputed identically anywhere, any time.
- **Sticky** — a user always lands in the same variant for a given experiment.
- **Independent across experiments** — the experiment name in the hash decorrelates assignments, so being in variant A of one test doesn't bias which arm you get in another.

Registry: in-code `EXPERIMENTS` dict, e.g.:

| Experiment | Variants |
|---|---|
| `onboarding_flow` | `cv_first` vs `skill_wizard` |
| `unlock_cta_copy` | copy variants for the unlock CTA |

The endpoint returns all active assignments for the current user in one call; the frontend branches on them and stamps `ab_variant` onto every tracked event.

## Limitations Worth Knowing

- MD5-mod assignment gives ~uniform splits but no traffic ramping (no 5% canary), no exclusion groups, and no server-side exposure logging (an unexposed user still "has" a variant). Fine at this stage; a real experimentation platform adds those later.
- Events land in Postgres via the repository layer — at serious volume this becomes an append-heavy table wanting partitioning or a move to a columnar/stream sink.
