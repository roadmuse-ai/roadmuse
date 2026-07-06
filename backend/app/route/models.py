"""Domain models for a parsed route intent.

A thin v0 slice of the design notes in ``docs/backend/`` — enough to turn a
free-text prompt into a routable trip the frontend can hand to a navigator.
Structured preferences and Valhalla-specific fields are deferred to later
versions (see ``docs/mvp-roadmap-v0.md``).
"""

from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class ApiModel(BaseModel):
    """Base model for all route schemas: strict, rejects unknown fields."""

    model_config = ConfigDict(extra="forbid")


class TravelMode(StrEnum):
    """How the user travels. Engine-neutral; mapped to Valhalla costing later."""

    drive = "drive"
    walk = "walk"
    bicycle = "bicycle"
    # future: transit / multimodal


class LocationKind(StrEnum):
    """What a ``LocationRef`` denotes; drives how it is resolved."""

    saved_place = "saved_place"
    address = "address"
    poi = "poi"
    exit = "exit"
    route_feature = "route_feature"
    coordinate = "coordinate"


class WaypointKind(StrEnum):
    """Whether a waypoint is a real stop or only shapes the route."""

    break_ = "break"  # a real stop (Valhalla `break`)
    through = "through"  # pass-through shaping point (Valhalla `through`/`via`)


class Coordinate(ApiModel):
    """A resolved latitude/longitude. Field names match the SPA wire contract."""

    latitude: float = Field(ge=-90.0, le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)


class LocationRef(ApiModel):
    """A referenced place, spanning vague ("home") to resolved (lat/lon)."""

    kind: LocationKind
    label: str | None = None  # human/searchable text; also a navigator `q=`
    coordinate: Coordinate | None = None  # filled once resolved
    saved_place_id: str | None = None  # set when matched to a saved place
    is_resolved: bool = False
    is_ambiguous: bool = False


class Waypoint(ApiModel):
    """A stop or shaping point along the route."""

    location: LocationRef
    kind: WaypointKind = WaypointKind.break_


class RouteIntent(ApiModel):
    """The structured, machine-readable form of what the user asked for."""

    origin: LocationRef | None = None  # None -> "current location"
    destination: LocationRef
    waypoints: list[Waypoint] = Field(default_factory=list)
    mode: TravelMode = TravelMode.drive
    raw_prompt: str | None = None
