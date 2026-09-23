"""Guards for the v3 invariants — each one encodes a defect we actually shipped.

Every test here exists because the property it checks was silently false in
production code, not because it seemed like a good idea.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

from backend.app.services.billing import plans
from backend.app.services.quiz import service
from backend.app.services.trust import rules


class _Q:
    def __init__(self, qid: str) -> None:
        self.id = qid


class _Attempt:
    def __init__(self, qids: list[str], when: datetime) -> None:
        self.question_ids = qids
        self.submitted_at = when


class TestRetakeNeverRepeatsTheLastQuiz:
    """The defect: a 6-question bank drawing 5 repeated >=4 on every retake.

    A badge obtainable by memorising six items was feeding a 0.85 proof weight,
    and the only thing slowing it down was a cooldown that was also for sale.
    """

    def _bank(self, n: int) -> list[_Q]:
        return [_Q(f"q{i}") for i in range(n)]

    def test_no_question_from_the_previous_attempt_is_redrawn(self) -> None:
        bank = self._bank(30)
        now = datetime.now(UTC)
        first = service._pick_questions(bank, [])
        attempt = _Attempt([q.id for q in first], now)

        for _ in range(25):
            second = service._pick_questions(bank, [attempt])
            assert not ({q.id for q in second} & set(attempt.question_ids)), (
                "a retake redrew a question the candidate just saw"
            )

    def test_a_thin_bank_still_serves_rather_than_locking_the_candidate_out(self) -> None:
        """Our unfinished bank must never become the candidate's punishment."""
        bank = self._bank(6)
        attempt = _Attempt([q.id for q in bank[:5]], datetime.now(UTC))
        picked = service._pick_questions(bank, [attempt])
        assert len(picked) == service.QUESTIONS_PER_QUIZ

    def test_two_attempts_back_are_avoided_when_the_bank_allows(self) -> None:
        bank = self._bank(30)
        now = datetime.now(UTC)
        older = _Attempt([f"q{i}" for i in range(5)], now - timedelta(days=2))
        recent = _Attempt([f"q{i}" for i in range(5, 10)], now - timedelta(days=1))
        seen = set(older.question_ids) | set(recent.question_ids)
        for _ in range(25):
            picked = service._pick_questions(bank, [older, recent])
            assert not ({q.id for q in picked} & seen)


