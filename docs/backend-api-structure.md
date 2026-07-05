# RoadMuse Backend API Structure

Defines the backend API endpoints and the per-endpoint data and code flow.

Related high-level flow is in the [architecture.md](./architecture.md) (see the "Main Flow") and the [ai-agent-build-guide.md](./ai-agent-build-guide.md) (describes the split of responsibility between the LLM and deterministic logic).

## Conventions

- Base path: `/api`.
- Input/output data format: JSON.
- Field names format: snake_case.
- Enum values format: kebab-case to communicate with SPA (`SupportLevel`, navigator IDs, etc); otherwise lowercase.
- Generic errors:
  - FastAPI `422` on request-body validation failure
  - `501` for not-yet-implemented stubs.

## Code Structure

We group code by feature, backend code is organized in packages that groups related code together:

* backend
  * app
    * core (health API, maybe other service APIs)
      * api.py (API routes)
      * (generic utils and services)
    * route (route APIs and logic)
      * api.py (API routes)
      * schemas.py (API input/output schemas)
      * models.py (types and data models for business logic)
      * logic.py (business logic, if needed split into multiple modules)
    * user (maybe later, to store user preferences, authentication)
      * (similar structure as above)
    * (generic modules - config.py, main.py)
  * tests
    * route (route APIs and logic tests)
    * utils (utils for tests)
    * test_user.py (.. until we have a lot of tests, we can keep a single module ..)
    * test_health.py (.. other generic tests ..)

## API Endpoints

### Route Plan Endpoint (main API endpoint)

**Purpose**: Plan the route based on free-text request from the user, taking into account generic route preferences and saved places.

**Definition**:
* Route: `POST /api/route/plan`
* Input: `RoutePlanRequest`
* Output: `RoutePlanResponse`

**Flow**:

```
HTTP JSON in            (API input)
  → POST /api/route/plan (route)
  → RoutePlanRequest     (input schema)
  → business logic
      → agent call = prompt + dependencies (RunContext)
      → RouteIntentAgent     (AI logic)
      → RouteIntent          (AI output schema)
      → LocationResolver → ValhallaCompiler → Valhalla  (routing logic...)
        → CandidateGen/Scorer → NavigatorUrlBuilder     (...routing logic)
  → RoutePlanResponse    (API output schema)
  → HTTP JSON out         (API output)
```

Business logic flow: prompt -> plan with candidates, navigator links, warnings.

**Request** `RoutePlanRequest`:

```json
{
  "prompt": "from home to the beach, avoid highways unless it adds 20+ min",
  "current_location": { "latitude": 38.9, "longitude": -77.0 },
  "settings": {
    "preferred_navigator": "google-maps",
    "saved_places": [
      {
        "id": "h", "label": "home", "entry_mode": "address",
        "address": "123 Main St", "city": "Rockville", "state": "MD",
        "country": "USA", "zip_code": "20850",
        "latitude": 38.9, "longitude": -77.0
      }
    ],
    "preferences": [
      { "id": "p1", "text": "avoid highways", "enabled": true }
    ]
  }
}
```

**Response** `RoutePlanResponse`

```json
{
  "interpreted_intent": { "…RouteIntent…" },
  "options": [
    {
      "kind": "baseline",
      "legs": [{ "mode": "drive", "eta_minutes": 35.0, "distance_km": 42.1 }],
      "eta_minutes": 35.0,
      "eta_delta_vs_baseline": 0.0,
      "distance_km": 42.1,
      "navigator_links": {},
      "stops": []
    }
  ],
  "applied_preferences": [ "…RoutePreference…" ],
  "warnings": [
    { "message": "Waze won't preserve exact route geometry", "navigator": "waze" }
  ],
  "recommended_navigator": "google-maps",
  "explanation": null
}
```

See [docs/backend/RoutePlanResponse.md](./backend/RoutePlanResponse.md)

#### Related Schema Objects:

**`RoutePlanRequest`**: request for the "Route Plan" endpoint.

```
{
  prompt: text,
  current_location?: Coordinate,
  settings: RoutePlanSettings
}
```

