# Regenerated Use Cases

These use cases assume RoadMuse now supports competitor-parity features such as Waze search/deep links, semantic place search, along-route POI search, multi-stop planning, road-trip suggestions, route explanation, GPX export, and contextual preference rules.

Legend:

- **Valhalla** = handled through Valhalla route/costing/waypoints.
- **App Layer** = RoadMuse AI, geocoder, POI search, scoring, local preferences, URL builder, or provider warnings.
- **Navigator Handoff** = Google Maps, Waze, Apple Maps, HERE WeGo, Organic Maps, or GPX.

## 1. Basic voice destination search

**Prompts**

- “Take me home.”
- “Navigate to work.”
- “Drive me to BWI.”

**Implementation**

- App resolves saved place or geocodes destination.
- Valhalla computes route.
- Navigator URL opens selected provider.

## 2. Waze-style destination search

**Prompts**

- “Open Waze and search for Chabad Frederick.”
- “Navigate in Waze to Georgetown University.”
- “Use Waze for this destination.”

**Implementation**

- App resolves destination or builds Waze `q` search link.
- Waze deep link uses `https://waze.com/ul?q=...&navigate=yes` or `ll=lat,lon&navigate=yes`.
- Warn that Waze may recalculate and ignore RoadMuse route shaping.

## 3. Waze avoid-preference handoff

**Prompts**

- “Open in Waze and avoid tolls.”
- “Use Waze, avoid freeways.”
- “Use Waze motorcycle mode.”

**Implementation**

- App maps preferences to Waze deep-link parameters where available: avoid tolls, ferries, freeways, trails, dangerous turns, vehicle type.
- Valhalla route is used for planning/explanation, but Waze controls final navigation.

## 4. Contextual route preference: from A to B prefer C

**Prompts**

- “When I’m driving from Washington to home, prefer Exit 26.”
- “When going from work to daycare, use the back way through Rockville.”
- “From home to synagogue, prefer Route 355 unless traffic is bad.”

**Implementation**

- Store preference with `applies_when.origin`, `applies_when.destination`, and `target_route_feature`.
- Generate baseline route and route shaped through C.
- Compare ETA and preference satisfaction.

## 5. Conditional road avoidance

**Prompts**

- “Avoid the Beltway unless it saves more than 15 minutes.”
- “Avoid I-95 unless the alternative is terrible.”
- “Avoid downtown unless it adds more than 10 minutes.”

**Implementation**

- Generate normal route.
- Generate avoid-road/avoid-area candidate via Valhalla `exclude_locations` or `exclude_polygons`.
- Compare time delta and choose based on threshold.

## 6. Conditional toll use

**Prompts**

- “Use tolls only if they save at least 20 minutes.”
- “Avoid tolls unless the free route is much slower.”

**Implementation**

- Generate toll-allowed and toll-avoiding candidates.
- Use Valhalla `use_tolls` or hard exclusions where available.
- App applies threshold logic.

## 7. Low-stress route

**Prompts**

- “I’m tired, give me the easiest route home.”
- “Avoid complicated merges.”
- “Fewer turns, please.”

**Implementation**

- Use Valhalla `maneuver_penalty` and route alternatives.
- App reranks by merge count, ramp count, U-turns, road-name changes, and ETA delta.

## 8. Do-not-surprise-reroute policy

**Prompts**

- “Keep me on this route unless it saves more than 15 minutes.”
- “Do not reroute me unless there is a closure.”

**Implementation**

- Save selected route shape/corridor.
- Periodically compare new fastest candidate.
- Suggest switch only if threshold is met.

## 9. Route explanation

**Prompts**

- “Why are you taking me this way?”
- “Why not my usual route?”
- “Is this because of traffic, tolls, or my preferences?”

**Implementation**

- Compare selected route vs baseline/usual/preferred routes.
- Explain ETA delta, avoided features, waypoints, and provider limitations.

## 10. Usual route preference

**Prompts**

- “Use my normal route unless traffic is terrible.”
- “Prefer my usual commute route.”

**Implementation**

- App stores or imports historical route corridors.
- Shape route with `through` points or score route overlap.
- Compare against fastest candidate.

## 11. Correct entrance routing

**Prompts**

- “Take me to the ER entrance, not the main hospital.”
- “Use the school pickup entrance.”
- “Route me to the loading dock.”

**Implementation**

