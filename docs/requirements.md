# Requirements

## Functional Requirements

### PWA

- RoadMuse MVP is a PWA only.
- It must work on mobile browsers.
- It must include a manifest, icons, install metadata, and service worker.
- It must provide a text input fallback even when speech recognition is unavailable.

### Main Screen

- One large primary voice/dictation button.
- Text route prompt fallback.
- Transcript preview and edit.
- Route interpretation summary.
- Applied preferences summary.
- Warnings for provider limitations.
- One primary “Open in preferred navigator” action.
- Secondary “Open in another navigator” actions.

### Config Screen

- Preferred navigator selection:
  - Google Maps
  - Waze
  - Apple Maps
  - HERE WeGo
  - Organic Maps
  - GPX export
- Saved places editor:
  - home
  - work
  - custom labels
- Preference editor:
  - one text entry per preference
  - enable/disable
  - validation status
  - explanation of support level
- Settings stored in browser `localStorage`.

### Preference Validation

Preference validation must classify entries as:

- Supported
- Partially supported
- Needs route context
- Needs clarification
- Unsupported

Examples:

| Preference | Expected Result |
|---|---|
| “Avoid tolls” | Supported |
| “When driving from DC to home, prefer Exit 26” | Partially supported / needs route context |
| “Use Waze and preserve exact Valhalla geometry” | Partially supported or unsupported with warning |
| “Avoid poorly lit streets at night” | Partially supported; depends on data coverage |

### Backend

- FastAPI backend.
- Pydantic AI for structured route intent and preference validation.
- Deterministic capability matrix after AI parsing.
- Valhalla client.
- Location resolver adapter.
- POI/search adapter.
- External navigator URL builders.

### Valhalla Routing

- Support driving, walking, bicycling, and future transit/multimodal where data exists.
- Support `break` locations for real stops.
- Support `through` or `via` locations for route shaping.
- Support costing preferences for tolls, highways, ferries, unpaved roads, truck/RV options, pedestrian accessibility, bike hills/surfaces, and maneuver penalties.
- Generate multiple candidates for conditional preferences.

### External Navigator Support

- Google Maps: best default with limited waypoint support.
- Waze: destination/search handoff, traffic-focused navigation, avoid options where supported.
- Apple Maps: iOS-friendly destination handoff.
- HERE WeGo: advanced waypoint handoff.
- Organic Maps: privacy/offline-friendly multi-stop links.
- GPX export: exact route-shape fallback.

### Help Screen

- Group prompt examples by use case.
- Show which navigators work best for each use case.
- Explain limitations honestly.

## Non-Functional Requirements

- Mobile-first responsive UI.
- Clear errors and fallback states.
- No account required for MVP.
- Local settings only for MVP.
- Testable prompt fixtures.
- Unit tests for URL builders.
- Unit tests for Valhalla request compiler.
- No native mobile app in MVP.
