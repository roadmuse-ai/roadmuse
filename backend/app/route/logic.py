"""Deterministic resolution of a parsed RouteIntent.

The LLM produces place labels; this fills coordinates from data already in the
request (current GPS for the origin, saved-place labels for known places). No
geocoding yet: any unmatched place stays label-only and the navigator resolves it.
"""

from app.route.models import Coordinate, LocationKind, LocationRef, RouteIntent
from app.route.schemas import RoutePlanRequest, SavedPlaceInput


def _resolve_location(location: LocationRef, saved_by_label: dict[str, SavedPlaceInput]) -> None:
    """Fill a location's coordinate from a matching saved place, in place."""

    if location.coordinate is not None:
        location.is_resolved = True
        return
    if location.label is None:
        return
    saved = saved_by_label.get(location.label.strip().lower())
    if saved is None:
        return
    location.saved_place_id = saved.id
    location.kind = LocationKind.saved_place
    if saved.latitude is not None and saved.longitude is not None:
        location.coordinate = Coordinate(latitude=saved.latitude, longitude=saved.longitude)
        location.is_resolved = True
    elif saved.address:
        location.label = saved.address


def resolve(intent: RouteIntent, request: RoutePlanRequest) -> tuple[RouteIntent, list[str]]:
    """Resolve origin/destination/waypoints; return the filled intent + warnings."""

    resolved = intent.model_copy(deep=True)
    warnings: list[str] = []
    saved_by_label = {
        place.label.strip().lower(): place for place in request.settings.saved_places if place.label
    }

    if resolved.origin is None:
        if request.current_location is not None:
            resolved.origin = LocationRef(
                kind=LocationKind.coordinate,
                coordinate=request.current_location,
                is_resolved=True,
            )
        else:
            warnings.append(
                "No origin given and no current location available; "
                "the navigator will start from the device's location."
            )

    if resolved.origin is not None:
        _resolve_location(resolved.origin, saved_by_label)
    _resolve_location(resolved.destination, saved_by_label)
    for waypoint in resolved.waypoints:
        _resolve_location(waypoint.location, saved_by_label)

    return resolved, warnings
