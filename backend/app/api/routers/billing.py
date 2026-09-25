"""Plans and orders (manual payment until a payment gateway is live).

GET  /billing/plans     public catalogue (Spark / Beacon / Lighthouse / Free / Prism)
GET  /billing/me        current user's active plans + orders
POST /billing/orders    create an order -> "pending" + payment instructions;
                        an admin activates it after checking the QRIS / transfer
"""

from __future__ import annotations

from backend.app.api.dependencies import get_current_user
from backend.app.db.models import User
from backend.app.db.postgres_store import (
    find_employer_by_user_id,
    find_orders_by_user,
    get_repositories,
)
from backend.app.db.schemas_proof import PlanOrder
from backend.app.services.billing.plans import (
    SEEKER_PLANS,
    catalogue,
    employer_plans,
    entitlements_for,
    plan_price,
)
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/billing", tags=["billing"])


class OrderReq(BaseModel):
    plan: str = Field(max_length=20)
    job_id: str | None = Field(default=None, max_length=64)


@router.get("/plans")
async def plans():
    return catalogue()


@router.get("/me")
async def my_plans(current_user: User = Depends(get_current_user)):
    ent = await entitlements_for(current_user.id)
    orders = sorted(await find_orders_by_user(current_user.id), key=lambda o: o.created_at, reverse=True)
    return {
        "role": current_user.role,
        "lighthouse_until": ent.lighthouse_until,
        "beacon_jobs": sorted(ent.beacon_jobs),
        "prism_until": ent.prism_until,
        "orders": [o.model_dump() for o in orders[:20]],
    }


@router.post("/orders", status_code=status.HTTP_201_CREATED)
async def create_order(req: OrderReq, current_user: User = Depends(get_current_user)):
    allowed = employer_plans() if current_user.role == "employer" else SEEKER_PLANS
    if req.plan not in allowed:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Paket tidak tersedia untuk akun ini.")
    if req.plan == "beacon":
        if not req.job_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Beacon dibeli per lowongan: pilih lowongan.")
        job = await get_repositories().jobs.get(req.job_id)
        employer = await find_employer_by_user_id(current_user.id)
        if not job or not employer or job.employer_id != employer.id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Lowongan tidak ditemukan")
    pending = [o for o in await find_orders_by_user(current_user.id)
               if o.status == "pending" and o.plan == req.plan and o.job_id == req.job_id]
    order = pending[0] if pending else PlanOrder(
        user_id=current_user.id, plan=req.plan, job_id=req.job_id if req.plan == "beacon" else None,
        amount_idr=plan_price(req.plan),
    )
    if not pending:
        await get_repositories().plan_orders.upsert(order)
    return {
        "order_id": order.id,
        "order_code": order.id[:8].upper(),
        "plan": order.plan,
        "amount_idr": order.amount_idr,
        "status": order.status,
        "payment_instructions": catalogue()["payment_instructions"],
    }
