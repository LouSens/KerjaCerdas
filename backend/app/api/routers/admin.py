"""Admin (ADMIN_EMAILS + ADMIN_ROUTES_ENABLED): moderation, reviews, orders, metrics.

Moderation   GET  /admin/moderation/queue?limit&offset  held + flagged + openly reported
                                                  jobs, with reasons, reports and events
             POST /admin/moderation/jobs/{id}      {decision: publish|reject, note}
Reviews      GET  /admin/employer-reviews           "Ditinjau admin" requests
             POST /admin/employer-reviews/{id}      {approve: bool}
Orders       GET  /admin/orders?status=pending
             POST /admin/orders/{id}/activate | /cancel
Question bank GET /admin/questions ; POST /admin/questions/{id} {reviewed, active}
Metrics      GET  /admin/metrics
Storage      GET  /admin/storage/health            S3/R2 configured + reachable
"""

from __future__ import annotations

from backend.app.api.dependencies import require_admin
from backend.app.api.routers.jobs import invalidate_jobs_cache
from backend.app.api.services.admin_metrics import collect_metrics
from backend.app.db.models import User
from backend.app.db.postgres_store import (
    find_jobs_by_moderation_status,
    find_moderation_events,
    find_orders_by_status,
    find_reports_for_job,
    find_unresolved_reports,
    get_repositories,
)
from backend.app.db.schemas import VerificationStatus
from backend.app.services.billing.plans import activate
from backend.app.services.storage import storage_health
from backend.app.services.trust import policy
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


class Decision(BaseModel):
    decision: str = Field(pattern="^(publish|reject)$")
    note: str = Field(default="", max_length=1000)


class ReviewDecision(BaseModel):
    approve: bool


class QuestionUpdate(BaseModel):
    reviewed: bool | None = None
    active: bool | None = None