Notes:
* `current_location` is a `Coordinate` (`{latitude, longitude}`), since the client only ever has raw GPS; `LocationResolver` (#15) wraps it into a `LocationRef` server-side. (Not a `LocationRef` — that requires `kind` and nests coords under `coordinate`.)

**`RoutePlanSettings`**: part of the `RoutePlanRequest`, user settings and preferences.

```
{
  preferred_navigator: NavigatorProvider,
  saved_places[]: SavedPlaceInput[],
  preferences[]: PreferenceInput[]
}
```

**`SavedPlaceInput`**: User's saved place (home, work, etc).

```
{
  id: text,
  label: text,
  entry_mode?: "address"|"coordinates",
  address: text,
  city?: text,
  state?: text,
  country?: text,
  zip_code?: text,
  latitude?: number(±90),
  longitude?: number(±180)
}
```

Notes:
- Mirrors the SPA `SavedPlace` (`spa/src/data/settings.ts:46-59`).
- The `address` is required.
- Field names are snake_case (SPA uses `entryMode`/`zipCode` -> transformed to `entry_mode`/`zip_code`).

**`PreferenceInput`**: User route preference.

```
{
  id: text,
  text: text,
  enabled: boolean
}
```

Notes:
* mirrors the SPA `TextPreference` input subset.

**`RoutePlanResponse`**: The "Plan Route" endpoint output.

```
{
  interpreted_intent: RouteIntent,
  options[]: RouteOption[]
  applied_preferences[]: RoutePreference[]
  warnings[]: ProviderWarning[],
  recommended_navigator: NavigatorProvider
  explanation?: text,
}
```

See [docs/backend/RoutePlanResponse.md](./backend/RoutePlanResponse.md), it also defines:
* `RouteOption`: route metadata, an item in the array of possible options
* `RouteLeg`: a "leg" of the route (part of the trip between breaks)
* `ProviderWarning`: a warning for specific map providers (when some features are not supported)
* `NavigatorProvider`: enum of external navigator IDs (kebab values, matches the SPA `navigatorIds`); also used by `RoutePlanSettings.preferred_navigator`

**`RouteIntent`** is a machine-readable form of what the user asked for.
See [docs/backend/RouteIntent.md](./backend/RouteIntent.md), also defines `TravelMode`, `Waypoint`, `WaypointKind`.

**`LocationRef` and `Coordinate`**:
See [docs/backend/LocationRef.md](./backend/LocationRef.md)

**`RoutePreference`**:
See [docs/backend/RoutePreference.md](./backend/RoutePreference.md)

### Validate Preferences Route

**Purpose**: Classify user preference into one of categories: supported, partially supported, ..., or not supported.

**Definition**:
* Route: `POST /api/preferences/validate`
* Input: `PreferenceValidationRequest`
* Output: `PreferenceValidationResponse`

**Flow**:

```
HTTP JSON in                     (API input)
  → POST /api/preferences/validate (route)
  → PreferenceValidationRequest    (input schema)
  → business logic: agent call = text + deps (RunContext) (+ future route context)
  → PreferenceValidationAgent(AI logic: classify)
  → preference classification (AI output schema)
  → CapabilityMatrix (business-logic check)
  → PreferenceValidationResponse (API output schema)
  → HTTP JSON out                  (API output)
```

**Request** `PreferenceValidationRequest`:

```
{ "text": "avoid tolls" }
```

**Response** `PreferenceValidationResponse`:

```
{ "status": "supported", "explanation": "…" }
```

`status ∈ supported | partially-supported | needs-route-context | needs-clarification | unsupported`

We use the kebab-case here, it matches `spa/src/api/preferenceValidation.ts`. Client-only options, `pending` and `unknown`, are never emitted by the backend.

### Route Intent Endpoint

**Purpose**: temporary API for debugging, get the agent output without routing to test the `RouteIntentAgent` in #12 (we don't have Valhalla routing yet)

**Definition**:
* Route: `POST /api/route/intent`
* Input: `RoutePlanRequest`
* Output: `RouteIntent`

**Flow**:

```
HTTP JSON in             (API input)
  → POST /api/route/intent (route)
  → RoutePlanRequest       (input schema)
  → business logic
      → agent call = prompt + deps (RunContext)
      → RouteIntentAgent       (AI logic)
      → RouteIntent            (AI output schema)
  → { intent: RouteIntent } (API output schema)
  → HTTP JSON out          (API output)
```

**Request:** `RoutePlanRequest`, same as for "Route Plan" API above.

**Response:**

```
{
  "intent": {
    "…RouteIntent…"
  }
}
```

### Health Check

**Purpose**: Make sure backend is responsive, for automated health checks.

**Definition**:
* Route: `GET /health`
* Input: No
* Output: `HealthResponse`

**Flow**:

```
HTTP GET in              (API input)
  → GET /health          (route)
  → HealthResponse       (API output schema)
  → HTTP JSON out        (API output: {"status":"ok"})
```

## Open questions

- Add optional route context (origin/destination) to `/api/preferences/validate`
  so `needs-route-context` preferences can be validated in context?
- Batch preference validation vs single-text only?
- Should `/api/route/plan` optionally accept an already-parsed `RouteIntent`
  (skip the agent) for testing/replay?
- Keep `/api/route/intent` (parse-only) or drop it? It's useful to ship/verify
  #12 before Valhalla exists, but the SPA will never call it in production —
  alternative is to verify the agent via unit tests instead of a live endpoint.
- Where do we implement the input/output schemas + route-stub **code** live (there is no separate issue, so either create issues or include in existing ones, #12 / #13)?
- **RESOLVED:** the API-structure doc + per-model design notes move **into the
  repo** (`roadmuse/docs/`) as the deliverable of the planning story.
- **Doc layout — undecided:** split (`docs/backend-api-structure.md` +
  `docs/backend/LocationRef.md`, `RouteIntent.md`, …, dropping the `11-` prefix)
  vs merge everything into one doc.
- **snake_case everywhere (backend + frontend) for consistency?** Today we mix
  conventions: backend uses snake_case field names but the wire keeps kebab-case
  enum *values* (`SupportLevel`, navigator IDs) and the SPA stores camelCase
  (`preferredNavigator`, `entryMode`, `zipCode`) + kebab enum values — so a request
  needs a camel→snake mapping and the backend special-cases kebab values. Proposal:
  standardize on snake_case for *everything* on the wire (field names AND enum
  values), and migrate the SPA to match (localStorage keys + status/navigator
  values). Pros: one convention, no mapping layer, no kebab special-case (revisits
  the `SupportLevel`/navigator-ID decisions). Cons: touches shipped SPA code
  (`spa/src/data/settings.ts`, `preferences.ts`, `preferenceValidation.ts`,
  localStorage migration for existing users) — a frontend change outside #11's
  scope. Discuss whether the consistency is worth the SPA churn.