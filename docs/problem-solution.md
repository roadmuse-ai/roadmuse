# Problem and Solution

## Problem

Standard GPS products are excellent at live navigation, but they remain weak at interpreting personal route intent.

Users often think in contextual, conditional, and human language:

- “When I’m driving from DC to home, prefer Exit 26.”
- “Avoid the Beltway unless it saves more than 15 minutes.”
- “I’m tired; choose the easiest route, not necessarily the fastest.”
- “Find gas and food in one stop, and don’t add more than 8 minutes.”
- “Open this in Waze, but tell me if Waze will ignore my waypoints.”

Current tools force users into rigid settings: avoid tolls, avoid highways, add stop, search nearby. That does not capture the way people actually choose routes.

## Solution

RoadMuse is a PWA-first AI route-preference layer.

It:

1. Takes a natural-language route prompt by voice or text.
2. Uses Pydantic AI to extract structured route intent.
3. Merges the session request with locally saved text preferences.
4. Uses Valhalla to compute baseline, preference-shaped, and alternative route candidates.
5. Scores candidates according to context, route preferences, and external navigator limitations.
6. Opens the selected route in Google Maps, Waze, Apple Maps, HERE WeGo, Organic Maps, or exports GPX.

## Differentiation

RoadMuse does not try to replace Google Maps or Waze. It works before them.

Mainstream maps optimize navigation. RoadMuse optimizes **route intent**.

## MVP Focus

- Contextual route preferences: “from A to B, prefer C.”
- Waze-style search and handoff: destination search, avoid tolls/freeways/ferries, vehicle hints.
- Competitor-parity features: along-route search, multi-stop planning, road-trip suggestions, route explanations, GPX export.
- Provider capability warnings: Google Maps, Waze, Apple Maps, HERE WeGo, Organic Maps.
