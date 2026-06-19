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
  Pydantic AI agents
  Location resolver
  Preference engine
  Valhalla compiler/client
  Candidate route scorer
  Navigator URL builders
        |
        +--> Geocoder / POI provider
        +--> Valhalla
        +--> External navigator URLs / GPX
```

## Core Backend Services

- `RouteIntentAgent`: extracts origin, destination, stops, mode, and preferences.
- `PreferenceValidationAgent`: validates text preferences against capability matrix.
- `LocationResolver`: resolves saved places, addresses, POIs, exits, and route features.
- `PreferenceEngine`: evaluates applicability of saved preferences.
- `ValhallaCompiler`: maps route intent to Valhalla requests.
- `RouteCandidateGenerator`: creates baseline and preference-shaped candidates.
- `RouteScorer`: picks the best route according to time, preference satisfaction, and provider support.
- `NavigatorUrlBuilder`: creates links for Google Maps, Waze, Apple Maps, HERE WeGo, Organic Maps, or GPX.

## Frontend Screens

- Main: big dictate button, text fallback, route result, navigator buttons.
- Config: preferred navigator, saved places, text preferences, validation results.
- Help: prompt examples grouped by use case.

## Main Flow

1. User speaks or types prompt.
2. PWA sends prompt + current location + local settings to backend.
3. Backend parses route intent with Pydantic AI.
4. Backend resolves locations and preferences.
5. Backend calls Valhalla for route candidates.
6. Backend scores candidates.
7. Backend builds navigator URLs and warnings.
8. PWA shows result and opens selected provider.
