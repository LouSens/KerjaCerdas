"""Tests for content_to_text — normalizing LLM message content shapes."""

from backend.app.utils import content_to_text


def test_plain_string_passthrough():
    assert content_to_text("halo") == "halo"


def test_none_returns_empty():
    assert content_to_text(None) == ""


def test_list_of_text_dicts():
    parts = [{"type": "text", "text": "Halo "}, {"type": "text", "text": "dunia"}]
    assert content_to_text(parts) == "Halo dunia"


def test_list_with_plain_strings():
    assert content_to_text(["a", "b"]) == "ab"


def test_mixed_blocks_skip_non_text():
    parts = [
        {"type": "text", "text": "ok"},
        {"type": "thinking", "thinking": "hidden"},
        {"type": "tool_use", "id": "x"},
        {"type": "text", "text": None},  # None text coerced safely
    ]
    assert content_to_text(parts) == "ok"


def test_unexpected_object_coerced_to_str():
    assert content_to_text(123) == "123"


def test_empty_list():
    assert content_to_text([]) == ""