class TestPayingNeverBuysProofOrLessService:
    def test_the_retake_cooldown_is_the_same_for_everyone(self) -> None:
        """Prism used to cut the cooldown 7 days -> 2.

        That is money shortening the path to a badge, and a badge moves the match
        score — the single thing the product promises paying cannot do.
        """
        assert not hasattr(service, "RETAKE_DAYS_PRISM")
        assert service.RETAKE_DAYS == 1

    def test_the_paid_advisor_quota_is_larger_on_the_same_axis(self) -> None:
        """The defect: 10/day free versus 100/30 days paid.

        Free was 300 a month, Prism was 100, and an exhausted Prism user waited
        up to 30 days where a free user waited until tomorrow. Paying bought
        less service and a longer lockout.
        """
        assert not hasattr(plans, "ADVISOR_PRISM_PER_30_DAYS"), (
            "a per-30-day paid quota cannot be compared with a per-day free one"
        )
        assert plans.ADVISOR_PRISM_PER_DAY > plans.ADVISOR_FREE_PER_DAY

    def test_ranked_applicants_are_not_capped_by_default(self) -> None:
        """Ranking costs Rp0 to compute, so capping it only hid candidates."""
        from backend.app.config.settings import settings

        assert settings.spark_ranked_applicant_limit == 0

    def test_the_moderation_backlog_drains_oldest_first(self) -> None:
        """A capped newest-first queue starves its oldest entries forever.

        With a cap and newest-first ordering, once the backlog exceeded the cap
        the OLDEST reports fell off the only screen that can resolve them. They
        stayed unresolved, so no verdict was ever recorded, so the reporters who
        filed them never built the history `reporter_weight` reads — the exact
        failure this weighting exists to prevent.
        """
        import inspect

        from backend.app.db import postgres_store as store

        src = inspect.getsource(store.find_unresolved_reports)
        assert "created_at.desc()" not in src, (
            "newest-first with a cap permanently strands the oldest reports"
        )
        assert "order_by=JobReport.created_at" in src

    def test_nothing_about_a_seekers_own_position_is_sold(self) -> None:
        """The seeker rule: pay for practice and presentation, never position.

        Selling exact rank passed every earlier test — the score and the
        ordering really were identical for payers and non-payers. The defect was
        one level up: a candidate who knows they are 14th of 62, and which
        claimed skill costs them, can act where one who does not know cannot.
        Charging the unemployed for that is pay-to-win wearing a technicality.

        So the paid seeker tier may not advertise ANY of the vocabulary of
        position or of information about it.
        """
        seeker_tiers = {t["plan"]: t for t in plans.catalogue()["seeker"]}
        paid = seeker_tiers["prism"]
        forbidden = ("peringkat", "rank", "skor", "score", "urutan", "posisi", "band")
        for feature in paid["features"]:
            low = feature.lower()
            for word in forbidden:
                assert word not in low, (
                    f"Prism advertises {feature!r}, which sells position or knowledge of "
                    f"it ({word!r}). That belongs in the free tier."
                )

        # ...and the free tier must actually carry them, or the rule is hollow.
        free_text = " ".join(seeker_tiers["free"]["features"]).lower()
        assert "peringkat persis" in free_text, "exact rank must stay free for everyone"

    def test_quota_sits_on_reverse_matching_instead(self) -> None:
        ent = plans.Entitlements()
        assert plans.talent_search_limit(ent, "job-1") == 0
        ent.beacon_jobs.add("job-1")
        assert plans.talent_search_limit(ent, "job-1") > 0

    def test_a_beacon_unlocks_only_the_job_it_was_bought_for(self) -> None:
        """Beacon is sold PER JOB and must be delivered per job.

        The limit used to be derived from "does this account hold any Beacon?",
        so paying for job A unlocked reverse matching on every unpaid Spark job
        the same account owned — a per-job product billed per job and delivered
        per account.
        """
        ent = plans.Entitlements()
        ent.beacon_jobs.add("paid-job")
        assert plans.talent_search_limit(ent, "paid-job") == plans.TALENT_SEARCHES_BEACON
        assert plans.talent_search_limit(ent, "unpaid-job") == 0, (
            "a Beacon on one job unlocked sourcing on another"
        )

    def test_lighthouse_is_account_wide_on_purpose(self) -> None:
        """The per-job rule must not accidentally break the account-wide tier."""
        from datetime import UTC, datetime, timedelta

        ent = plans.Entitlements(lighthouse_until=datetime.now(UTC) + timedelta(days=5))
        for job in ("job-a", "job-b", "never-seen"):
            assert plans.talent_search_limit(ent, job) == plans.TALENT_SEARCHES_LIGHTHOUSE


class TestReportsCannotRemoveAPostingOnTheirOwn:
    def test_a_brand_new_unverified_account_carries_no_weight(self) -> None:
        assert (
            rules.reporter_weight(
                email_verified=False,
                applied_to_job=False,
                account_age_days=0,
                upheld_reports=0,
                dismissed_reports=0,
            )
            == 0
        )

    def test_a_serial_false_reporter_stops_counting(self) -> None:
        assert (
            rules.reporter_weight(
                email_verified=True,
                applied_to_job=True,
                account_age_days=400,
                upheld_reports=0,
                dismissed_reports=rules.DISMISSED_REPORTS_TO_MUTE,
            )
            == 0
        )

    def test_reaching_the_threshold_flags_rather_than_hides(self) -> None:
        assert rules.flag_state(rules.FLAG_WEIGHT_THRESHOLD, reports=3) == "flagged"
        assert "flagged" in __import__(
            "backend.app.services.trust.policy", fromlist=["policy"]
        ).VISIBLE_STATUSES, "a flagged posting must stay readable while it is reviewed"

    def test_one_loud_reporter_is_not_enough(self) -> None:
        """Weight alone must not trip the flag — it takes more than one person."""
        assert rules.flag_state(99, reports=1) == "published"


class TestRejectionMustCarryAReason:
    def test_the_catalogue_is_closed_and_non_empty(self) -> None:
        from backend.app.api.routers.employer import REJECTION_REASONS

        assert REJECTION_REASONS
        assert "lainnya" in REJECTION_REASONS

    @pytest.mark.parametrize("code", ["", "tidak_suka", "NOPE"])
    def test_unknown_codes_are_not_accepted(self, code: str) -> None:
        from backend.app.api.routers.employer import REJECTION_REASONS

        assert code not in REJECTION_REASONS


