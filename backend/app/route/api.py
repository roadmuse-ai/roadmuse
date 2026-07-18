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

    The complete pipeline is:
    prompt
      -> agent.py           CANDIDATES: parse text -> RouteIntent (labels, mode)
                            - generate a candidate route for the user request
                            - later we extend it to generate multiple candidate routes which
                              we will pass to the Valhalla/scoring/shaping steps (see below)
      -> candidate routes, for each:
         | -> logic.py      RESOLUTION: labels -> coordinates and warnings
         |                  - from the request: `request.current_location` for the origin
         |                  - from settings: known coordinates for saved places
         |                  - using geocoding service: the LocationResolver
         |                    (address/POI -> coordinates) to be added later.
         |                  - return warnings for any unresolved places (currently only for
         |                    the origin)
         | -> Valhalla      VALIDATE AND MEASURE: validate and measure LLM candidates
         |    |             - `RouteIntent` -> route with ETA, cost, geometry.
         |    | -> routing  ROUTING: [RouteIntent]s -> route(s), ETA, geometry
      -> scoring            SCORING: candidates -> scoring -> best candidate
                            - score based on ETA, cost, geometry (Valhalla data) and
                              user preferences (avoid tolls, avoid highways, etc.)
      -> shaping            SHAPING: add "through" waypoints -> final route
                            - based on Valhalla data for the best route, add "through"
                              waypoints to the list of waypoints
      -> response

    See the [docs/backend-api-structure.md#high-level-backend-logic] for more details.
    """

    labels = [place.label for place in request.settings.saved_places]
    intent = await parse_route_intent(request.prompt, labels)
    resolved, warnings = resolve(intent, request)
    return RoutePlanResponse(interpreted_intent=resolved, warnings=warnings)