- App resolves specific access point.
- Valhalla routes to precise coordinates.
- External navigator receives the exact coordinate.

## 12. Parking-first navigation

**Prompts**

- “Find parking near the venue and walk me in.”
- “Avoid downtown driving; park 10 minutes away and walk.”

**Implementation**

- App searches parking POIs.
- Valhalla computes auto leg to parking and pedestrian leg to destination.
- External navigator may open first leg, or user gets a two-leg plan.

## 13. Park-and-ride strategy

**Prompts**

- “Drive me to a Metro station, then transit into DC.”
- “Avoid downtown parking; use park-and-ride.”

**Implementation**

- App finds station/parking candidates.
- Valhalla computes auto + multimodal or separate legs.
- App explains tradeoffs.

## 14. One smart stop solving multiple needs

**Prompts**

- “I need gas and food in one stop.”
- “Find coffee, gas, and a clean bathroom on the way.”

**Implementation**

- App searches POIs near route corridor.
- Scores by detour, category match, open hours, ratings, and brand preferences.
- Adds chosen stop as Valhalla `break`.

## 15. Along-route semantic search

**Prompts**

- “Find a quiet café on the way.”
- “Find a charger where I won’t have to wait in a long coffee line.”
- “Find a public tennis court with lights tonight.”

**Implementation**

- App uses POI/search provider + LLM semantic filter.
- Valhalla computes detours and route impact.
- App returns candidate stops and navigator links.

## 16. Road-trip AI suggestions

**Prompts**

- “Plan a scenic route to Ocean City with two interesting stops.”
- “Build a family-friendly road trip with playgrounds and lunch.”

**Implementation**

- App generates candidate POIs by category/route corridor.
- Valhalla computes multi-stop route.
- Can hand off to HERE WeGo/Organic Maps or GPX for more waypoints.

## 17. Family stop planning

**Prompts**

- “Bathroom stops every 90 minutes.”
- “Find a playground halfway there.”
- “No more than two hours without a break.”

**Implementation**

- App calculates time markers along Valhalla route.
- Searches POIs near those route points.
- Adds stops as `break`s.

## 18. Multi-stop errand optimization

**Prompts**

- “I need pharmacy, groceries, gas, then home — optimize it.”
- “Pick the best order for these five stops.”

**Implementation**

- Use Valhalla optimized route service for simple reorder.
- App handles time windows, priorities, and service time.

## 19. Delivery-style route planning

**Prompts**

- “Plan my 12 stops and end at home.”
- “Optimize these addresses, but avoid left turns on busy roads.”

**Implementation**

- Valhalla optimized route + app constraints.
- Not full fleet dispatch in MVP; no proof-of-delivery initially.

## 20. Advanced multi-waypoint handoff

**Prompts**

- “This route has 12 stops; open it in the best navigator.”
- “Use a navigator that can handle many waypoints.”

**Implementation**

- Provider recommendation engine chooses HERE WeGo or Organic Maps over Google Maps mobile when waypoint count is high.
- App shows warning for Waze/Apple Maps.

## 21. Exact route preservation

**Prompts**

- “Export the exact route.”
- “I want to follow the Valhalla route, not let another app recalculate.”

**Implementation**

- Export selected Valhalla shape as GPX.
- Warn that Google/Waze/Apple may recalculate.

## 22. Scenic route with tolerance

**Prompts**

- “Take the scenic route, but don’t add more than 30 minutes.”
- “Avoid boring highways if it’s reasonable.”

**Implementation**

- App uses scenic POI/road-class/elevation/water/parks heuristics.
- Valhalla computes candidates.
- App applies max-extra-time threshold.

## 23. Weather-aware route planning

**Prompts**

- “Avoid mountain roads in snow.”
- “Show weather along the route.”
- “Avoid high wind bridges if possible.”

**Implementation**

- App integrates weather feed and tags route segments.
- Valhalla computes alternatives; app reranks or excludes affected areas.

## 24. RV/truck-safe route

**Prompts**

- “I’m driving an RV, avoid low bridges.”
- “Truck route, 12-foot height.”

**Implementation**

- Use Valhalla `truck` costing and vehicle dimensions.
- App maps RV/trailer prompt to dimensions.

## 25. Motorcycle fun route

**Prompts**

- “Give me a fun motorcycle route with back roads.”
- “Avoid boring interstate on the motorcycle.”

**Implementation**

- Use Valhalla motorcycle/beta options where available.
- App scores curviness and scenic quality.