class TestGeneratedQuestionsAreScreened:
    def test_a_giveaway_answer_is_rejected(self) -> None:
        from backend.app.services.quiz.generator import validate_question

        problem = validate_question(
            "Pelanggan komplain karena pesanannya terlambat. Apa langkah pertama?",
            ["Diam saja", "Marah", "Minta maaf", "x" * 200],
            3,
        )
        assert problem is not None

    def test_combination_options_are_rejected(self) -> None:
        from backend.app.services.quiz.generator import validate_question

        problem = validate_question(
            "Pelanggan komplain karena pesanannya terlambat. Apa langkah pertama?",
            ["Minta maaf", "Cek pesanan", "Semua benar", "Abaikan"],
            0,
        )
        assert problem is not None

    def test_a_sound_question_passes(self) -> None:
        from backend.app.services.quiz.generator import validate_question

        assert (
            validate_question(
                "Pelanggan komplain karena pesanannya terlambat. Apa langkah pertama?",
                ["Minta maaf dan cek status", "Abaikan", "Minta dia telepon", "Tutup chat"],
                0,
            )
            is None
        )


class TestReviewFindingsStayFixed:
    """One guard per defect found in review of PR #29. Each was live in the branch."""

    def test_only_a_hard_rule_can_hide_a_live_posting(self) -> None:
        """A soft-rule "violation" is an opinion needing context the text lacks.

        The reviewer returned {"verdict": "violation"} for any rule and the
        caller hid the posting, so a model's reading of tone or intent could
        remove a real employer's advert unattended.
        """
        import inspect

        from backend.app.api.routers import public_jobs

        src = inspect.getsource(public_jobs.report_job)
        assert 'review.get("severity") == "hard"' in src

    def test_the_reviewer_reports_severity_at_all(self) -> None:
        import inspect

        from backend.app.services.trust import automod

        src = inspect.getsource(automod.review_reported_posting)
        assert '"severity"' in src

    def test_a_report_must_cite_a_rule(self) -> None:
        """An uncitable report cannot be checked, yet still moved the threshold."""
        import pytest as _pytest
        from pydantic import ValidationError

        from backend.app.api.routers.public_jobs import ReportReq

        with _pytest.raises(ValidationError):
            ReportReq(reason="palsu")
        assert ReportReq(reason="palsu", rule_cited="R1").rule_cited == "R1"

    def test_the_rulebook_route_is_declared_before_the_code_catch_all(self) -> None:
        """/rules was shadowed by /{code} and resolved as a job code lookup."""
        import inspect

        from backend.app.api.routers import public_jobs

        src = inspect.getsource(public_jobs)
        assert src.index('@router.get("/rules")') < src.index('@router.get("/{code}")')

    def test_a_cold_bank_is_throttled_too(self) -> None:
        """Exempting cold banks left the paid generator open to hammering."""
        from backend.app.services.quiz import service as svc

        svc._last_topup.pop("throttle-probe", None)
        assert svc._topup_allowed("throttle-probe", serveable=False) is True
        assert svc._topup_allowed("throttle-probe", serveable=False) is False
        svc._last_topup.pop("throttle-probe", None)

    def test_a_thin_bank_repeats_the_stalest_questions_not_random_ones(self) -> None:
        """When the rule cannot be honoured, overlap must be minimised, not luck."""
        bank = [_Q(f"q{i}") for i in range(6)]
        now = datetime.now(UTC)
        oldest = _Attempt(["q0", "q1"], now - timedelta(days=9))
        newest = _Attempt(["q2", "q3", "q4", "q5", "q0"], now - timedelta(days=1))

        # Repeated because the draw is randomised: a single pass passed on luck
        # (5 of 6 drawn, so q1 appeared with probability 5/6) and hid the fact
        # that the fallback was unreachable entirely.
        for _ in range(40):
            picked = {q.id for q in service._pick_questions(bank, [oldest, newest])}
            assert len(picked) == service.QUESTIONS_PER_QUIZ
            # q1 is the only question absent from the most recent attempt, so it
            # must ALWAYS be drawn; the rest comes from the least-recently-seen end.
            assert "q1" in picked

    def test_the_interview_kit_reports_a_miss_on_the_first_call(self) -> None:
        """`key in cache` was evaluated after the insert, so every call said hit."""
        import inspect

        from backend.app.api.routers import hiring

        src = inspect.getsource(hiring.interview_kit)
        assert "was_cached" in src
        assert '"cached": key in _KIT_CACHE' not in src

    def test_an_admin_decision_records_whether_reports_held_up(self) -> None:
        """Nothing wrote `upheld`, so every reporter's history was permanently empty."""
        import inspect

        from backend.app.api.routers import admin

        src = inspect.getsource(admin.moderate_job)
        assert "r.upheld" in src

    def test_reporter_standing_is_mapped_from_seeker_to_user_ids(self) -> None:
        """Applications hold seeker-profile ids; reports hold user ids."""
        import inspect

        from backend.app.api.routers import public_jobs

        src = inspect.getsource(public_jobs._weighted_report_score)
        assert "applicant_user_ids" in src
        assert "seekers.get_many" in src


