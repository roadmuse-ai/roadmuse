"""HTTP endpoint for route planning."""

from fastapi import APIRouter

from app.route.agent import parse_route_intent
from app.route.logic import resolve
from app.route.schemas import RoutePlanRequest, RoutePlanResponse

router = APIRouter(prefix="/api", tags=["route"])


@router.post("/route/plan")
async def plan_route(request: RoutePlanRequest) -> RoutePlanResponse:
    """Parse a free-text prompt into a resolved route intent.

    v0: parse the prompt with the RouteIntentAgent, then fill coordinates
    deterministically. No routing/scoring — the client builds the navigator link.
    """

    labels = [place.label for place in request.settings.saved_places]
    intent = await parse_route_intent(request.prompt, labels)
    resolved, warnings = resolve(intent, request)
    return RoutePlanResponse(interpreted_intent=resolved, warnings=warnings)
