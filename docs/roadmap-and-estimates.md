# RoadMuse Estimates and 6-Hour/Week Roadmap

## Assumptions

- Start date: **Saturday, June 20, 2026**.
- Weekly capacity: **6 focused development hours/week**.
- MVP estimate with AI assistance: **190 development hours**.
- Calendar duration at 6 hours/week: **about 32 weeks**.
- Forecast MVP finish: **Friday, January 29, 2027**.
- Scope: **PWA only**, FastAPI + Pydantic AI backend, Valhalla routing, local browser storage, multiple external navigator handoff, vague search MVP, contextual preferences, tests, and deployment docs.
- This estimate assumes hosted/available Valhalla, an available geocoding/POI provider, no user accounts, no native mobile app, and no full in-app turn-by-turn navigation.

## MVP Rollup

| Area | Hours | Notes |
|---|---:|---|
| PWA shell, settings, config UI | 31 | Mobile-first PWA, localStorage, navigator selector, saved places, preference editor. |
| Pydantic AI backend | 27 | FastAPI, schemas, RouteIntentAgent, PreferenceValidationAgent. |
| Location resolution + Valhalla | 35 | Location resolver, Valhalla client/compiler, candidate route generation. |
| External navigator support | 24 | Google Maps, Waze, Apple Maps, HERE WeGo, Organic Maps, GPX, provider recommendation. |
| Main route flow + help UX | 27 | Speech/text input, result UI, help catalog, explanation card, competitor examples. |
| Advanced AI route intelligence | 30 | Waze search, contextual preferences, along-route semantic search. |
| QA, CI, deployment | 16 | Prompt fixtures, URL tests, deployment docs. |
| **Total** | **190** | **~32 weeks at 6 hours/week**. |

## Roadmap by Phase

| Phase | Target Window | Hours | Outcome |
|---:|---|---:|---|
| 1 — Foundation PWA and local settings | Weeks 1–6 (Jun 20, 2026–Jul 31, 2026) | 31 | Installable PWA shell with local settings, saved places, navigator selection, and preference editor. |
| 2 — Pydantic AI backend foundation | Weeks 6–10 (Jul 25, 2026–Aug 28, 2026) | 27 | Backend parses route prompts and validates preference text with structured Pydantic AI outputs. |
| 3 — Location resolution and Valhalla routing | Weeks 10–16 (Aug 22, 2026–Oct 9, 2026) | 35 | Backend can resolve locations, call Valhalla, compile route requests, and score route candidates. |
| 4 — External navigator handoff | Weeks 16–20 (Oct 3, 2026–Nov 6, 2026) | 24 | RoadMuse can generate provider-aware links for Google Maps, Waze, Apple Maps, HERE WeGo, Organic Maps, and GPX. |
| 5 — Main route flow and help | Weeks 20–24 (Oct 31, 2026–Dec 4, 2026) | 27 | User can speak/type prompt, review interpreted route, see warnings/explanations, and open a navigator. |
| 6 — Advanced AI route intelligence | Weeks 25–29 (Dec 5, 2026–Jan 8, 2027) | 30 | RoadMuse handles vague search, contextual rules like “from A to B prefer C,” and along-route semantic POI search. |
| 7 — Testing, CI, deployment, and beta hardening | Weeks 30–32 (Jan 9, 2027–Jan 29, 2027) | 16 | Tests, CI, deployment docs, and demo-hardening complete the MVP package. |

## Milestone Gates

| Milestone | Target | Definition of Done |
|---|---|---|
| M1 — Clickable PWA shell | End of Week 6 | Main/Config/Help screens work, settings persist locally, preferences can be entered. |
| M2 — AI parsing foundation | End of Week 10 | Route prompts and saved preferences are parsed/validated into typed backend models. |
| M3 — Valhalla route planning | End of Week 16 | RoadMuse can compute baseline and preference-shaped Valhalla routes. |
| M4 — Multi-navigator handoff | End of Week 20 | Provider links work with warnings for unsupported route shaping. |
| M5 — End-to-end demo | End of Week 24 | User can type/speak prompt, see route summary, and open selected navigator. |
| M6 — Differentiated AI features | End of Week 29 | Contextual preferences and vague along-route search are functional. |
| M7 — MVP beta | End of Week 32 | Prompt fixtures, URL tests, deployment docs, CI, and demo polish complete. |

