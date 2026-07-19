"""Tests for deterministic route resolution."""

from app.route.location_resolution import resolve
from app.route.models import Coordinate, LocationKind, LocationRef, RouteIntent, Waypoint
from app.route.schemas import RoutePlanRequest, RoutePlanSettings, SavedPlaceInput


def _request(
    *,
    current_location: Coordinate | None = None,
    saved_places: list[SavedPlaceInput] | None = None,
) -> RoutePlanRequest:
    return RoutePlanRequest(
        prompt="anything",
        current_location=current_location,
        settings=RoutePlanSettings(saved_places=saved_places or []),
    )


def test_origin_filled_from_current_location() -> None:
    intent = RouteIntent(destination=LocationRef(kind=LocationKind.poi, label="Mall"))
    here = Coordinate(latitude=39.0, longitude=-77.1)

    resolved, warnings = resolve(intent, _request(current_location=here))

    assert resolved.origin is not None
    assert resolved.origin.kind is LocationKind.coordinate
    assert resolved.origin.coordinate == here
    assert resolved.origin.is_resolved is True
    assert warnings == []


def test_saved_place_label_is_resolved_to_coordinate() -> None:
    intent = RouteIntent(
        origin=LocationRef(kind=LocationKind.saved_place, label="Home"),
        destination=LocationRef(kind=LocationKind.poi, label="Mall"),
    )
    home = SavedPlaceInput(id="h", label="home", latitude=38.9, longitude=-77.0)

    resolved, _ = resolve(intent, _request(saved_places=[home]))

    assert resolved.origin is not None
    assert resolved.origin.saved_place_id == "h"
    assert resolved.origin.kind is LocationKind.saved_place
    assert resolved.origin.coordinate == Coordinate(latitude=38.9, longitude=-77.0)
    assert resolved.origin.is_resolved is True


def test_saved_place_without_coordinates_falls_back_to_address() -> None:
    intent = RouteIntent(
        origin=LocationRef(kind=LocationKind.saved_place, label="work"),
        destination=LocationRef(kind=LocationKind.poi, label="Mall"),
    )
    work = SavedPlaceInput(id="w", label="work", address="123 Office Rd")

    resolved, _ = resolve(intent, _request(saved_places=[work]))

    assert resolved.origin is not None
    assert resolved.origin.saved_place_id == "w"
    assert resolved.origin.coordinate is None
    assert resolved.origin.label == "123 Office Rd"


def test_unmatched_label_stays_label_only() -> None:
    intent = RouteIntent(
        origin=LocationRef(
            kind=LocationKind.coordinate,
            coordinate=Coordinate(latitude=1.0, longitude=2.0),
        ),
        destination=LocationRef(kind=LocationKind.poi, label="a place with no saved match"),
        waypoints=[Waypoint(location=LocationRef(kind=LocationKind.poi, label="coffee"))],
    )

    resolved, _ = resolve(intent, _request())

    assert resolved.destination.coordinate is None
    assert resolved.destination.is_resolved is False
    assert resolved.waypoints[0].location.coordinate is None


def test_missing_origin_and_location_produces_warning() -> None:
    intent = RouteIntent(destination=LocationRef(kind=LocationKind.poi, label="Mall"))

    resolved, warnings = resolve(intent, _request())

    assert resolved.origin is None
    assert len(warnings) == 1
    assert "current location" in warnings[0]


def test_resolve_does_not_mutate_the_input_intent() -> None:
    intent = RouteIntent(destination=LocationRef(kind=LocationKind.poi, label="Mall"))
    here = Coordinate(latitude=39.0, longitude=-77.1)

    resolve(intent, _request(current_location=here))

    assert intent.origin is None  # original untouched
