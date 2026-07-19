"""Tests for the POST /api/route/plan endpoint.

The RouteIntentAgent is overridden with Pydantic AI's TestModel so these run
offline and deterministically — no Anthropic API calls.
"""

from fastapi.testclient import TestClient
from pydantic_ai.models.test import TestModel

from app.config import Settings
from app.main import create_app
from app.route.agent import route_intent_agent
from app.route.models import LocationKind, LocationRef, RouteIntent

client = TestClient(create_app(Settings(environment="test")))


def test_plan_route_resolves_origin_from_current_location() -> None:
    """With no stated origin, the endpoint fills it from the request's current_location."""

    intent = RouteIntent(destination=LocationRef(kind=LocationKind.poi, label="National Mall"))
    with route_intent_agent.override(model=TestModel(custom_output_args=intent)):
        response = client.post(
            "/api/route/plan",
            json={
                "prompt": "take me to the National Mall",
                "current_location": {"latitude": 39.0, "longitude": -77.1},
                "settings": {"saved_places": []},
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["warnings"] == []
    origin = body["interpreted_intent"]["origin"]
    assert origin["coordinate"] == {"latitude": 39.0, "longitude": -77.1}
    assert body["interpreted_intent"]["destination"]["label"] == "National Mall"


def test_plan_route_resolves_saved_place() -> None:
    """A saved-place label resolves to that place's id and coordinate in the response."""

    intent = RouteIntent(
        origin=LocationRef(kind=LocationKind.saved_place, label="home"),
        destination=LocationRef(kind=LocationKind.poi, label="Mall"),
    )
    with route_intent_agent.override(model=TestModel(custom_output_args=intent)):
        response = client.post(
            "/api/route/plan",
            json={
                "prompt": "from home to the mall",
                "settings": {
                    "saved_places": [
                        {"id": "h", "label": "home", "latitude": 38.9, "longitude": -77.0}
                    ]
                },
            },
        )

    assert response.status_code == 200
    origin = response.json()["interpreted_intent"]["origin"]
    assert origin["saved_place_id"] == "h"
    assert origin["coordinate"] == {"latitude": 38.9, "longitude": -77.0}


def test_plan_route_rejects_malformed_body() -> None:
    """A body missing the required prompt is rejected with 422 before any agent call."""

    assert client.post("/api/route/plan", json={"nope": 1}).status_code == 422


def test_plan_route_defaults_settings() -> None:
    """`settings` is optional: a prompt-only body still plans a route."""

    intent = RouteIntent(
        origin=LocationRef(
            kind=LocationKind.coordinate,
            coordinate={"latitude": 1.0, "longitude": 2.0},  # type: ignore[arg-type]
        ),
        destination=LocationRef(kind=LocationKind.poi, label="Mall"),
    )
    with route_intent_agent.override(model=TestModel(custom_output_args=intent)):
        response = client.post("/api/route/plan", json={"prompt": "go to the mall"})

    assert response.status_code == 200
