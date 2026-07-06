# MVP Roadmap: v0 -> MVP

Incremental path from the barest end-to-end slice (v0) to the full MVP defined in
the design docs (with Valhalla and the rest of the backend services). Each version
is independently shippable and demoable.

Related docs: [backend-api-structure.md](./backend-api-structure.md) and the model
docs under [docs/backend/](./backend/).

## TL;DR

The SPA already contains a complete, working route-entry shell running on stub
data (input, navigator deep-linking for all six providers, trip history). The only
stubbed piece is the route itself. So the first milestone (v0) is tiny:

1. One backend endpoint that turns a free-text prompt into a real route
   (origin, destination, waypoints) using a single LLM call.
2. One change in the SPA `drive()` handler: call that endpoint and feed the result
   into the navigator deep-link builder that already exists.

Everything after v0 enriches the same response the SPA already renders, so the
frontend barely changes as the backend grows.

## Version ladder

```
Ver    Goal / new capability                         Backend issues        Demo you get
----   -------------------------------------------   -------------------   ---------------------------------
v0     Walking skeleton: prompt -> intent ->         #11(thin), #12        Type a route in NL, it opens the
       client-built deep link. No Valhalla.          (+ FE wiring)         right navigator with real stops.

v0.1   Real location resolution: geocode /           #15                   Precise-coordinate handoff;
       saved places / current location / ambiguity.                        home/work/current-location
                                                                           resolved; ambiguous -> clarify.

v0.2   Preference validation endpoint (already       #13                   Config screen shows real support
       wired in the SPA).                                                   levels for typed preferences.

--- Valhalla gate: start only when we want in-app route stats/candidates OR GPX with honored preferences ---

v0.3   Real routing (baseline): compile intent +     #16, #17             Real ETA / distance / geometry;
       route_settings -> Valhalla -> one route.                            route settings (units, tolls, ...)
                                                                           actually applied.

v0.4   Preferences applied: candidates + scoring.    #18                   "Avoid the Beltway unless it saves
       hard/soft/conditional/contextual honored.                           15 min", low-stress rerank, etc.

v0.5   Result polish: recommendation, explanation,   #38, #39             "Why this route" narration, ETA
       warnings, applied-preferences summary.                              delta, provider warnings.

MVP    + voice STT, Help/prompt library, deploy/CI.  #27, #30, #31/#34    The full product per the roadmap.
```

Sequencing rationale:

- **v0 first** proves the plumbing (deploy, CORS, agent, API key) with real
  end-to-end value, before any heavy dependency.