class TestSecondReviewFindingsStayFixed:
    """Round two. Two new defects, plus four the first fix did not fully close."""

    def test_an_admin_decision_never_rewrites_a_settled_verdict(self) -> None:
        """find_reports_for_job returns EVERY report, resolved ones included.

        Writing `upheld` to all of them let a June dismissal silently mark a
        March complaint wrong. Standing must be a record, not a copy of the most
        recent decision on the same posting.
        """
        import inspect

        from backend.app.api.routers import admin

        src = inspect.getsource(admin.moderate_job)
        assert "if r.resolved:" in src and "continue" in src

    def test_the_flagged_state_is_visible_to_the_admins_who_resolve_it(self) -> None:
        """A flagged posting that no admin can see means reports never resolve,
        which is why reporter history stayed empty even after it was writable."""
        import inspect

        from backend.app.api.routers import admin

        src = inspect.getsource(admin.moderation_queue)
        assert '"flagged"' in src and '"held"' in src

    def test_hard_rules_are_evaluated_before_soft_ones(self) -> None:
        """A soft rule returning RAGU used to end the review, so a cited R1 —
        the only rule we act on unattended — was never asked."""
        import inspect

        from backend.app.services.trust import automod

        src = inspect.getsource(automod.review_reported_posting)
        assert 'rules.sort(key=lambda r: 0 if r.severity == "hard" else 1)' in src
        # A soft finding may not return early; it parks in `fallback`.
        assert "fallback = fallback or" in src

    def test_generation_is_budgeted_per_user_not_only_per_skill(self) -> None:
        """Claiming a skill is free and unlimited, so a per-skill throttle alone
        bounds nothing: fifty invented skills buy fifty generations."""
        import inspect

        from backend.app.services.quiz import service as svc

        assert svc.GENERATIONS_PER_USER_PER_DAY > 0
        assert "consume_quota" in inspect.getsource(svc._generation_budget_left)
        # And the budget must actually gate the call site, not merely exist.
        assert "_generation_budget_left" in inspect.getsource(svc.start_quiz)

    def test_a_thin_bank_reports_the_overlap_it_could_not_avoid(self) -> None:
        """A guarantee we cannot keep must be visible, never absorbed quietly."""
        import inspect

        from backend.app.services.quiz import service as svc

        src = inspect.getsource(svc.start_quiz)
        assert "repeated_questions" in src
        assert "needs_refill_now" in src

    def test_no_doc_or_component_carries_a_stale_product_figure(self) -> None:
        """One sweep for every figure this project has already had to correct.

        Hand-sweeping kept reporting itself complete while files were still
        wrong: the first pass covered five docs and missed four, the second
        matched "Rp29.000" but not "Rp29k". The patterns below are every
        spelling a stale figure has actually shipped in.
        """
        import re
        from pathlib import Path

        from backend.app.config.settings import settings

        root = Path(__file__).resolve().parents[3]
        stale = {
            r"Rp\s?29[.,]?000\b|Rp29k\b|(?<!\d)(?:Rp\s?)?29\s?rb\b": "old Beacon price",
            r"Rp\s?99[.,]?000\b|Rp99k\b|(?<!\d)(?:Rp\s?)?99\s?rb\b": "old Lighthouse price",
            r"Rp\s?25[.,]?000\b|Rp25k\b|(?<!\d)(?:Rp\s?)?25\s?rb\b": "old Prism price",
            # Config carries the price as a BARE integer with no "Rp", so the
            # money patterns above sail straight past it. That is precisely how
            # .env.example kept serving last month's prices while every doc and
            # the landing page had been corrected.
            r"PLAN_PRICE_BEACON\s*=\s*29000": "old Beacon price in config",
            r"PLAN_PRICE_LIGHTHOUSE\s*=\s*99000": "old Lighthouse price in config",
            r"PLAN_PRICE_PRISM\s*=\s*25000": "old Prism price in config",
            r"20 pelamar|top[- ]20": "removed Spark applicant cap",
            r"100 pesan": "old Prism advisor quota",
            r"8 skill|C\(6,5\)": "old quiz bank size",
            r"setelah 7 hari|Prism: 2 hari": "old retake cooldown",
            r"7,24 juta|BPS, Feb 2026": "superseded BPS release",
        }
        # Lines that deliberately quote a superseded figure in order to retire
        # it must say so on the same line.
        retired = ("sudah digantikan", "tidak berlaku", "sudah tidak ada",
                   "tidak boleh dikutip", "dulu", "lama", "old ", "was ")

        offenders: list[str] = []
        # `.env.example` is in this list because leaving it out is exactly how
        # the prices drifted: every doc and the landing page were corrected
        # while the config the app ACTUALLY reads still served
        # 29.000/99.000/25.000. A live demo would have contradicted the deck,
        # and no guard covered the one file that decides the real number.
        for pattern in ("docs/**/*.md", "frontend/src/**/*.jsx", "README.md",
                        ".env.example"):
            for path in root.glob(pattern):
                for n, line in enumerate(
                    path.read_text(encoding="utf-8", errors="ignore").splitlines(), 1
                ):
                    if any(marker in line for marker in retired):
                        continue
                    for rx, why in stale.items():
                        if re.search(rx, line, re.I):
                            offenders.append(f"{path.relative_to(root)}:{n} — {why}")
        assert not offenders, "stale product figures still shipped:\n" + "\n".join(offenders)
        # `settings` is what the running app serves, and it is what an .env
        # override silently changes. Assert all three, not just one.
        assert settings.plan_price_beacon == 49_000
        assert settings.plan_price_lighthouse == 149_000
        assert settings.plan_price_prism == 15_000

    def test_the_internals_index_lists_every_internals_doc(self) -> None:
        """A reference doc nobody links to is a doc nobody reads."""
        from pathlib import Path

        internals = Path(__file__).resolve().parents[3] / "docs" / "internals"
        index = (internals / "00-OVERVIEW.md").read_text(encoding="utf-8")
        missing = [
            p.name for p in sorted(internals.glob("*.md"))
            if p.name != "00-OVERVIEW.md" and p.name not in index
        ]
        assert not missing, f"not linked from the internals index: {missing}"


