"""Skill quizzes — how a job seeker proves a skill (✓ Terbukti badge).

GET  /quiz/skills?job_id=   skills with a quiz, and this seeker's proof status
POST /quiz/start            {skill}                -> 5 questions, no answers
POST /quiz/submit           {attempt_id, answers}  -> score, passed
"""

from __future__ import annotations

from backend.app.api.dependencies import get_current_user, require_seeker
from backend.app.db.models import User
from backend.app.db.postgres_store import find_seeker_by_user_id, get_repositories, list_quiz_skills
from backend.app.services.matching.evidence import effective_proof, skill_key
from backend.app.services.quiz import service as quiz
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/quiz", tags=["quiz"], dependencies=[Depends(require_seeker)])


class StartReq(BaseModel):
    skill: str = Field(min_length=1, max_length=120)


class SubmitReq(BaseModel):
    attempt_id: str = Field(max_length=64)
    answers: list[int] = Field(max_length=10)


class AbandonReq(BaseModel):
    attempt_id: str = Field(max_length=64)
    elapsed_seconds: int | None = Field(default=None, ge=0)


async def _seeker(user: User):
    seeker = await find_seeker_by_user_id(user.id)
    if not seeker:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Buat profil dulu sebelum mengikuti kuis.")
    return seeker


@router.get("/skills")
async def quiz_skills(job_id: str | None = None, current_user: User = Depends(get_current_user)):
    from datetime import UTC, datetime, timedelta

    seeker = await find_seeker_by_user_id(current_user.id)
    bank = {row["skill"]: row for row in await list_quiz_skills()}
    held = {}
    for sk in seeker.skills if seeker else []:
        held[skill_key(sk.name)] = {"name": sk.name, "proof": effective_proof(sk),
                                    "proof_date": sk.proof_date}

    claimed_names = {h["name"] for h in held.values()}
    wanted: list[str] = []
    if job_id:
        job = await get_repositories().jobs.get(job_id)
        if job:
            # Every required skill, held or not: a job page has to show what is
            # MISSING, not only what the seeker already listed.
            wanted = [name for name in (job.required_skills or []) if name]
    names = wanted or list(claimed_names)
    banked_keys = set(bank)
    bank = {key: row for key, row in bank.items() if key in {skill_key(name) for name in claimed_names}}

    # Preload all recent attempts for this seeker in one shot.
    from backend.app.db.postgres_store import find_quiz_attempts as _find_attempts
    from backend.app.services.quiz.service import _ATTEMPT_CAP_PER_PERIOD, RETAKE_DAYS, _aware

    all_attempts = await _find_attempts(seeker.id) if seeker else []
    now = datetime.now(UTC)

    # Group submitted attempts by skill key (last 24h). Abandonments are still
    # consumption events and should be counted as used attempts for the daily cap.
    def _cap_info(key: str) -> dict:
        period_start = now - timedelta(days=RETAKE_DAYS)
        recent = [
            a for a in all_attempts
            if a.skill == key
            and a.submitted_at is not None
            and _aware(a.submitted_at) >= period_start
        ]
        used = len(recent)
        resets_at = None
        last_status = None
        if recent:
            last = max(recent, key=lambda a: _aware(a.submitted_at))
            last_status = getattr(last, "status", "submitted") or "submitted"
            if used >= _ATTEMPT_CAP_PER_PERIOD:
                resets_at = (_aware(last.submitted_at) + timedelta(days=RETAKE_DAYS)).isoformat()
        return {
            "daily_attempts_used": used,
            "daily_attempts_cap": _ATTEMPT_CAP_PER_PERIOD,
            "cap_resets_at": resets_at,
            "last_attempt_status": last_status,
        }

    items, seen = [], set()
    for name in names:
        key = skill_key(name)
        if key in seen:
            continue
        seen.add(key)
        # quiz_available=True for any skill the seeker has claimed (generator
        # will produce questions on first start) OR that already has a bank —
        # start_quiz serves a banked skill even when it is not on the profile.
        is_claimed = key in held
        cap = _cap_info(key)
        items.append({
            "skill": name,
            "key": key,
            "quiz_available": key in banked_keys or is_claimed,
            "proof": held.get(key, {}).get("proof", "missing" if job_id else "claimed"),
            "proof_date": held.get(key, {}).get("proof_date"),
            **cap,
        })
    return {"items": items, "bank": list(bank.values()), "pass_mark": quiz.PASS_MARK,
            "questions_per_quiz": quiz.QUESTIONS_PER_QUIZ}



@router.post("/start")
async def start(req: StartReq, current_user: User = Depends(get_current_user)):
    seeker = await _seeker(current_user)
    try:
        return await quiz.start_quiz(seeker, req.skill)
    except quiz.QuizError as exc:
        raise HTTPException(exc.status, exc.message) from exc


@router.post("/submit")
async def submit(req: SubmitReq, current_user: User = Depends(get_current_user)):
    seeker = await _seeker(current_user)
    try:
        result = await quiz.submit_quiz(seeker, req.attempt_id, req.answers)
    except quiz.QuizError as exc:
        raise HTTPException(exc.status, exc.message) from exc
    # The cooldown is the same for everyone — a plan must never buy a faster
    # route to proof. submit_quiz already sets it; no per-plan override here.
    return result


@router.post("/abandon")
async def abandon(req: AbandonReq, current_user: User = Depends(get_current_user)):
    seeker = await _seeker(current_user)
    try:
        return await quiz.abandon_quiz(seeker, req.attempt_id, req.elapsed_seconds)
    except quiz.QuizError as exc:
        raise HTTPException(exc.status, exc.message) from exc
