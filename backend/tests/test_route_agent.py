"""Tests for RouteIntentAgent wiring (no live LLM call)."""

import asyncio

import pytest

from app.config import Settings
from app.route import agent as agent_module
from app.route.agent import parse_route_intent
from app.route.models import LocationKind, LocationRef, RouteIntent


class _Result:
    def __init__(self, output: RouteIntent) -> None:
        self.output = output


def test_parse_route_intent_passes_configured_provider_model(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The `provider:model` string from settings reaches agent.run unchanged."""

    intent = RouteIntent(destination=LocationRef(kind=LocationKind.poi, label="Mall"))
    captured: dict[str, str] = {}

    async def _fake_run(_input: str, *, model: str) -> _Result:
        captured["model"] = model
        return _Result(intent)

    monkeypatch.setattr(
        agent_module, "get_settings", lambda: Settings(route_agent_model="openai:gpt-5")
    )
    monkeypatch.setattr(agent_module.route_intent_agent, "run", _fake_run)

    result = asyncio.run(parse_route_intent("go to the mall", []))

    assert result is intent
    assert captured["model"] == "openai:gpt-5"