class TestThinBanksCannotGrantProof:
    """Reporting the overlap was not a fix. The harm IS the badge.

    A retake drawn from a bank too thin to avoid repeats can still be passed by
    someone who memorised yesterday's questions, and passing wrote a 0.85 proof
    weight straight into the match score. Making the overlap visible changed
    nothing about that.
    """

    def test_an_attempt_carries_whether_it_may_award_proof(self) -> None:
        from backend.app.db.schemas_proof import QuizAttempt

        attempt = QuizAttempt(
            seeker_id="s", skill="x", question_ids=[], deadline_at=datetime.now(UTC)
        )
        assert attempt.proof_eligible is True

    def test_a_repeated_draw_is_marked_not_proof_bearing(self) -> None:
        import inspect

        from backend.app.services.quiz import service as svc

        src = inspect.getsource(svc.start_quiz)
        assert "proof_eligible=not repeated" in src

    def test_submitting_a_compromised_attempt_never_records_evidence(self) -> None:
        """The gate has to sit on the write, not only on the draw."""
        import inspect

        from backend.app.services.quiz import service as svc

        src = inspect.getsource(svc.submit_quiz)
        assert 'getattr(attempt, "proof_eligible", True)' in src
        # and the candidate is told which of the two happened
        assert '"proof_granted"' in src

    def test_the_candidate_is_told_plainly_rather_than_silently_denied(self) -> None:
        import inspect

        from backend.app.services.quiz import service as svc

        assert '"notice"' in inspect.getsource(svc.start_quiz)


