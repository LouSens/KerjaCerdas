"""A/B testing feature flag endpoint.

GET  /api/v1/experiments/assignments   → {experiment: variant} for the current user
GET  /api/v1/experiments/list          → all defined experiments (admin/debug)

Assignment is deterministic: same user always gets the same variant across sessions.
Uses MD5(user_id:experiment_name) so there is no persistent state to maintain —
the variant is derived on-the-fly from the user ID.

To run a new experiment:
  1. Add an entry to EXPERIMENTS below.
  2. Deploy.
  3. Read `ab_variant` from the frontend assignments and render accordingly.
  4. Track interactions via POST /events/track with `ab_variant` populated.
  5. Query the events table for result analysis.
"""
from __future__ import annotations

import hashlib

from fastapi import APIRouter, Depends

from backend.app.api.dependencies import get_current_user

router = APIRouter(prefix="/experiments", tags=["experiments"])


# ── Experiment registry ────────────────────────────────────────────────────────
# Each experiment has a set of variants and a traffic allocation that sums to 1.0.
# Add new experiments here — no other file needs to change.

EXPERIMENTS: dict[str, dict] = {
    "onboarding_flow": {
        "variants": ["cv_first", "skill_wizard"],
        "allocation": [0.50, 0.50],
        "description": "Onboarding step order: upload CV first vs guided skill wizard",
    },
    "band_legend_default": {
        "variants": ["collapsed", "open"],
        "allocation": [0.50, 0.50],
        "description": "Is the BandLegend expanded by default for new users?",
    },
    "stretch_band_copy": {
        "variants": ["challenge_framing", "goal_framing"],
        "allocation": [0.50, 0.50],
        "description": "Stretch band framing: 'tantangan' vs 'tujuan yang bisa dikejar'",
    },
    "unlock_cta_copy": {
        "variants": ["buka_kontak", "hubungi_kandidat"],
        "allocation": [0.50, 0.50],
        "description": "Employer unlock button text",
    },
    "profile_completeness_nudge": {
        "variants": ["progress_bar", "tooltip_nudge"],
        "allocation": [0.50, 0.50],
        "description": "How profile completeness is communicated to the seeker",
    },
}


def get_variant(user_id: str, experiment: str) -> str:
    """Deterministic, stateless variant assignment.

    The same (user_id, experiment) pair always resolves to the same variant,
    so a user never sees the interface flicker between sessions. No DB write
    needed — the variant is a pure function of the inputs.
    """
    if experiment not in EXPERIMENTS:
        return "control"
    exp = EXPERIMENTS[experiment]
    # Stable hash: MD5 is fine here — not a security context
    hash_val = int(hashlib.md5(f"{user_id}:{experiment}".encode()).hexdigest(), 16)
    cumulative = 0.0
    for variant, alloc in zip(exp["variants"], exp["allocation"]):
        cumulative += alloc
        if (hash_val % 10_000) / 10_000.0 < cumulative:
            return variant
    return exp["variants"][-1]


@router.get("/assignments")
async def get_assignments(current_user=Depends(get_current_user)):
    """Return the full variant assignment map for the logged-in user.

    Frontend should call this once after login and store results in the
    Zustand store under `experiments`. Every component reads its variant
    from there — no further API calls needed.
    """
    user_id = str(current_user.id)
    return {exp: get_variant(user_id, exp) for exp in EXPERIMENTS}


@router.get("/list")
async def list_experiments():
    """Return experiment definitions for admin / debug tooling."""
    return {
        name: {
            "variants": meta["variants"],
            "allocation": meta["allocation"],
            "description": meta["description"],
        }
        for name, meta in EXPERIMENTS.items()
    }
