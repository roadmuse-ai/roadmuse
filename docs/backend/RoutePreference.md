# RoutePreference model

## What `RoutePreference` is for

`RoutePreference` is the **structured form of a single rule the user has about *how* the route should go** (as opposed to *where* it goes, that's [LocationRef](./LocationRef.md)).

We have a list of `RoutePreference` objects inside the [RouteIntent model](./RouteIntent.md). The preference also implements this requirement:

> Schemas support **hard / soft / conditional / contextual** preferences.

Examples of the natural-language rules it has to capture (from the [requirements.md](../requirements.md) and [use-cases](../use-cases.md)):

- "Avoid tolls." (requirements)
- "Avoid the Beltway **unless it saves more than 15 minutes**." (use-case 5)
- "**When driving from Washington to home**, prefer Exit 26." (use-case 4)
- "Give me a low-stress route." (use-case 7)
- "Paved roads only." (use-case 31)

Each of those becomes one `RoutePreference`. The `RouteIntentAgent` (#12) extracts them; deterministic code later turns them into Valhalla costing options (`use_tolls`, `exclude_polygons`, `maneuver_penalty`, etc., see [architecture.md](../architecture.md#core-backend-services)).

## Mental model

**`RoutePreference` = one costing/scoring rule.** `LocationRef` says where to go; `RoutePreference` says how to weigh the ways of getting there. Enforcement = how strict, applicability = when it works, support = whether we can actually apply it.

## Model structure

The model defines a preference as a set of properties:
* Enforcement: how strictly we enforce the rule?
  * Values: hard | soft
  * See use-cases 6 (hard) and 7 (soft) in [use-cases.md](../use-cases.md)
* Applicability: when does it apply?
  * Values: `always` | `conditional` (threshold) | `contextual` (origin→dest)
  * See [implementation-plan.md](../implementation-plan.md), "Conditional preferences with thresholds."
  * See [use case 4 in use-cases.md](../use-cases.md), "Contextual route preference".
* Support level: is this actually applicable?
  * Values: supported | partially-supported | needs-route-context | needs-clarification | unsupported
  * See ["Preference Validation" in requirements.md](../requirements.md#preference-validation)

A rule like *"When driving from DC to home, prefer the scenic route unless it adds more than 15 min"* is **soft** (scenic = rerank), **contextual** (from DC to home), and **conditional** (the 15-min cap).

Model fields:

```pseudocode
model RoutePreference:
    # What the rule is about: "tolls", "the Beltway", "scenic", "Exit 26".
    target: LocationRef
    # The direction: avoid | prefer | require | exclude.
    action: PreferenceAction

    # How strictly we enforce the rule: hard vs soft.
    enforcement: "hard" | "soft"
    # For soft preferences — how much to derate (low-stress reranking, use-case 7).
    weight: float | None

    # Conditional: { metric: minutes, comparator: gt, value: 15 } — use-cases 5, 6, 8.
    condition: Threshold | None
    # Contextual: { origin: LocationRef, destination: LocationRef } — use-case 4.
    applies_when: AppliesWhen | None

    # Support level for this rule (supported, partially, ..., unsupported).
    support: SupportLevel | None

    # Original phrasing, for explanation cards (use-case 9).
    raw_text: str | None
```

For conditional preferences, we use a `condition: Threshold` field to describe the limitation. For contextual preferences, we use an `applies_when: AppliesWhen` field to describe the origin/destination context. See code below for the details.

## Models in code (draft)

```python
from enum import Enum
from typing import Literal
from pydantic import BaseModel, model_validator


class PreferenceAction(str, Enum):
    avoid = "avoid"
    prefer = "prefer"
    require = "require"
    exclude = "exclude"


class ConditionMetric(str, Enum):
    """Metrics for conditional preferences.

    Closed but extensible: the metrics the routing/scoring engine
    supports today, can be extended in the future.
    """
    minutes = "minutes"
    distance_km = "distance_km"
    proximity_to = "proximity_to"       # "unless it gets too close to place X"


class Threshold(BaseModel):
    metric: ConditionMetric
    comparator: Literal["gt", "gte", "lt", "lte"]
    value: float                          # 15, or a distance for proximity_to
    reference: LocationRef | None = None  # the "place X" for proximity_to


class AppliesWhen(BaseModel):
    origin: LocationRef | None = None
    destination: LocationRef | None = None


class SupportLevel(str, Enum):
    supported = "supported"
    partially_supported = "partially-supported"
    needs_route_context = "needs-route-context"
    needs_clarification = "needs-clarification"
    unsupported = "unsupported"


class RoutePreference(BaseModel):
    target: LocationRef
    action: PreferenceAction

    # Enforcement (hard vs soft)
    enforcement: Literal["hard", "soft"] = "hard"
    weight: float | None = None            # only meaningful when soft

    # Applicability (None on both = "always")
    condition: Threshold | None = None       # conditional
    applies_when: AppliesWhen | None = None  # contextual

    # Support level
    support: SupportLevel | None = None

    raw_text: str | None = None

    @model_validator(mode="after")
    def _check_weight(self) -> "RoutePreference":
        if self.enforcement == "hard" and self.weight is not None:
            raise ValueError("weight only applies to soft preferences")
        return self
```

Note: kebab values in the `SupportLevel` enum match the SPA wire contract (spa/src/data/preferences.ts), can be serialized directly as the /api/preferences/validate `status`.

The combined rule, soft + contextual + conditional at once, can be encoded like this:

```python
# "When driving from DC to home, prefer the scenic route unless it adds >15 min"
RoutePreference(
    target=LocationRef(kind="route_feature", label="scenic"),
    action=PreferenceAction.prefer,
    enforcement="soft",
    weight=1.0,
    condition=Threshold(metric=ConditionMetric.minutes, comparator="lte", value=15),
    applies_when=AppliesWhen(
        origin=LocationRef(kind="saved_place", label="DC"),
        destination=LocationRef(kind="saved_place", label="home"),
    ),
)
```

The `RoutePreference` model is designed to be **strict** in what it can represent, but **flexible** in how it can be combined.

For rules that cannot be structured, the `support` field is used to indicate that the rule is unsupported, and the original text is preserved in `raw_text`. This allows the system to provide feedback to the user without losing their intent, example:

```python
# "avoid routes where snakes live" — nothing to structure, nothing lost
RoutePreference(
    target=LocationRef(kind="route_feature", label="snake habitat"),
    action=PreferenceAction.avoid,
    condition=None,
    support=SupportLevel.unsupported,
    raw_text="avoid routes where snakes live",   # ← words preserved
)
```