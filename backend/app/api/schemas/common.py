"""Shared field types for API request models.

The routers used to take bare `dict` bodies and hand-coerce every field, which
meant a client typo surfaced as a 500 rather than a 422. These annotated types
keep the leniency those hand-written coercions had — a single skill sent as a
bare string, a number sent as `""` — while pushing every other malformed value
back to the client as a validation error.
"""

from __future__ import annotations

from typing import Annotated, Any

from pydantic import BeforeValidator


def _coerce_str_list(value: Any) -> Any:
    """Accept a bare string where a list of strings is expected.

    Sending `"Python"` instead of `["Python"]` is a common client mistake and
    was previously tolerated, so keep tolerating it. Anything else is left
    untouched for Pydantic to reject with a proper 422.
    """
    if value is None:
        return []
    if isinstance(value, str):
        stripped = value.strip()
        return [stripped] if stripped else []
    return value


def _coerce_optional_int(value: Any) -> Any:
    """Treat an empty string as "not provided" rather than a parse error.

    HTML forms submit cleared number inputs as `""`; the previous hand-rolled
    `_as_int` mapped that to the default, so preserve it.
    """
    if value == "":
        return 0
    return value


StrList = Annotated[list[str], BeforeValidator(_coerce_str_list)]
LenientInt = Annotated[int, BeforeValidator(_coerce_optional_int)]
