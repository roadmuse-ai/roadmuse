# Implementation Plan

## Phase 1 — PWA Shell

- React + TypeScript + Vite.
- Tailwind + shadcn/ui.
- Main, Config, Help screens.
- PWA manifest and service worker.
- localStorage settings.

## Phase 2 — Multiple Navigator Support

- Provider capability matrix.
- Google Maps URL builder.
- Waze deep-link builder, including search query support.
- Apple Maps link builder.
- HERE WeGo link builder.
- Organic Maps link builder.
- GPX export.
- Provider warnings and recommendation logic.

## Phase 3 — Pydantic AI Backend

- FastAPI skeleton.
- Pydantic route intent schemas.
- RouteIntentAgent.
- PreferenceValidationAgent.
- Prompt fixture tests.

## Phase 4 — Location and Search

- Current location handling.
- Saved places resolver.
- Geocoder adapter.
- POI search adapter.
- Waze-style destination/search behavior.
- Along-route search foundation.

## Phase 5 — Valhalla Routing

- Valhalla client.
- Request compiler.
- Route candidates.
- `break` stops.
- `through` route shaping.
- Maneuver penalty and avoid options.
- Optimized route for multi-stop errands.

## Phase 6 — Context and Preferences

- Contextual preference model: “from A to B prefer C.”
- Applicability scoring.
- Conditional preferences with thresholds.
- Low-stress route scoring.
- Route explanation.

## Phase 7 — Help and Onboarding

- 50+ prompt examples.
- Grouped use cases.
- Competitor-parity examples.
- Provider limitation education.

## Phase 8 — QA and Deployment

- Unit tests.
- Backend API tests.
- URL builder tests.
- Valhalla compiler tests.
- Prompt fixture tests.
- README and deployment docs.

## Estimate with AI Assistance

- Clickable PWA shell: 3–5 dev days.
- MVP with Google Maps/Waze/Apple links and AI parsing: 7–9 dev days.
- MVP with all six providers, Valhalla candidates, validation, help screen: 12–16 dev days.
- Polished demo with tests, GPX, deployment: 16–22 dev days.

## Estimate and Roadmap

RoadMuse MVP is estimated at **190 development hours with AI assistance**. At **6 focused hours/week**, starting **Saturday, June 20, 2026**, the planned MVP duration is about **32 weeks**, with a forecast finish around **Friday, January 29, 2027**.

See [`docs/roadmap-and-estimates.md`](roadmap-and-estimates.md) for the detailed phased roadmap, ticket estimates, weekly target windows, and risk buffer.

