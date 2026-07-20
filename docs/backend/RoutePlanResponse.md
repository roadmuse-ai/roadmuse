# RoutePlanResponse model

## Overview

**`RoutePlanResponse` = the answer sheet.** It echoes the interpreted intent, provides scored route options (each a set of legs with ETAs and navigator links), explains the choice in plain language, and warns about provider limitations.

## What `RoutePlanResponse` is for

`RoutePlanResponse` is the final answer the backend sends back to the app after it has planned a route. The [RouteIntent](./RouteIntent.md) is "what the user asked for," the `RoutePlanResponse` is "here's what we came up with, why, and how to actually drive it."

It's the payload that powers the main result screen in the app and, ultimately, the "Open in your navigator" buttons.

It is built by deterministic code: candidate generation -> scoring -> URL/warning building (see the [main flow in the architecture.md](../architecture.md#main-flow)) and never by the LLM directly (the LLM only contributes the *explanation text*, per the parse/explain split).

## Model structure

The model structure is defined according to descriptions in design documents, relevant parts of the documents are quoted below.

The main flow (see [architecture.md](../architecture.md#main-flow)):

> ### Main Flow
>
> 1. User speaks or types prompt.
> ...
> 4. Backend resolves **locations and preferences.**
> ...
> 6. Backend **scores candidates.**
> 7. Backend **builds navigator URLs and warnings.**
> 8. PWA shows result and opens selected provider.
> ...

The core backend services description (see [architecture.md](../architecture.md#core-backend-services)):

> ## Core Backend Services
>
> - `LocationResolver`: **resolves saved places, addresses, POIs, exits, and route features.**
> - `RouteCandidateGenerator`: creates **baseline and preference-shaped candidates.**
> - `RouteScorer`: picks the **best route according to time, preference satisfaction, and provider support.**
> - `NavigatorUrlBuilder`: creates **links for Google Maps, Waze, Apple Maps, HERE WeGo, Organic Maps, or GPX.**

The result-screen requirements (see [requirements.md](../requirements.md#main-screen)):

> ### Main Screen
> ...
> - **Route interpretation summary.**
> - **Applied preferences summary.**
> - **Warnings for provider limitations.**
> - One primary **“Open in preferred navigator” action.**
> - Secondary **“Open in another navigator” actions.**

The "important guardrail" (see [ai-agent-build-guide.md](../ai-agent-build-guide.md#important-guardrail)):

> Do not claim external navigators will preserve exact Valhalla route geometry unless using GPX or a provider explicitly supports the required behavior. Prefer warnings over fake certainty.

The "Provider Recommendation Rules" (see [external-navigator-support.md](../external-navigator-support.md#provider-recommendation-rules)):

> | Route Complexity | Recommended Provider |
> |---|---|
> | Simple destination | User’s preferred provider |
> | Avoid tolls/highways/ferries | Google Maps or Waze |
> | One to three waypoints | Google Maps |
> | More than three waypoints | HERE WeGo or Organic Maps |
> | Exact Valhalla geometry desired | GPX export |
> | Traffic-first driving | Waze |
> | Privacy/offline preference | Organic Maps or GPX |

Model fields:

```pseudocode
model RoutePlanResponse:
    # Echo back what we parsed, so the UI can show "here's what I understood"
    interpreted_intent: RouteIntent
    # The route choices: baseline, preference-shaped, alternative (mentioned in problem-solution.md and architecture.md)
    options: RouteOption[]
    # Which preferences we actually honored (and how) (mentioned in requirements.md)
    applied_preferences: RoutePreference[]
    # Provider-limitation notices ("Waze can't preserve exact geometry")
    warnings: ProviderWarning[]
    # Which navigator we suggest for this plan
    recommended_navigator: NavigatorProvider
    # The natural-language "why this route" narration (see use-case 9 in use-cases.md)
    explanation: str | None
```

### Nested objects

The RoutePlanResponse contains several more nested models.

The list of options is represented by `RouteOption`, each option contains:

- **`legs`** — `RouteLeg[]`. Multi-leg plans are explicit: park-then-walk (use-case 12), park-and-ride (use-case 13). Each leg has its own **mode** (drive leg + walk leg).
- **`eta` / `distance`** and **`eta_delta_vs_baseline`** — the result screen and explanation card compare against the baseline ("this saves/costs you N minutes" — use-case 9).
- **`navigator_links`** — per-provider deep links + GPX. A primary "open in preferred navigator" action plus secondary alternatives. Waze `q=/ll=`, HERE slash-waypoints, Organic Maps v2, etc. (see [external-navigator-support.md](../external-navigator-support.md))
- **`stops` / POIs** — for smart-stop plans, the candidate stops added along the route, scored by detour/category/hours/ratings (use-case 14, 15).
- **`kind`** — baseline vs preference-shaped vs alternative, so the UI can label them.

### Important concept for this schema

The [ai-agent-build-guide.md](../ai-agent-build-guide.md) says:

> **"Prefer warnings over fake certainty."**

So we must never imply a navigator will preserve exact route geometry unless GPX or explicit support exists. That's *why* `warnings` is a first-class, always-present field (a `list`, defaulting to empty). The schema should make it easy to attach a limitation to either the whole response or a specific option/link.

### Discussion: Lean vs rich RoutePlanResponse implementation

`RoutePlanResponse` can be:

1. **Lean** — `interpreted_intent`, a list of `options` with basic `eta`/`legs`, `warnings`, `explanation`.
  * Enough to be a real contract; leave `navigator_links`, POI scoring, and GPX as `Optional`/later-populated fields, since those are Phase 4-5 tickets (#20-25, #14-15).
2. **Rich** — model `RouteLeg`, `NavigatorLink`, `ProviderWarning`, `Poi`, GPX fields in full.

Recommendation: **lean (option 1)** — `RoutePlanResponse` and `RouteOption` as real types with the fields the result screen needs, but the deep provider/POI detail to be implemented later (issues #14-#25).

## Models in code (lean)

```python
from enum import Enum
from pydantic import BaseModel, Field


class RouteOptionKind(str, Enum):
    baseline = "baseline"
    preference_shaped = "preference-shaped"
    alternative = "alternative"


class NavigatorProvider(str, Enum):
    """Supported navigator app IDs."""
    google_maps = "google-maps"
    waze = "waze"
    apple_maps = "apple-maps"
    here_wego = "here-wego"
    organic_maps = "organic-maps"
    gpx_export = "gpx-export"


class RouteLeg(BaseModel):
    """Route "leg", part of the trip.

    The "leg" is a standard Valhalla term:
    > A trip contains one or more legs. For n number of break locations, there are n-1 legs.
    > Through locations do not create separate legs.
    > See: https://valhalla.github.io/valhalla/api/turn-by-turn/api-reference/#trip-legs-and-maneuvers
    """
    mode: TravelMode                       # each leg has its own mode (uc 12-13)
    eta_minutes: float | None = None
    distance_km: float | None = None

class ProviderWarning(BaseModel):
    """First-class, never fake certainty — ai-agent-build-guide.md:37."""
    message: str
    navigator: NavigatorProvider | None = None   # None → applies to the whole plan


class RouteOption(BaseModel):
    kind: RouteOptionKind
    legs: list[RouteLeg] = Field(default_factory=list)
    eta_minutes: float | None = None
    eta_delta_vs_baseline: float | None = None   # "saves/costs N min" (uc 9)
    distance_km: float | None = None
    # deferred detail (later tickets) — optional for now:
    navigator_links: dict[NavigatorProvider, str] = Field(default_factory=dict)  # #20-25
    stops: list[LocationRef] = Field(default_factory=list)         # #14-15


class RoutePlanResponse(BaseModel):
    interpreted_intent: RouteIntent        # echo of what we parsed
    options: list[RouteOption] = Field(default_factory=list)
    applied_preferences: list[RoutePreference] = Field(default_factory=list)
    warnings: list[ProviderWarning] = Field(default_factory=list)  # always present
    recommended_navigator: NavigatorProvider | None = None
    explanation: str | None = None         # LLM narration (uc 9)
```

Notes:
* Kebab values in `NavigatorProvider` match the SPA `navigatorIds` (spa/src/data/settings.ts). This vocabulary is also used by RoutePlanSettings.preferred_navigator.
* `RoutePlanResponse.warnings` defaults to an empty list but is always present.
