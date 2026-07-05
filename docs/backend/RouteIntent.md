# RouteIntent model

## Overview

**`RouteIntent` = the normalized order slip.** The user speaks freely; the agent fills in this form; deterministic code reads the form and never has to re-interpret free-form text.

## What `RouteIntent` is for

`RouteIntent` is the **structured, machine-readable form of what the user asked for in plain language.**

It's the boundary object between the two halves of the system: LLM and deterministic code (see the design [principle](../ai-agent-build-guide.md#principle)):

> LLMs parse and explain. Deterministic code validates, routes, scores, and
> generates navigator links.

Where this fits in the API flow:

```
user prompt (free text)          "Drive me from work to daycare, avoid the
   │                              Beltway unless it saves 15+ min, prefer the
   │  POST /api/route/plan        back way through Rockville"
   │  RouteIntentAgent (#12)
   ▼
RouteIntent (#11)  ◄── this model
   │
   │ deterministic code (resolver → Valhalla compiler → scorer)
   ▼
RoutePlanResponse (api output)
```

`RouteIntent` is the *only* thing the LLM produces after processing the input and everything after it is deterministic.

That's why it matters that it's a strict Pydantic model: it's the point where we stop trusting free-form model output and start validating (see [requirements.md](../requirements.md#backend), "Deterministic capability matrix after AI parsing").

## Model structure

Model wraps the data produced by the `RouteIntentAgent` (see [../architecture.md](../architecture.md#core-backend-services)):

> `RouteIntentAgent`: extracts **origin, destination, stops, mode, and preferences.**

And has information related to the [valhalla routing in requirements.md](../requirements.md#valhalla-routing):

> - Support driving, walking, bicycling, and future transit/multimodal where data exists.
> - Support `break` locations for real stops.
> - Support `through` or `via` locations for route shaping.
> - Support costing preferences for tolls, highways, ferries, unpaved roads, truck/RV options, pedestrian accessibility, bike hills/surfaces, and maneuver penalties.
> - Generate multiple candidates for conditional preferences.

The list of model fields, based on requirements and use-cases:

```pseudocode
model RouteIntent:
  # Optional, "None" means "use current location as origin".
  origin: LocationRef | None
  # Required, route destination parsed into LocationRef.
  destination: LocationRef
  # Each waypoint is either a real **stop** (`break`) or a **shaping** point (`through`/`via`).
  waypoints: list[Waypoint]
  # Travel mode: drive | walk | bicycle | (future transit/multimodal).
  mode: TravelMode(Enum)
  # The hard/soft/conditional/contextual rules.
  preferences: list[RoutePreference]
  # Optimize / reorder multi-stop routes ([use-cases 18-19, 39](../use-cases.md))
  optimize: bool
  # The original text for explanation or debugging (route explanation is use-case 9)
  raw_prompt: str | None
```

Notes:

- **`origin`** is optional on purpose. In the main flow PWA sends "prompt + current location" separately ([../architecture.md](../architecture.md#main-flow)), so a missing origin means "start from where I am" and the resolver fills it in later. The schema shouldn't force it.
- **`waypoints`** list has two types of items: `break` and `through`. These are different and `break` represents a real stop where you get out while `through` is a point to route through, but without a stop.
- **`RouteIntent` contains *parsed* preferences, not the *validated* ones.** The AI extracts intent; `PreferenceValidationAgent` (#13) later marks each preference with a support level (supported, partially supported, etc). So in #11, `RouteIntent.preferences` is the "what the user wants" list; the "can we actually do it" decision is a separate concern layered on top.

## The model in code (draft)

```python
from enum import Enum
from pydantic import BaseModel, Field


class TravelMode(str, Enum):
    drive = "drive"
    walk = "walk"
    bicycle = "bicycle"
    # future: transit / multimodal (see requirements.md#valhalla-routing)


class WaypointKind(str, Enum):
    break_ = "break"      # a real stop (get out) — Valhalla `break`
    through = "through"   # shaping only (pass through) — Valhalla `through`/`via`


class Waypoint(BaseModel):
    location: LocationRef
    kind: WaypointKind = WaypointKind.break_   # requirements.md:76-77


class RouteIntent(BaseModel):
    origin: LocationRef | None = None      # None → "current location"
    destination: LocationRef
    waypoints: list[Waypoint] = Field(default_factory=list)
    mode: TravelMode = TravelMode.drive
    preferences: list[RoutePreference] = Field(default_factory=list)
    optimize: bool = False                 # reorder multi-stop errands (uc 18-19)
    raw_prompt: str | None = None          # original text, for explanation/debug
```