@router.get("/moderation/queue")
async def moderation_queue(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    """Postings a human still has to rule on, grouped by source and paged.

    Order is `flagged`, then `held`, then postings carrying unresolved reports —
    each group by posting age. The order is deterministic on purpose: `offset`
    paging over an unstable order would repeat some postings and skip others.

    Three sources, not one. A posting can need a human because AutoMod held it,
    because the community flagged it — or because it carries reports that never
    reached the flag threshold. That last case used to be invisible forever: the
    posting stayed `published`, the reports stayed unresolved, and so no verdict
    was ever recorded against the people who filed them. A reporter who files
    steadily but never trips a threshold would accumulate no history at all,
    which is precisely the pattern weighting exists to catch.

    The queue is assembled on the BACKLOG axis and then paged. Two status
    queries and one open-report query name the jobs; only the page actually
    returned pays the per-job cost of an employer, its reports and its events.
    The earlier version walked every published job asking for its reports, which
    cost a query per job and grew with the CATALOGUE — the wrong axis, and slow
    exactly when the job board succeeds. Paging matters for the same reason:
    without it a backlog spike turns one admin page load into thousands of
    queries.
    """
    repos = get_repositories()
    queued = [
        *await find_jobs_by_moderation_status("flagged"),
        *await find_jobs_by_moderation_status("held"),
    ]
    seen_ids = {j.id for j in queued}
    open_report_job_ids = {
        r.job_id for r in await find_unresolved_reports() if r.job_id not in seen_ids
    }
    if open_report_job_ids:
        queued.extend(await repos.jobs.get_many(sorted(open_report_job_ids)))
    # Slice BEFORE the fan-out below, never after: the point of a limit is to
    # bound the work done, not merely the rows handed back.
    page = queued[offset : offset + limit]
    out = []
    for job in page:
        employer = await repos.employers.get(job.employer_id)
        out.append({
            "job_id": job.id, "title": job.title, "description": job.description[:1500],
            "company_name": employer.company_name if employer else "",
            "moderation_status": job.moderation_status,
            "reasons": job.moderation_reasons,
            "reports": [r.model_dump() for r in await find_reports_for_job(job.id) if not r.resolved],
            "events": [e.model_dump() for e in await find_moderation_events(job.id)][-10:],
        })
    return {"total": len(queued), "count": len(out), "limit": limit, "offset": offset, "items": out}


@router.post("/moderation/jobs/{job_id}")
async def moderate_job(job_id: str, req: Decision, admin: User = Depends(require_admin)):
    repos = get_repositories()
    job = await repos.jobs.get(job_id)
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lowongan tidak ditemukan")
    employer = await repos.employers.get(job.employer_id)
    strike = None
    if req.decision == "publish":
        policy.set_moderation(job, "published", [])
        job.is_active = True
    else:
        reasons = [*job.moderation_reasons,
                   {"rule": "admin_review", "severity": "hard", "excerpt": "", "fix": req.note or
                    "Ditolak admin setelah peninjauan."}]
        policy.set_moderation(job, "rejected", reasons)
        if employer:
            strike = await policy.add_strike(employer)
    await repos.jobs.upsert(job)
    # Record HOW each report ended, not just that it did. Reporter weighting
    # reads this history (services/trust/rules.reporter_weight): without it,
    # "has a report that held up" and "has three that did not" were both
    # permanently zero, so a serial false reporter never lost standing and a
    # reliable one never gained any. Publishing means the accusations did not
    # hold; rejecting means they did.
    # ONLY the reports still open. find_reports_for_job returns every report the
    # job ever had, so writing to all of them let a later decision rewrite an
    # older, already-settled verdict — a reporter whose complaint was upheld in
    # March would silently be marked wrong in June because a different report on
    # the same posting was dismissed. Standing has to be a record, not a copy of
    # the most recent decision.
    upheld = req.decision != "publish"
    for r in await find_reports_for_job(job.id):
        if r.resolved:
            continue
        r.resolved = True
        r.upheld = upheld
        await repos.job_reports.upsert(r)
    await policy.log_event(job, admin.email, job.moderation_status, note=req.note)
    invalidate_jobs_cache()
    return {"job_id": job.id, "moderation_status": job.moderation_status, "strike": strike}


@router.get("/employer-reviews")
async def employer_reviews():
    repos = get_repositories()
    pending = await repos.employers.find(lambda e: e.verified == VerificationStatus.PENDING)
    return {"items": [{"employer_id": e.id, "company_name": e.company_name, "website": e.website,
                       "links": e.review_links} for e in pending]}


@router.post("/employer-reviews/{employer_id}")
async def decide_review(employer_id: str, req: ReviewDecision):
    repos = get_repositories()
    employer = await repos.employers.get(employer_id)
    if not employer:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Perusahaan tidak ditemukan")
    employer.verified = VerificationStatus.VERIFIED if req.approve else VerificationStatus.FAILED
    await repos.employers.upsert(employer)
    invalidate_jobs_cache()
    return {"employer_id": employer.id, "verified": employer.verified}


@router.get("/orders")
async def orders(status_filter: str = "pending"):
    return {"items": [o.model_dump() for o in await find_orders_by_status(status_filter)]}


@router.post("/orders/{order_id}/activate")
async def activate_order(order_id: str, admin: User = Depends(require_admin)):
    repos = get_repositories()
    order = await repos.plan_orders.get(order_id)
    if not order or order.status != "pending":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pesanan pending tidak ditemukan")
    order = await activate(order, admin.email)
    return order.model_dump()


@router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str):
    repos = get_repositories()
    order = await repos.plan_orders.get(order_id)
    if not order or order.status != "pending":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pesanan pending tidak ditemukan")
    order.status = "cancelled"
    await repos.plan_orders.upsert(order)
    return order.model_dump()


@router.get("/questions")
async def questions():
    items = await get_repositories().skill_questions.list()
    return {"items": [q.model_dump() for q in sorted(items, key=lambda q: (q.skill, q.created_at))]}


@router.post("/questions/{question_id}")
async def update_question(question_id: str, req: QuestionUpdate):
    repos = get_repositories()
    q = await repos.skill_questions.get(question_id)
    if not q:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Soal tidak ditemukan")
    if req.reviewed is not None:
        q.reviewed = req.reviewed
    if req.active is not None:
        q.active = req.active
    await repos.skill_questions.upsert(q)
    return q.model_dump()


@router.get("/metrics")
async def metrics():
    return await collect_metrics()


@router.get("/storage/health")
async def storage_status():
    return await storage_health()
