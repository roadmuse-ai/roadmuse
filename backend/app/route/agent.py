"""RouteIntentAgent: parse a free-text prompt into a structured RouteIntent.

Per the design principle (``docs/ai-agent-build-guide.md``): the LLM parses the
prompt into place labels and a travel mode; it does not produce coordinates.
Deterministic code (``app.route.logic``) fills coordinates afterward.
"""

import os

from pydantic_ai import Agent

from app.config import Settings
from app.route.models import RouteIntent

SYSTEM_PROMPT = """\
You extract a structured route request from a user's free-text prompt.

Fill the RouteIntent:
- destination: the place the user wants to end at (required).
- origin: the starting place, or leave null if the user did not state one
  (null means "start from the user's current location").
- waypoints: intermediate stops or via-points, in order. Use kind "break" for a
  real stop the user gets out at, "through" for a point that only shapes the route.
- mode: drive, walk, or bicycle (default drive).

For each place, set `label` to the exact phrase the user used (e.g. "home",
"the National Mall", "Bethesda Row") and choose the best `kind`:
- saved_place for a place in the user's known saved places (listed below, if any),
- poi for a named place or category ("gas station", "the National Mall"),
- address for a street address, exit for a highway exit, coordinate only if the
  user gave raw lat/lon.

Do NOT include the same place twice.

Use real, existing places, but do NOT invent coordinates — leave `coordinate` null.
Deterministic code resolves locations afterward. Set `raw_prompt` to the user's original text.
"""

route_intent_agent: Agent[None, RouteIntent] = Agent(
    output_type=RouteIntent,
    system_prompt=SYSTEM_PROMPT,
)


def _build_input(prompt: str, saved_place_labels: list[str]) -> str:
    """Compose the agent input, surfacing the user's saved-place labels."""

    if not saved_place_labels:
        return prompt
    known = ", ".join(saved_place_labels)
    return f"Known saved places: {known}\n\nRequest: {prompt}"


def set_env_from_settings(settings: Settings) -> None:
    """Set the provider API keys in the process environment from Settings.

    Pydantic AI reads the provider keys from the standard env vars, so we set them
    here from our Settings.

    Each model has its own key, see pydantic AI docs for details:
    - https://pydantic.dev/docs/ai/models/openai/
    - https://pydantic.dev/docs/ai/models/anthropic/
    - https://pydantic.dev/docs/ai/models/google/
    """

    if settings.anthropic_api_key:
        os.environ["ANTHROPIC_API_KEY"] = settings.anthropic_api_key
    if settings.openai_api_key:
        os.environ["OPENAI_API_KEY"] = settings.openai_api_key
    if settings.google_api_key:
        os.environ["GOOGLE_API_KEY"] = settings.google_api_key


async def parse_route_intent(
    prompt: str, saved_place_labels: list[str], settings: Settings
) -> RouteIntent:
    """Run the agent to parse a prompt into a RouteIntent."""

    set_env_from_settings(settings)
    result = await route_intent_agent.run(
        _build_input(prompt, saved_place_labels), model=settings.route_agent_model
    )
    return result.output