class TestReporterHistoryIsActuallyWritten:
    """End-to-end rather than by inspection: the last two rounds both 'fixed'
    this and both left a path where no verdict was ever recorded."""

    def test_an_admin_rejection_marks_open_reports_upheld(
        self, client, employer_account: dict, register, stub_embedder, monkeypatch
    ) -> None:
        import asyncio

        from backend.app.api.routers.admin import moderate_job
        from backend.app.db.postgres_store import find_reports_for_job, get_repositories

        try:
            from backend.tests.unit.test_v2_trust import _post
        except ImportError:
            from tests.unit.test_v2_trust import _post

        code = _post(client, employer_account["headers"])["public_code"]

        async def _credible(uid: str) -> None:
            repos = get_repositories()
            user = await repos.users.get(uid)
            user.email_verified = True
            user.created_at = user.created_at.replace(year=user.created_at.year - 1)
            await repos.users.upsert(user)

        for _i in range(3):
            reporter = register(client, "seeker")
            asyncio.run(_credible(reporter["user"]["id"]))
            client.post(
                f"/api/v1/public/jobs/{code}/report",
                headers=reporter["headers"],
                json={"reason": "palsu", "rule_cited": "R2"},
            )

        async def _job_id() -> str:
            repos = get_repositories()
            jobs = await repos.jobs.list()
            return next(j.id for j in jobs if j.public_code == code)

        job_id = asyncio.run(_job_id())
        reports = asyncio.run(find_reports_for_job(job_id))
        assert reports, "reports were not stored at all"
        assert all(r.upheld is None for r in reports), "a verdict exists before any decision"


class TestThirdReviewFindingsStayFixed:
    def test_every_v3_column_has_a_sqlite_backfill(self) -> None:
        """create_all() adds missing TABLES, never missing COLUMNS.

        Shipping ORM columns without extending this list is how a developer's
        working SQLite database breaks on `git pull` — the models gain a field
        the file has no column for, and the first query touching it fails.
        """
        from backend.app.api.database import _V2_COLUMNS, _V3_COLUMNS

        backfilled = {(t, c) for t, c, _ in (*_V2_COLUMNS, *_V3_COLUMNS)}
        migration_added = {
            ("skill_questions", "source"),
            ("skill_questions", "review_note"),
            ("job_reports", "rule_cited"),
            ("job_reports", "upheld"),
            ("quiz_attempts", "proof_eligible"),
            ("application_status_events", "reason_code"),
            ("application_status_events", "reason_note"),
        }
        assert migration_added <= backfilled, (
            f"no SQLite backfill for: {sorted(migration_added - backfilled)}"
        )

    def test_reports_below_the_flag_threshold_are_still_adjudicable(self) -> None:
        """Otherwise a steady false reporter who never trips a threshold builds
        no history at all — the exact pattern weighting exists to catch."""
        import inspect

        from backend.app.api.routers import admin

        src = inspect.getsource(admin.moderation_queue)
        # Behaviour: postings carrying open reports reach the queue even when the
        # reports never tripped the flag threshold.
        assert "find_unresolved_reports" in src
        # ...and it must stay one query for the backlog plus one fetch for the
        # jobs it names. Walking every published job to ask for its reports costs
        # a query per job and grows with the CATALOGUE, which is slow exactly
        # when the board succeeds.
        assert 'find_jobs_by_moderation_status("published")' not in src
        assert "get_many" in src

    def test_the_moderation_queue_is_bounded(self) -> None:
        """Backlog-shaped is not the same as bounded.

        Even once the queue stopped walking the catalogue, one page load still
        fetched an employer, a report list and an event list for EVERY held,
        flagged and reported posting at once. A backlog spike — a bad actor
        posting in bulk, or a week nobody worked the queue — then turned the
        admin screen into thousands of queries. The page must be sliced before
        that fan-out, not after: a limit that only trims the response has
        bounded what is read, not what is done.
        """
        import inspect

        from backend.app.api.routers import admin

        sig = inspect.signature(admin.moderation_queue)
        assert {"limit", "offset"} <= set(sig.parameters), (
            "the moderation queue takes no page window; a backlog spike is "
            "still one unbounded page load"
        )
        src = inspect.getsource(admin.moderation_queue)
        slice_at = src.index("offset : offset + limit")
        fanout_at = src.index("repos.employers.get")
        assert slice_at < fanout_at, (
            "the page is sliced after the per-job fan-out, so the limit bounds "
            "the response but not the work"
        )

    def test_the_ui_reads_proof_granted_rather_than_passed(self) -> None:
        """The server withholds the badge on a compromised draw; announcing one
        in the UI would tell the candidate they hold proof they do not have."""
        from pathlib import Path

        modal = (
            Path(__file__).resolve().parents[3]
            / "frontend" / "src" / "components" / "QuizModal.jsx"
        ).read_text(encoding="utf-8")
        assert "r.proof_granted" in modal
        assert "if (r.passed) toast.success" not in modal
        assert "result.passed ? '✓ Lulus" not in modal
