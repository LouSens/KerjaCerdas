"""Admin endpoints — CRM, AI performance, platform metrics.

For the prototype we do not enforce admin auth on every endpoint (the user
list is small). When billing/phase 2 ships, gate these behind a real RBAC
check using `dependencies.get_current_user` with role=admin.
"""
from __future__ import annotations

from collections import Counter

from fastapi import APIRouter, Depends

from backend.app.api.dependencies import require_admin
from backend.app.db.json_store import get_repositories

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],  # every admin route requires admin role
)


@router.get("/metrics")
async def platform_metrics():
    repos = get_repositories()
    users = await repos.users.list()
    seekers = await repos.seekers.list()
    employers = await repos.employers.list()
    jobs = await repos.jobs.list()
    apps = await repos.applications.list()
    role_counts = Counter(u.role.value for u in users)
    return {
        "users": {
            "total": len(users),
            "by_role": dict(role_counts),
            "active": sum(1 for u in users if u.is_active),
        },
        "seekers": len(seekers),
        "employers": len(employers),
        "jobs": {
            "total": len(jobs),
            "active": sum(1 for j in jobs if j.is_active),
        },
        "applications": len(apps),
        # billing/phase-2 placeholders
        "revenue_idr": 0,
        "mrr_idr": 0,
    }


@router.get("/users")
async def list_users(limit: int = 50):
    repos = get_repositories()
    users = await repos.users.list()
    return {
        "total": len(users),
        "items": [
            {
                "id": u.id,
                "email": u.email,
                "role": u.role.value,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat(),
            }
            for u in users[:limit]
        ],
    }


@router.get("/ai/performance")
async def ai_performance(limit: int = 100):
    repos = get_repositories()
    logs = await repos.ai_logs.list()
    logs = sorted(logs, key=lambda x: x.created_at, reverse=True)[:limit]
    if not logs:
        return {"count": 0, "items": [], "avg_latency_ms": 0, "success_rate": 1.0}
    avg = sum(x.latency_ms for x in logs) / len(logs)
    success_rate = sum(1 for x in logs if x.success) / len(logs)
    return {
        "count": len(logs),
        "avg_latency_ms": round(avg, 1),
        "success_rate": round(success_rate, 3),
        "by_task": dict(Counter(x.task for x in logs)),
        "flagged": sum(1 for x in logs if x.flagged),
        "items": logs,
    }


@router.get("/jobs")
async def admin_list_jobs():
    repos = get_repositories()
    jobs = await repos.jobs.list()
    return {"total": len(jobs), "items": jobs}


@router.delete("/jobs/{job_id}")
async def admin_delete_job(job_id: str):
    repos = get_repositories()
    ok = await repos.jobs.delete(job_id)
    return {"deleted": ok}
