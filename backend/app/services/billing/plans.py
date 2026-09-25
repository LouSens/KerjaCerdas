"""Plan catalogue and entitlement checks (Spark / Beacon / Lighthouse / Prism).

Employers
  Spark       Rp0          1 active job, ALL applicants ranked, core features
  Beacon      Rp49.000     per job for 30 days: AI interview questions, CSV
                           export, pipeline tools, reverse matching
  Lighthouse  Rp149.000    per 30 days: up to 5 active jobs, all Beacon features
Job seekers
  Free        Rp0          matching, skill gap, unlimited quizzes (retake next
                           day), advisor 10 messages / day
  Prism       Rp15.000     per 30 days: advisor 20 messages / day (2x free).
                           Roadmap: AI interview practice, formatted CV export.

The paywall sits on what COSTS us money and saves an employer time (interview
kits, export, sourcing), not on how many applicants may be seen. Ranking is a
free computation; charging for it punished candidates rather than us, and left
the free tier able to do the whole job for a one-person hire anyway.

THE SEEKER RULE, and it is not negotiable:

    A job seeker may pay for PRACTICE and PRESENTATION.
    Never for POSITION, and never for INFORMATION ABOUT THEIR POSITION.

Exact rank in a job's applicant queue was briefly sold under Prism. The score
and the ordering were identical either way, so it looked fair — but a candidate
who knows they are 14th of 62, and which claimed skill costs them, can act where
one who does not know cannot. That is advantage bought with money, charged to
the side of the market that has the least of it. It is free for everyone now,
and `test_seeing_your_own_standing_is_never_sold` fails if the gate returns.

Anything that touches the ranking, or what a candidate can learn about their
place in it, is free on every tier forever: scores, bands, exact rank, the
per-skill evidence breakdown, skill gap, courses, quizzes, badges, and the
1-day retake cooldown.

Two more invariants, both guarded by tests:
  1. Each paid benefit is ENFORCED somewhere. A feature advertised in
     catalogue() with no gate is revenue given away; `talent_search_limit` was
     unit tested but unreferenced for exactly that reason.
  2. On the employer side the paywall sits on SOURCING (finding people who have
     not applied), never on SCREENING the people who did.

Prism no longer shortens the quiz retake cooldown. That was money buying a
faster route to a proof badge, which moves a match score — the one thing the
product promises paying can never do.

Payment is manual for now (QRIS / bank transfer): a plan order stays
"pending" until an admin confirms the payment and activates it for 30 days.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta

from backend.app.config.settings import settings
from backend.app.db import postgres_store as store
from backend.app.db.schemas_proof import PlanOrder

PLAN_DAYS = 30
LIGHTHOUSE_ACTIVE_JOBS = 5
SPARK_ACTIVE_JOBS = 1

# Advisor metering. Both tiers are now measured in the SAME unit (per day), and
# the paid one is strictly larger. It used to be 10/day free versus 100/30 days
# on Prism — i.e. 300 a month free against 100 a month paid, with the paid user
# locked out for up to 30 days instead of until tomorrow. Paying bought less.
# Any future change must keep PRISM > FREE on the same axis.
#
# The ceiling is priced, not guessed. At 20/day a Prism subscriber can consume
# 600 messages in 30 days; on the normal flash-lite tier (~Rp13,5 buffered) that
# is Rp8.100 against a Rp15.000 price — a 46% margin floor. It was briefly 30,
# which leaves 19% and is negative the moment llm_factory falls back to
# gemini-3.6-flash (~Rp57 buffered, break-even at 8,8 messages/day). Until
# metering is by COST rather than by message count, the cap has to survive the
# fallback chain, not just the happy path.
ADVISOR_FREE_PER_DAY = 10
ADVISOR_PRISM_PER_DAY = 20

# Reverse matching (searching candidates who have NOT applied) is the employer
# feature that is genuinely worth money: it is sourcing, not screening. Ranked
# APPLICANTS are deliberately uncapped on every tier, including free — ranking
# costs Rp0 to compute, so capping it saved us nothing and cost a candidate
# ranked 21st their only chance of being seen.
TALENT_SEARCHES_SPARK = 0
TALENT_SEARCHES_BEACON = 30
TALENT_SEARCHES_LIGHTHOUSE = 150

EMPLOYER_PLANS = ("beacon", "lighthouse")
SEEKER_PLANS = ("prism",)


def plan_price(plan: str) -> int:
    return {
        "beacon": settings.plan_price_beacon,
        "lighthouse": settings.plan_price_lighthouse,
        "prism": settings.plan_price_prism,
    }[plan]


EMPLOYER_FREE_FEATURES = [
    "Lowongan aktif tanpa batas",
    "Semua pelamar diperingkat dari yang paling cocok",
    "Pertanyaan wawancara AI per kandidat",
    "Konfirmasi skill setelah wawancara",
    "Alasan penolakan terstruktur untuk pelamar",
    "Ekspor pelamar (CSV)",
]


def employer_plans() -> tuple[str, ...]:
    """Employer plans that can be ordered right now (none while plans are off)."""
    return EMPLOYER_PLANS if settings.employer_plans_enabled else ()


def catalogue() -> dict:
    if not settings.employer_plans_enabled:
        employer = [{"plan": "spark", "price_idr": 0, "period": "gratis",
                     "features": EMPLOYER_FREE_FEATURES}]
    else:
        employer = _paid_employer_catalogue()
    return {
        "employer": employer,
        "seeker": [
            {"plan": "free", "price_idr": 0, "period": "gratis",
             "features": ["Skor kecocokan + skill gap per lowongan target",
                          "Rencana belajar dan rekomendasi kursus",
                          "Peringkat persis tiap lamaran (mis. #14 dari 62)",
                          "Alasan penolakan dari HR",
                          f"Advisor {ADVISOR_FREE_PER_DAY} pesan / hari"]},
            {"plan": "prism", "price_idr": settings.plan_price_prism, "period": "per 30 hari",
             "features": [f"Advisor {ADVISOR_PRISM_PER_DAY} pesan / hari (2x gratis)",
                          "Segera: simulasi wawancara AI + umpan balik",
                          "Segera: CV terformat dari profil yang sudah terverifikasi"],
             "note": ("Prism membeli LATIHAN, bukan peringkat. Semua yang "
                      "memengaruhi peringkatmu — dan semua yang bisa kamu "
                      "ketahui tentang peringkatmu — gratis selamanya.")},
        ],
        "note": ("Membayar tidak pernah mengubah skor kecocokan maupun peringkat, "
             "dan tidak pernah membuka informasi tentang peringkatmu yang tidak "
             "didapat pengguna gratis. Skor, peringkat, dan urutan pelamar "
             "sama untuk semua paket."),
        "payment_instructions": settings.payment_instructions,
    }


def _paid_employer_catalogue() -> list[dict]:
    return [
            {"plan": "spark", "price_idr": 0, "period": "gratis",
             "features": ["1 lowongan aktif", "Link + QR lowongan",
                          "Semua pelamar diperingkat — tanpa batas",
                          "Badge skill terbukti", "Centang 'skill terbukti' setelah wawancara"]},
            {"plan": "beacon", "price_idr": settings.plan_price_beacon,
             "period": "per lowongan / 30 hari",
             "features": ["Semua fitur Spark", "Pertanyaan wawancara AI per kandidat",
                          "Ekspor pelamar (CSV)",
                          f"Cari kandidat yang belum melamar ({TALENT_SEARCHES_BEACON}x / 30 hari)"]},
            {"plan": "lighthouse", "price_idr": settings.plan_price_lighthouse,
             "period": "per 30 hari",
             "features": ["Semua fitur Beacon", f"Hingga {LIGHTHOUSE_ACTIVE_JOBS} lowongan aktif",
                          f"Cari kandidat ({TALENT_SEARCHES_LIGHTHOUSE}x / 30 hari)"]},
    ]


def _is_live(order: PlanOrder, now: datetime) -> bool:
    if order.status != "active" or order.expires_at is None:
        return False
    exp = order.expires_at if order.expires_at.tzinfo else order.expires_at.replace(tzinfo=UTC)
    return exp > now


@dataclass
class Entitlements:
    lighthouse_until: datetime | None = None
    beacon_jobs: set[str] = field(default_factory=set)
    prism_until: datetime | None = None

    @property
    def has_lighthouse(self) -> bool:
        return self.lighthouse_until is not None

    @property
    def has_prism(self) -> bool:
        return self.prism_until is not None

    def job_tier(self, job_id: str) -> str:
        if self.has_lighthouse:
            return "lighthouse"
        return "beacon" if job_id in self.beacon_jobs else "spark"

    def premium_for_job(self, job_id: str) -> bool:
        if not settings.plan_limits_enforced or not settings.employer_plans_enabled:
            return True
        return self.job_tier(job_id) != "spark"


async def entitlements_for(user_id: str) -> Entitlements:
    now = datetime.now(UTC)
    ent = Entitlements()
    for o in await store.find_orders_by_user(user_id):
        if not _is_live(o, now):
            continue
        if o.plan == "lighthouse":
            ent.lighthouse_until = max(filter(None, [ent.lighthouse_until, o.expires_at]))
        elif o.plan == "beacon" and o.job_id:
            ent.beacon_jobs.add(o.job_id)
        elif o.plan == "prism":
            ent.prism_until = max(filter(None, [ent.prism_until, o.expires_at]))
    return ent


def talent_search_limit(ent: Entitlements, job_id: str) -> int:
    """Reverse-matching searches allowed per 30 days, FOR THIS JOB.

    Quota goes HERE and not on ranked applicants. Scoring people who applied is
    free to compute and capping it only hides candidates; searching people who
    did not apply is sourcing, which is the thing an employer will actually pay
    for and the thing we want a deliberate, countable limit on.

    `job_id` is required, and that is the whole point. Beacon is sold PER JOB.
    An earlier version asked only "does this employer hold any Beacon?", so
    paying for job A silently unlocked sourcing on every unpaid Spark job the
    same account owned — the per-job product was billed per job and delivered
    per account. Lighthouse is genuinely account-wide, so it alone ignores which
    job is being searched.
    """
    if not settings.employer_plans_enabled:
        # No paid plans: sourcing is free, with the per-job fair-use allowance
        # the paid tier used to buy (each search costs an embedding lookup).
        return TALENT_SEARCHES_BEACON
    tier = ent.job_tier(job_id)
    if tier == "lighthouse":
        return TALENT_SEARCHES_LIGHTHOUSE
    return TALENT_SEARCHES_BEACON if tier == "beacon" else TALENT_SEARCHES_SPARK


def active_job_limit(ent: Entitlements) -> int:
    """Active jobs allowed that are NOT individually covered by a Beacon order."""
    return LIGHTHOUSE_ACTIVE_JOBS if ent.has_lighthouse else SPARK_ACTIVE_JOBS


async def activate(order: PlanOrder, admin_email: str) -> PlanOrder:
    now = datetime.now(UTC)
    order.status = "active"
    order.activated_by = admin_email
    order.starts_at = now
    order.expires_at = now + timedelta(days=PLAN_DAYS)
    order.updated_at = now
    await store.get_repositories().plan_orders.upsert(order)
    return order
