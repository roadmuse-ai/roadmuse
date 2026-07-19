"""Request/response schemas for the /api/route/plan endpoint."""

from pydantic import Field

from app.route.models import ApiModel, Coordinate, RouteIntent


class SavedPlaceInput(ApiModel):
    """A saved place from the SPA, used to resolve labels like "home"/"work".

    Note: a v0 subset of the SPA ``SavedPlace`` (``spa/src/data/settings.ts``),
    we only have the fields needed to resolve a label to coordinates.
    """

    id: str
    label: str
    address: str | None = None
    latitude: float | None = Field(default=None, ge=-90.0, le=90.0)
    longitude: float | None = Field(default=None, ge=-180.0, le=180.0)


class RoutePlanSettings(ApiModel):
    """User settings relevant to planning a route (v0: saved places only)."""

    saved_places: list[SavedPlaceInput] = Field(default_factory=list)


class RoutePlanRequest(ApiModel):
    """Body of POST /api/route/plan."""

    prompt: str
    current_location: Coordinate | None = None
    settings: RoutePlanSettings = Field(default_factory=RoutePlanSettings)


class RoutePlanResponse(ApiModel):
    """Response of POST /api/route/plan.

    Note: a thin v0 version: the parsed intent plus any warnings.
    Later versions extend this with scored options
    (see ``docs/backend/RoutePlanResponse.md``).
    """

    interpreted_intent: RouteIntent
    warnings: list[str] = Field(default_factory=list)
