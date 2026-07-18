"""Automated Evals Framework (Stub/Demo).

This script simulates an "LLM-as-a-judge" or regression test pipeline.
It reads test cases from `test_cases.jsonl`, passes them to our Agent Router,
and evaluates if the intent and keywords match our expectations.

Run locally: python -m backend.app.evals.evaluate_stub
"""
import asyncio
import json
import logging
from pathlib import Path

# We import the actual intent router to test its logic
from backend.app.agents.graph.nodes import route_intent
from backend.app.agents.graph.state import AgentState

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

EVALS_DIR = Path(__file__).resolve().parent
TEST_CASES_FILE = EVALS_DIR / "test_cases.jsonl"


async def run_evaluation():
    logger.info("=== 🚀 Starting KerjaCerdas Evals Framework ===")

    if not TEST_CASES_FILE.exists():
        logger.error(f"Test cases file not found at {TEST_CASES_FILE}")
        return

    passed_count = 0
    failed_count = 0

    with open(TEST_CASES_FILE, encoding="utf-8") as f:
        cases = [json.loads(line) for line in f if line.strip()]

    logger.info(f"Loaded {len(cases)} test cases from {TEST_CASES_FILE.name}")
    logger.info("-" * 50)

    for i, case in enumerate(cases, 1):
        test_input = case.get("input", "")
        expected_intent = case.get("expected_intent", "")

        logger.info(f"Test [{i}/{len(cases)}]: '{test_input}'")

        # 1. Setup mock state
        state = AgentState(user_message=test_input, intent="", candidate_jobs=[])

        # 2. Run the actual agent router logic
        try:
            result = await route_intent(state)
            actual_intent = result.get("intent", "UNKNOWN")
            reasoning = result.get("reasoning", "None")
        except Exception as e:
            logger.error(f"  ❌ Agent crash: {e}")
            failed_count += 1
            continue

        # 3. Evaluate assertions
        if actual_intent == expected_intent:
            logger.info(f"  ✅ PASS (Intent: {actual_intent}) | Reason: {reasoning}")
            passed_count += 1
        else:
            logger.warning(f"  ❌ FAIL | Expected: {expected_intent}, Got: {actual_intent} | Reason: {reasoning}")
            failed_count += 1

    # Print Summary
    logger.info("-" * 50)
    logger.info("=== 📊 Evals Summary ===")
    logger.info(f"Total Tests : {len(cases)}")
    logger.info(f"Passed      : {passed_count}")
    logger.info(f"Failed      : {failed_count}")

    accuracy = (passed_count / len(cases)) * 100 if cases else 0
    logger.info(f"Accuracy    : {accuracy:.1f}%")

    if accuracy >= 80:
        logger.info("✅ Regression Test passed. The Agent is stable and ready for production deployment.")
    else:
        logger.warning("⚠️ Regression Test failed. Please tune the prompt engineering in `prompts/`.")

if __name__ == "__main__":
    asyncio.run(run_evaluation())
