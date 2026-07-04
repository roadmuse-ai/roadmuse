# LocationRef model

## What `LocationRef` is for

`LocationRef` describes a place before we know exactly where that place is. It's a reference, not a precise coordinate.

This model is used everywhere a location is needed: `RouteIntent.origin`, `RouteIntent.destination`, `RouteOption.stops[]`, etc.

It captures the whole lifecycle of a place in the app, from "vague thing the user said" to "exact lat/lon we hand to Valhalla." When the AI first produces it, a `LocationRef` might just be the string `"daycare"`. Later, `LocationResolver` (#15) turns that into coordinates. Same object, progressively filled in:

```
"daycare"  ──RouteIntentAgent──▶  LocationRef(kind=saved_place, label="daycare")
                                        │
                                        │  LocationResolver (#15)
                                        ▼
                                  LocationRef(..., coordinate=(39.08, -77.15), is_resolved=True)
```

This structure supports the [design principle in ai-agent-build-guide.md](../ai-agent-build-guide.md#principle):

> LLMs parse and explain. Deterministic code validates, routes, scores, and generates navigator links.

The `LocationRef` contains both the fuzzy input and the precise output.

## Mental model

**`LocationRef` = a labeled envelope for a place that starts vague and gets resolved to the coordinate.** It preserves the original label, and it gains a coordinate when the resolver gets to it.

## Model structure

Model represents the location data that is populated by the `LocationResolver` (see [../architecture.md](../architecture.md#core-backend-services)):

> `LocationResolver`: resolves saved places, addresses, POIs, exits, and route features.

So we have different `kind`s of locations plus the fields each kind needs:

```pseudocode
model LocationRef:
  # Location kind: saved_place | address | poi | exit | route_feature | coordinate
  kind: LocationKind(Enum)
  # The human/searchable text: "home", "the Beltway", "Exit 26", "gas station"
  label: str | None
  # lat/lon, once resolved, precise-access-point routing needs this (use-case 11, in use-cases.md)
  coordinate: Coordinate | None
  # For home/work/custom labels from local settings (see requirements.md, "Saved places editor")
  saved_place_id: str | None
  # Has the resolver run yet? Distinguishes `"daycare"` from the actual place with coordinates.
  # Note: the `coordinate` can be `None` for `route_feature` even after it was resolved
  # (otherwise, we could omit the `is_resolved` flag and just check the `coordinate is not None`).
  is_resolved: bool
  #  "Agent marks ambiguity → app asks clarification" (use-case 36 in use-cases.md)
  is_ambiguous: bool
```

### `LocationKind` represents different kinds of locations

We have the following kinds:

- **`saved_place`** — resolved from the user's localStorage settings (home/work/custom). No geocoding needed.
- **`address`** — goes through the geocoder adapter (see "Location and Search" in the implementation-plan.md).
- **`poi`** — a *category or name* to search along/near the route ("gas station", "coffee"), input for the smart-stop search (use-cases 14-15).
- **`exit`** — a highway exit, e.g. "Exit 26" — a target for contextual prefs ("prefer Exit 26").
- **`route_feature`** — not a point, things like "the Beltway" or "tolls" — a feature you avoid or prefer, stored as `RoutePreference.target` (see [use-cases.md](../use-cases.md)). Different from other kinds, used for shaping/avoidance, not as an endpoint.
- **`coordinate`** — precise lat/lon, e.g. an exact entrance or drop-off point (use-cases 11 and 33).

### Discussion: the `route_feature` is not a point on the map (unlike other values)

`LocationRef` serves **two roles** that pull in slightly different directions:

1. **A destination/waypoint** — needs to end up as a routable coordinate.
2. **A preference target** (`route_feature`) — "the Beltway", which is never a coordinate, it's a thing to avoid.

We could either (a) let one `LocationRef` cover both via the `kind` enum (simpler, one type everywhere), or (b) split `route_feature` out into its own `RouteFeature` type used only inside `RoutePreference`.

For now we do (a), one type for simplicity. Also the resolver is planned to treat "route features" as one of its resolution targets ([architecture.md](../architecture.md#core-backend-services)):

> `LocationResolver`: resolves saved places, addresses, POIs, exits, and route features.

Also for external navigator handoff, `LocationRef` needs to expose **both** a coordinate *and* a searchable label — Waze deep links use either `ll=lat,lon` or `q=<search>` (see "Waze-style destination search" in use-cases.md), so we can't reduce `LocationRef` to coordinate-only.

We can reconsider this later, when we have more usage cases in the code.

## The model in code (draft)

```python
from enum import Enum
from pydantic import BaseModel


class LocationKind(str, Enum):
    saved_place = "saved_place"     # home / work / custom, from local settings
    address = "address"             # goes through the geocoder adapter
    poi = "poi"                     # a category or name to search ("gas station")
    exit = "exit"                   # a highway exit ("Exit 26")
    route_feature = "route_feature" # "the Beltway", "tolls" (not a specific point on the map)
    coordinate = "coordinate"       # already-precise lat/lon


class Coordinate(BaseModel):
    # latitude/longitude (not lat/lon) to match the SPA wire contract
    # (spa/src/data/settings.ts, spa SavedPlace).
    latitude: float
    longitude: float


class LocationRef(BaseModel):
    kind: LocationKind
    label: str | None = None              # human/searchable text; also Waze `q=`
    coordinate: Coordinate | None = None  # filled once resolved; Waze `ll=`
    saved_place_id: str | None = None     # for saved_place kind
    is_resolved: bool = False                # has LocationResolver (#15) run yet?
    is_ambiguous: bool = False               # agent-marked → app asks clarification (use-case 36)
```

Progressive filling, how the same object looks before and after resolution:

```python
# as produced by RouteIntentAgent (#12) — just a name
LocationRef(kind=LocationKind.saved_place, label="daycare")

# after LocationResolver (#15), resolved place with coordinates
LocationRef(
    kind=LocationKind.saved_place,
    label="daycare",
    coordinate=Coordinate(latitude=39.08, longitude=-77.15),
    is_resolved=True,
)
```

Note both `label` and `coordinate` are retained — external navigator handoff needs either `ll=lat,lon` or `q=<search>` (see "Waze-style destination search" in use-cases.md), so we can't reduce `LocationRef` to coordinate-only.