## Weekly Execution Model

At 6 hours/week, treat each week as one small sprint:

- **4 hours implementation** — one narrow ticket or a clear slice of a larger ticket.
- **1 hour tests/fixtures** — keep prompt, URL, and route compiler tests close to the code.
- **1 hour review/docs/demo** — update README/docs, run the demo flow, and prepare the next ticket.

For larger tickets, split the work into 2–3 weekly slices. Avoid starting a new major subsystem until the previous subsystem has a working vertical path.

## Risk Buffer

The 190-hour plan is the focused MVP estimate. Keep a **20% contingency buffer** for integration surprises, geocoder/POI quality issues, Valhalla deployment issues, browser speech limitations, and external navigator URL quirks.

- Focused MVP: **190 hours / 32 weeks**.
- With 20% buffer: **228 hours / 38 weeks**, ending around **Friday, March 12, 2027**.

## Task Estimates

| Ticket | Estimate | Target Window | Phase |
|---|---:|---|---|
| `02-story-create-pwa-frontend-shell.md` — Story — Create PWA Frontend Shell | 8h | Weeks 1–2 (Jun 20, 2026–Jul 3, 2026) | Phase 1 |
| `03-story-add-pwa-manifest-and-service-worker.md` — Story — Add PWA Manifest and Service Worker | 3h | Week 2 (Jun 27, 2026–Jul 3, 2026) | Phase 1 |
| `05-story-implement-local-settings-storage.md` — Story — Implement Local Settings Storage | 4h | Weeks 2–3 (Jun 27, 2026–Jul 10, 2026) | Phase 1 |
| `06-story-implement-navigator-selector.md` — Story — Implement Navigator Selector | 4h | Weeks 3–4 (Jul 4, 2026–Jul 17, 2026) | Phase 1 |
| `07-story-implement-saved-places-editor.md` — Story — Implement Saved Places Editor | 4h | Week 4 (Jul 11, 2026–Jul 17, 2026) | Phase 1 |
| `08-story-implement-text-preference-editor.md` — Story — Implement Text Preference Editor | 8h | Weeks 4–6 (Jul 11, 2026–Jul 31, 2026) | Phase 1 |
| `10-story-create-fastapi-backend-skeleton.md` — Story — Create FastAPI Backend Skeleton | 4h | Week 6 (Jul 25, 2026–Jul 31, 2026) | Phase 2 |
| `11-story-define-route-intent-and-preference-schemas.md` — Story — Define Route Intent and Preference Schemas | 5h | Weeks 6–7 (Jul 25, 2026–Aug 7, 2026) | Phase 2 |
| `12-story-implement-routeintentagent.md` — Story — Implement RouteIntentAgent | 10h | Weeks 7–9 (Aug 1, 2026–Aug 21, 2026) | Phase 2 |
| `13-story-implement-preferencevalidationagent.md` — Story — Implement PreferenceValidationAgent | 8h | Weeks 9–10 (Aug 15, 2026–Aug 28, 2026) | Phase 2 |
| `15-story-implement-location-resolver.md` — Story — Implement Location Resolver | 10h | Weeks 10–12 (Aug 22, 2026–Sep 11, 2026) | Phase 3 |
| `16-story-implement-valhalla-client.md` — Story — Implement Valhalla Client | 5h | Weeks 12–13 (Sep 5, 2026–Sep 18, 2026) | Phase 3 |
| `17-story-implement-valhalla-request-compiler.md` — Story — Implement Valhalla Request Compiler | 8h | Weeks 13–14 (Sep 12, 2026–Sep 25, 2026) | Phase 3 |
| `18-story-implement-route-candidate-generation-and-scoring.md` — Story — Implement Route Candidate Generation and Scoring | 12h | Weeks 14–16 (Sep 19, 2026–Oct 9, 2026) | Phase 3 |
| `20-story-implement-google-maps-url-builder.md` — Story — Implement Google Maps URL Builder | 3h | Week 16 (Oct 3, 2026–Oct 9, 2026) | Phase 4 |
| `21-story-implement-waze-deep-link-builder.md` — Story — Implement Waze Deep Link Builder | 3h | Week 17 (Oct 10, 2026–Oct 16, 2026) | Phase 4 |
| `22-story-implement-apple-maps-link-builder.md` — Story — Implement Apple Maps Link Builder | 3h | Week 17 (Oct 10, 2026–Oct 16, 2026) | Phase 4 |
| `23-story-implement-here-wego-link-builder.md` — Story — Implement HERE WeGo Link Builder | 3h | Week 18 (Oct 17, 2026–Oct 23, 2026) | Phase 4 |
| `24-story-implement-organic-maps-link-builder.md` — Story — Implement Organic Maps Link Builder | 3h | Week 18 (Oct 17, 2026–Oct 23, 2026) | Phase 4 |
| `25-story-implement-gpx-export.md` — Story — Implement GPX Export | 4h | Week 19 (Oct 24, 2026–Oct 30, 2026) | Phase 4 |
| `38-story-implement-provider-recommendation-engine.md` — Story — Implement Provider Recommendation Engine | 5h | Weeks 19–20 (Oct 24, 2026–Nov 6, 2026) | Phase 4 |
| `27-story-implement-speech-and-text-input-component.md` — Story — Implement Speech and Text Input Component | 8h | Weeks 20–21 (Oct 31, 2026–Nov 13, 2026) | Phase 5 |
| `28-story-implement-route-planning-result-ui.md` — Story — Implement Route Planning Result UI | 8h | Weeks 21–23 (Nov 7, 2026–Nov 27, 2026) | Phase 5 |
| `30-story-build-prompt-example-catalog.md` — Story — Build Prompt Example Catalog | 4h | Week 23 (Nov 21, 2026–Nov 27, 2026) | Phase 5 |
| `39-story-implement-route-explanation-card.md` — Story — Implement Route Explanation Card | 4h | Weeks 23–24 (Nov 21, 2026–Dec 4, 2026) | Phase 5 |
| `40-story-implement-competitor-parity-help-examples.md` — Story — Implement Competitor Parity Help Examples | 3h | Week 24 (Nov 28, 2026–Dec 4, 2026) | Phase 5 |
| `35-story-implement-waze-search-mode.md` — Story — Implement Waze Search Mode | 4h | Week 25 (Dec 5, 2026–Dec 11, 2026) | Phase 6 |
| `36-story-implement-contextual-preference-applicability-engine.md` — Story — Implement Contextual Preference Applicability Engine | 11h | Weeks 25–27 (Dec 5, 2026–Dec 25, 2026) | Phase 6 |
| `37-story-implement-along-route-semantic-search.md` — Story — Implement Along Route Semantic Search | 15h | Weeks 27–29 (Dec 19, 2026–Jan 8, 2027) | Phase 6 |
| `32-story-add-prompt-fixture-tests.md` — Story — Add Prompt Fixture Tests | 7h | Weeks 30–31 (Jan 9, 2027–Jan 22, 2027) | Phase 7 |
| `33-story-add-navigator-url-builder-tests.md` — Story — Add Navigator URL Builder Tests | 4h | Week 31 (Jan 16, 2027–Jan 22, 2027) | Phase 7 |
| `34-story-add-deployment-docs-and-environment-template.md` — Story — Add Deployment Docs and Environment Template | 5h | Weeks 31–32 (Jan 16, 2027–Jan 29, 2027) | Phase 7 |
