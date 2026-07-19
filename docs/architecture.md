# Architecture

## Overview

RoadMuse is a PWA-only MVP with a FastAPI + Pydantic AI backend and Valhalla route computation.

```text
RoadMuse PWA
  Main screen: voice/text route prompt
  Config screen: preferences + navigator selection
  Help screen: prompt examples
  localStorage: settings and preferences
        |
        v
FastAPI Backend
  Pydantic AI agents (parse + propose candidate routes)
  Location resolver
  Preference engine
  Valhalla compiler/client (validate + measure candidates)
  Candidate route scorer
  Route shaper (add "through" waypoints to the best route)
        |
        +--> Geocoder / POI provider
        +--> Valhalla
        +--> GPX export
```

## Core Backend Services

- `RouteIntentAgent`: extracts origin, destination, stops, mode, and preferences, and proposes candidate routes.
- `PreferenceValidationAgent`: validates text preferences against capability matrix.
- `LocationResolver`: resolves saved places, addresses, POIs, exits, and route features.
- `PreferenceEngine`: evaluates applicability of saved preferences.
- `ValhallaCompiler` / Valhalla client: maps intent + preferences to Valhalla requests, then validates and measures each candidate (ETA, cost, geometry).
- `RouteCandidateGenerator`: expands the agent's candidates into route variants (per-leg alternates, costing variations) for Valhalla to measure.
- `RouteScorer`: picks the best route according to time, preference satisfaction, and provider support.
- Route shaper: adds `through` waypoints to the best route so the client's navigator deep link reproduces it.
- Navigator deep links (Google Maps, Waze, Apple Maps, HERE WeGo, Organic Maps): built client-side in the SPA (`navigationLinks.ts`), not a backend service. GPX export is produced by the backend from the Valhalla route.

## Frontend Screens

- Main: big dictate button, text fallback, route result, navigator buttons.
- Config: preferred navigator, saved places, text preferences, validation results.
- Help: prompt examples grouped by use case.

## Main Flow

1. User speaks or types prompt.
2. PWA sends prompt + current location + local settings to backend.
3. Backend parses the route intent with Pydantic AI and proposes candidate routes.
4. For each candidate, backend resolves locations (coordinates) and preferences.
5. Backend calls Valhalla to validate and measure each candidate (ETA, cost, geometry).
6. Backend scores candidates by time, preference satisfaction, and provider support.
7. Backend shapes the best route (adds `through` waypoints) and returns warnings. The PWA builds navigator deep links client-side; GPX is produced by the backend.
8. PWA shows result and opens selected provider.
