import os
from typing import Any


def generate_ai_plan(prompt: str) -> dict[str, Any]:
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    if not api_key:
        return {
            "provider": "openai",
            "model": model,
            "generated": False,
            "reason": "openai_api_key_missing",
            "plan": None,
        }

    # Real API execution is intentionally isolated here so route logic stays testable.
    return {
        "provider": "openai",
        "model": model,
        "generated": False,
        "reason": "openai_call_not_enabled_yet",
        "plan": None,
        "promptPreview": prompt[:240],
    }
