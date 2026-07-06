"""Tests for the route domain models."""

import pytest
from pydantic import ValidationError

from app.route.models import (
    Coordinate,
    LocationKind,
    LocationRef,
    RouteIntent,
    TravelMode,
    Waypoint,
    WaypointKind,
)


def test_route_intent_defaults() -> None:
    intent = RouteIntent(destination=LocationRef(kind=LocationKind.poi, label="Mall"))
    assert intent.origin is None
    assert intent.waypoints == []
    assert intent.mode is TravelMode.drive


def test_full_route_intent_round_trips_through_json() -> None:
    intent = RouteIntent(
        origin=LocationRef(kind=LocationKind.saved_place, label="home"),
        destination=LocationRef(
            kind=LocationKind.coordinate,
            coordinate=Coordinate(latitude=38.9, longitude=-77.0),
        ),
        waypoints=[
            Waypoint(
                location=LocationRef(kind=LocationKind.poi, label="Bethesda Row"),
                kind=WaypointKind.through,
            )
        ],
        mode=TravelMode.bicycle,
        raw_prompt="home to the mall via Bethesda by bike",
    )
    assert RouteIntent.model_validate_json(intent.model_dump_json()) == intent


def test_coordinate_rejects_out_of_range() -> None:
    with pytest.raises(ValidationError):
        Coordinate(latitude=91.0, longitude=0.0)
    with pytest.raises(ValidationError):
        Coordinate(latitude=0.0, longitude=-181.0)


def test_models_forbid_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        LocationRef(kind=LocationKind.poi, label="x", surprise="nope")  # type: ignore[call-arg]


def test_waypoint_kind_serializes_break_value() -> None:
    waypoint = Waypoint(location=LocationRef(kind=LocationKind.exit, label="Exit 26"))
    assert waypoint.kind is WaypointKind.break_
    assert waypoint.model_dump()["kind"] == "break"