- **v0.1 (#15) and v0.2 (#13) come before Valhalla** -- highest value per hour,
  no frontend change: resolution sharpens the links that already ship, and the
  validation endpoint completes the Config screen. Their order is interchangeable
  (resolver-first vs validation-first).
- **Valhalla is deliberately gated, not automatic.** After handoff the navigator
  app reroutes and recomputes ETA, so Valhalla's geometry/candidates are latent
  until we either show our own route stats/candidates in-app or ship GPX with
  honored preferences. Start the Valhalla track (v0.3+) only when we want one of
  those.
- **v0.3 is where the #70 reconciliation lands.** `ValhallaCompiler` (#17) is the
  one place that maps engine-neutral `route_settings` + parsed `RoutePreference`
  into Valhalla `costing_options`. Nothing before v0.3 needs Valhalla vocabulary.
- **v0.4 is the product's real differentiator** -- until candidates + scoring
  exist, preferences are parsed but not honored.
- After v0, the frontend mostly renders a richer response (real ETAs, then
  options, then explanation) rather than changing shape.

Parallel tracks (not on the critical path, slot anytime):

- **Real speech-to-text (#27)** -- pure frontend; the text path already works, so
  voice can land whenever.
- **Docs reconciliation** -- the engine-neutral `route_settings` contract and the
  `navigator_links`-on-client note (see Architecture notes) should be written down
  before the Valhalla track (v0.3) consumes them.

## Immediate next steps (before / at the start of v0)

1. **Merge PR #76** (the planning docs) -- approved-shaped and non-blocking.
2. **Lock the v0 contract decisions** (all cheap):
   - **Response shape (open decision):** return `interpreted_intent` (+ `warnings`)
     -- forward-compatible, the SPA maps it to its `AddressRoute` -- vs a flat
     `{ waypoints, mode }` that drops into `buildAddressNavigatorDeepLink` with no
     adapter. Lean: `interpreted_intent` (stable contract, avoids a later reshape);
     flat is defensible for pure v0 speed.
   - **Skip the `/api/route/intent` debug endpoint.** With prompt fixtures covering
     the agent, a second endpoint the SPA never calls in production adds no value.
   - Define `route_settings` + `units` in the contract as **engine-neutral** now
     (needed by the Valhalla track at v0.3; settles the #70 conflict before code).
   - Record that `navigator_links` / URL building stays **client-side** (drop it
     from the backend response).
3. **First code = v0, as two tickets:**
   - (a) Backend: thin slice of #11 (schemas in `route/models.py` +
     `route/schemas.py`) + #12 RouteIntentAgent + the endpoint, verified via prompt
     fixtures (no frontend needed).
   - (b) Frontend: wire `drive()` to the endpoint.
   Backend needs Pydantic AI + an Anthropic API key.

## v0 detail: the walking skeleton

### The single seam

Replace the hardcoded waypoints in `drive()` (`spa/src/screens/MainScreen.tsx`)
with a backend call that parses the prompt into a real route. Everything
downstream (URL building, opening the navigator, saving history) already works.

```
prompt (typed) -> POST /api/route/plan -> RouteIntentAgent (LLM) -> RouteIntent
  -> deterministic fill: coordinates from request (GPS + saved places)
  -> SPA maps RouteIntent to an AddressRoute
  -> existing buildAddressNavigatorDeepLink(...) -> window.open(deepLink)
```

### What already works in the SPA (on stub data)

`spa/src/screens/MainScreen.tsx` and `spa/src/data/navigationLinks.ts`:

- Voice-style and manual text route entry (listening / review / manual modes).
- Navigator deep-linking for all six providers (Google Maps, Apple Maps, Waze,
  HERE WeGo, Organic Maps, GPX) via `buildAddressNavigatorDeepLink`, with
  client-side platform detection (`detectMobilePlatform`).
- "Previous trips" history: save, search, group by time, replay.
- Units and preferred navigator wired through settings.

Stubbed today: `drive()` ignores the prompt for routing and uses hardcoded
`defaultRouteWaypoints`; ETAs/distances are hardcoded; "listening" is animation
only (no real speech-to-text).

### v0 scope

In scope (minimum):

- Backend: `POST /api/route/plan` accepting `{ prompt, current_location?, settings }`;
  RouteIntentAgent (#12) with output type `RouteIntent`; a thin deterministic
  coordinate-fill step (below). No Valhalla, no scoring, no backend URL building.
- Frontend: in `drive()`, `await` the backend, map the returned intent to the
  existing `AddressRoute` shape, build the deep link with the existing code;
  optionally show the interpretation summary and warnings.

Out of scope for v0 (arrives in later versions):

- Valhalla client/compiler (#16, #17) and candidate generation/scoring (#18).
- `route_settings` compilation and real preference application (need Valhalla; so
  the #70 route-settings / TravelMode reconciliation does not block v0).
- Backend navigator URL building (#19-#25) -- stays on the client.
- PreferenceValidationAgent (#13, arrives v0.2); real speech-to-text (#27);
  GPX/POI/smart-stops.

### Where coordinates come from

The LLM emits text labels only -- models are unreliable at precise lat/lng and
hallucinate plausible-but-wrong values -- so coordinates are filled by a thin
deterministic step (about ten lines of glue, not the full resolver) from data
already in the request:

```
| Waypoint source            | Coordinate comes from                      | Agent output           |
|----------------------------|--------------------------------------------|------------------------|
| Origin = current location  | request current_location (GPS)             | origin = none          |
| A saved place ("home")     | request settings.saved_places[] lat/lng    | match, saved_place_id  |
| Any other address or POI   | none in v0; navigator resolves the text    | the address text       |
```

Keep this fill step in the backend so the response is self-contained. This is why
v0 needs no geocoder and defers the LocationResolver (#15).

### v0 API contract

A thin subset of the eventual `RoutePlanResponse` (assumes the `interpreted_intent`
option from Immediate next steps). v0 returns only the parsed intent plus warnings;
`options` (which need Valhalla) are omitted.

Request (`POST /api/route/plan`):

```json
{
  "prompt": "Route Rockville to the National Mall via Bethesda, avoid the Beltway",
  "current_location": { "latitude": 39.084, "longitude": -77.153 },
  "settings": {
    "saved_places": [
      { "id": "h", "label": "home", "address": "123 Main St, Rockville, MD",
        "latitude": 39.084, "longitude": -77.153 }
    ]
  }
}
```

Response (v0):

```json
{
  "interpreted_intent": {
    "origin": { "kind": "saved_place", "label": "home", "coordinate": { "latitude": 39.084, "longitude": -77.153 } },
    "destination": { "kind": "poi", "label": "National Mall, Washington, DC" },
    "waypoints": [ { "location": { "kind": "poi", "label": "Bethesda Row, MD" }, "kind": "break" } ],
    "mode": "drive",
    "raw_prompt": "Route Rockville to the National Mall via Bethesda, avoid the Beltway"
  },
  "warnings": [
    "Preferences like \"avoid the Beltway\" are parsed but not yet applied (needs routing engine)."
  ]
}
```

Field notes:

- Only `settings.saved_places` is needed in the v0 request. `preferred_navigator`
  is not required, because the SPA builds the deep link client-side from its own
  setting.
- The SPA maps `interpreted_intent` to its `AddressRoute`:
  `LocationRef.label -> RouteWaypoint.address`,
  `LocationRef.coordinate -> latitude/longitude`; origin is the first waypoint,
  destination the last.
- `mode` uses the engine-neutral `TravelMode` (`drive | walk | bicycle`).
- Flat-shape alternative (if we pick it instead): `{ "waypoints": [{address,
  latitude?, longitude?}], "mode": "drive" }` -- a lossless subset that drops
  straight into `buildAddressNavigatorDeepLink` with no SPA adapter.

## Architecture notes

- **Navigator URL building belongs on the client.** It is already implemented for
  all six providers in `navigationLinks.ts` and requires client-side platform
  detection (`navigator.userAgent` for android/ios deep-link variants) that the
  server cannot do reliably. The backend returns structured route data; the client
  turns it into links. This means `NavigatorUrlBuilder` (#19-#25) and
  `navigator_links` in `RoutePlanResponse` are redundant/misplaced and should be
  reconsidered.
- **Valhalla belongs on the backend** and stays hidden behind the deterministic
  layer. Routing = backend; deep-linking = frontend.

## Honest limitations of v0

- No real ETAs or distances (arrive at v0.3 with Valhalla). Show placeholders or
  omit them.
- Preferences and route settings are parsed but not honored until v0.4. Navigator
  deep links barely support avoid parameters; real application needs Valhalla.
  Capture in `warnings`.
- Speech-to-text is stubbed. Text entry works.

## Dependencies and local run

- Add `pydantic-ai` to `backend/pyproject.toml` (part of #12).
- Add a model id + provider key to `Settings` and `.env.example`; default to
  Anthropic with a current Claude model.
- CORS already allows the SPA origin (`http://localhost:5173`) -- no change.
- Local "working together": `make run-backend` and `make run-spa` with
  `VITE_API_BASE_URL=http://localhost:8000` and `ANTHROPIC_API_KEY` set.

## Open questions

- **Response shape:** `interpreted_intent` vs flat `{ waypoints, mode }` (see
  Immediate next steps; lean is `interpreted_intent`). The one decision to make
  before v0 code.
- v0.1 vs v0.2 order: resolver-first (#15) or validation-first (#13)?
- How much location resolution server-side in v0.1 (saved places + current
  location vs also geocoding arbitrary addresses to coordinates).