## 26. Bicycle comfort route

**Prompts**

- “Bike me there, avoid busy roads.”
- “Flat bike route, please.”

**Implementation**

- Use Valhalla bicycle costing: road tolerance, hills, bad surfaces.
- App explains data limitations.

## 27. Accessibility walking route

**Prompts**

- “Wheelchair-friendly route, no stairs.”
- “I have a stroller; avoid steps and steep hills.”

**Implementation**

- Use Valhalla pedestrian wheelchair mode, step penalties, hill preferences.
- App warns data coverage may vary.

## 28. Night walking route

**Prompts**

- “Walk me using well-lit streets.”
- “It’s late; avoid alleys.”

**Implementation**

- Use pedestrian costing where lighting/alley data exists.
- App combines with urban/main-street heuristics.

## 29. Provider-aware route opening

**Prompts**

- “Open this in Google Maps.”
- “Use Waze for live traffic.”
- “Use HERE because this route has many stops.”
- “Use Organic Maps because I want offline/privacy.”

**Implementation**

- App selects provider URL builder.
- Capability matrix adds warning or recommends a better provider.

## 30. Search by need, not business name

**Prompts**

- “I need coffee and a restroom.”
- “Find a kid-friendly lunch stop.”
- “Find a cheap gas station on the way.”

**Implementation**

- LLM converts need to search filters.
- POI provider returns candidates.
- Valhalla calculates route impact.

## 31. Avoid unpaved roads

**Prompts**

- “No dirt roads.”
- “My car is low; paved roads only.”

**Implementation**

- Use Valhalla `exclude_unpaved` and track preferences.
- App warns that surface data can be incomplete.

## 32. Time-window errand planning

**Prompts**

- “Pharmacy closes at 6, daycare pickup by 5:30, then groceries.”
- “Make a route that gets me to the appointment by 3:45.”

**Implementation**

- App handles time windows and order constraints.
- Valhalla computes travel times per candidate order.

## 33. Destination-side strategy

**Prompts**

- “Take me near the stadium but avoid event traffic.”
- “Drop me two blocks away on a quieter street.”

**Implementation**

- App selects alternate destination/drop-off points.
- Valhalla computes final approach.

## 34. Road closure or event-zone avoidance

**Prompts**

- “Avoid the protest area.”
- “Avoid stadium traffic zone tonight.”
- “Avoid the area I drew.”

**Implementation**

- App maps event/drawn region to polygon.
- Valhalla uses `exclude_polygons`.

## 35. Saved preference validation

**Prompts in config**

- “When driving from A to B, prefer C.”
- “Use Waze but preserve exact route.”
- “Avoid tolls unless they save 20 minutes.”

**Implementation**

- Pydantic AI classifies preference.
- Deterministic capability matrix validates feasibility.
- UI displays support level and provider warnings.

## 36. Clarification for ambiguous target

**Prompts**

- “Use Exit 26.”
- “Take me to Washington.”
- “Avoid the bad road.”

**Implementation**

- Agent marks ambiguity.
- App asks targeted clarification.
- Preference is saved only after resolution.

## 37. Place discovery along current route

**Prompts**

- “What interesting places are along this route?”
- “Find a quick detour hidden gem.”

**Implementation**

- Similar to Roadtrippers/WayGenAI-style discovery.
- POI search + LLM ranking + Valhalla detour calculation.

## 38. Commuter proactive check

**Prompts**

- “Is my normal route bad today?”
- “Should I leave now or wait?”

**Implementation**

- App compares usual route vs alternatives.
- Live traffic requires external traffic provider or navigator handoff.
- Valhalla handles base geometry/candidates.

## 39. Import or paste stop list

**Prompts**

- “Here are 10 addresses; optimize them and end at home.”
- “Paste these stops and open in HERE WeGo.”

**Implementation**

- App parses addresses.
- Valhalla optimized route.
- HERE WeGo/Organic Maps handoff if many waypoints.

## 40. Competitor-parity route planning assistant

**Prompts**

- “Plan this like Roadtrippers, but open in Google Maps.”
- “Use inRoute-style scenic/weather thinking but keep it simple.”
- “Use Waze for final navigation, but RoadMuse should plan the route first.”

**Implementation**

- App composes route-planning features from search, Valhalla, provider warnings, and external handoff.
- RoadMuse stays provider-neutral and transparent.
