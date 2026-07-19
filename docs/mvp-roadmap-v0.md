# MVP Roadmap: v0 -> MVP

The v0 makes frontend and backend work together. We build on top of that to add
features required for the user-facing MVP.

Related docs: [backend-api-structure.md](./backend-api-structure.md) and the model
docs under [docs/backend/](./backend/).

## TL;DR

The SPA already contains a complete, working route-entry shell running on stub
data (input, navigator deep-linking for all six providers, trip history).

The main missing piece is the `/route/plan` backend API.
So the first milestone (v0) is small:

1. One backend endpoint that turns a free-text prompt into a real route
   (origin, destination, waypoints) using a single LLM call.
2. One change in the SPA `drive()` handler: call that endpoint and use the result
   for the navigator deep-link builder that already exists.

After v0 we iterate on the backend to improve the routing.

See the [./backend-api-structure.md#high-level-backend-logic] for the backend pipeline structure.

## Milestones

```
Ver    Goal / new capability                         Backend issues        Demo you get
----   -------------------------------------------   -------------------   ---------------------------------
v0     Walking skeleton: prompt -> intent ->         #11(thin), #12        Type a route in NL, it opens the
       client-built deep link. No Valhalla.          (+ FE wiring)         right navigator with real stops.

v0.1   Real location resolution: geocode /           #15                   Precise-coordinate handoff;
       saved places / current location / ambiguity.                        home/work/current-location
                                                                           resolved; ambiguous -> clarify.

v0.2   Preference validation endpoint (already       #13                   Config screen shows real support
       wired in the SPA). PreferenceValidationAgent                        levels for typed preferences.

--- Valhalla gate: start only when we want in-app route stats/candidates OR GPX with honored preferences ---

v0.3   Real routing (baseline): compile intent +     #16, #17              Real ETA / distance / geometry;
       route_settings -> Valhalla -> one route.                            route settings (units, tolls, ...)
       Valhalla client/compiler.                                           actually applied.

v0.4   Preferences applied: candidates + scoring.    #18                   "Avoid the Beltway unless it saves
       hard/soft/conditional/contextual honored.                           15 min", low-stress rerank, etc.

v0.5   Result polish: recommendation, explanation,   #38, #39              "Why this route" narration, ETA
       warnings, applied-preferences summary.                              delta, provider warnings.

MVP    + voice STT, Help/prompt library, deploy/CI.  #27, #30, #31/#34     The full product per the roadmap.
```

Why this sequence:

- **v0 first** proves the plumbing (deploy, CORS, agent, API key) with real end-to-end value, before any heavy dependency.
- After v0, the frontend renders a richer response (real ETAs, then options, then explanation).
- **v0.1 (#15) and v0.2 (#13) come before Valhalla** - necessary parts, improve the app experience, no frontend changes: resolution sharpens the links that already ship, and the validation endpoint completes the Config screen. Their order is interchangeable (resolver-first vs validation-first).
- **Valhalla is deliberately gated, not automatic.** After we pass the link to the navigator app, it reroutes and recomputes ETA. Valhalla's geometry/candidates should improve the scoring and best route selection, but we can work on it later. Valhalla is also required for GPX export (can also add later).
- **v0.3 is where the #70 is needed.** `ValhallaCompiler` (#17) is the place that maps engine-neutral `route_settings` + parsed `RoutePreference` into Valhalla `costing_options`.
- **v0.4 is the product differentiator** - until candidates + scoring exist, preferences are parsed but not honored.

Parallel tracks (not on the critical path, can work on these anytime):

- **Real speech-to-text (#27)**: the text path already works, so voice can be added independently.
- **Documentation updates**: describe the engine-neutral `route_settings` contract
  - see "v0 decisions" below about the `route_settings` and `units`

## The v0 details

### Connect the frontend and backend

Replace the hardcoded waypoints in `drive()` (`spa/src/screens/MainScreen.tsx`) with a backend call that parses the prompt into a real route. Everything else (URL building, opening the navigator, saving history) already works.

Backend flow:

```
prompt (typed) -> POST /api/route/plan -> RouteIntentAgent (LLM) -> RouteIntent
  -> deterministic fill: coordinates from request (GPS + saved places)
  -> SPA maps RouteIntent to an AddressRoute
  -> existing buildAddressNavigatorDeepLink(...) -> window.open(deepLink)
```

**v0 decisions**:
- Define `route_settings` + `units` in the contract as **engine-neutral** now (needed by the Valhalla logic at v0.3; settles the #70 conflict before code).
- Agree that `navigator_links` / URL building (#19-#25) stays **client-side** (drop it from the backend response).

**v0 scope**:
- Backend:
  - `POST /api/route/plan` accepting `{ prompt, current_location?, settings }`
  - RouteIntentAgent (#12) with output type `RouteIntent`
  - initial location resolution logic (see "where coordinates come from" below).
  - No Valhalla, no scoring, no backend URL building.
- Frontend:
  - in `drive()`, `await` the backend, map the returned intent to the existing `AddressRoute` interface
  - build the deep link with the existing code, optionally show the interpretation summary and warnings.

### Where coordinates come from

The LLM emits text labels only and coordinates are filled by a deterministic logic (not the full resolver yet) from the data already in the request:
* Origin = current location, coordinate is request.current_location
* A saved place ("home") = saved places from settings, settings.saved_places[]
* Any other address or POI = no coordinates yet, resolve to the location name or address given by LLM

We add geocoding (resolve location names and addresses to coordinates) later, in #15.

### v0 API contract

A subset of the eventual `RoutePlanResponse`: only the parsed intent plus warnings. Omit `options` (which need Valhalla).

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

Notes:

- Only `settings.saved_places` is needed in the v0 request. `preferred_navigator` is not required, because the SPA builds the deep link client-side from its own setting.
- The SPA maps `interpreted_intent` to its `AddressRoute`:
  - `LocationRef.label -> RouteWaypoint.address`,
  - `LocationRef.coordinate -> latitude/longitude`
  - origin is the first waypoint, destination the last.
- `mode` uses the engine-neutral `TravelMode` (`drive | walk | bicycle`).

## Limitations of v0

- No real ETAs or distances (will be available in v0.3 with Valhalla). Show placeholders or omit them.
- Preferences and route settings are parsed but not honored until v0.4. Navigator deep links barely support avoid parameters; real application needs Valhalla. Capture in `warnings`.
- Speech-to-text is not working yet. Text entry works.