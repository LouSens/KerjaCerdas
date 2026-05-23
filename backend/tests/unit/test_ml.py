"""
KerjaCerdas — Unit Tests: ML Pipeline
=======================================
Tests for feature engineering and evaluation metrics.
"""
from __future__ import annotations

import importlib

import numpy as np
import pytest

# Import module with numeric prefix using importlib
_evaluate_module = importlib.import_module("src.ml.pipeline.05_evaluate")
precision_at_k = _evaluate_module.precision_at_k
recall_at_k = _evaluate_module.recall_at_k
ndcg_at_k = _evaluate_module.ndcg_at_k
mrr = _evaluate_module.mrr


class TestRankingMetrics:
    """Test ranking metric implementations."""

    def test_precision_at_k(self) -> None:
        """Precision@K should correctly count relevant results."""
        assert precision_at_k([True, True, False, True, False], k=5) == 0.6
        assert precision_at_k([True, True, True], k=3) == 1.0
        assert precision_at_k([False, False], k=2) == 0.0
        assert precision_at_k([], k=5) == 0.0

    def test_recall_at_k(self) -> None:
        """Recall@K should measure coverage of relevant items."""
        assert recall_at_k([True, True, False], total_relevant=4, k=3) == 0.5
        assert recall_at_k([True, True, True], total_relevant=3, k=3) == 1.0
        assert recall_at_k([], total_relevant=5, k=3) == 0.0

    def test_ndcg_at_k(self) -> None:
        """nDCG@K should handle perfect and imperfect rankings."""
        # Perfect ranking
        perfect = ndcg_at_k([3.0, 2.0, 1.0], k=3)
        assert perfect == 1.0

        # Non-zero for partial relevance
        partial = ndcg_at_k([1.0, 0.0, 2.0], k=3)
        assert 0.0 < partial < 1.0

        # Empty should return 0
        assert ndcg_at_k([], k=5) == 0.0

    def test_mrr(self) -> None:
        """MRR should return reciprocal of first relevant rank."""
        assert mrr([True, False, False]) == 1.0
        assert mrr([False, True, False]) == 0.5
        assert mrr([False, False, True]) == pytest.approx(1 / 3)
        assert mrr([False, False, False]) == 0.0


class TestSkillFeatures:
    """Test skill feature computation."""

    def test_skill_overlap_calculation(self) -> None:
        """Skill overlap should be correct as intersection/required."""
        from src.agents.matching_agent import MatchingAgent

        agent = MatchingAgent(demo_mode=True)
        assert agent._compute_skill_overlap(
            ["Python", "SQL"], ["python", "sql", "docker"]
        ) == pytest.approx(2 / 3)
        assert agent._compute_skill_overlap([], ["python"]) == 0.0
        assert agent._compute_skill_overlap(["Python"], []) == 0.0
