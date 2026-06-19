# AI Agent Build Guide

## Principle

LLMs parse and explain. Deterministic code validates, routes, scores, and generates navigator links.

## Agent Responsibilities

- RouteIntentAgent: parse prompt to structured intent.
- PreferenceValidationAgent: classify text preference feasibility.

## Deterministic Responsibilities

- Capability matrix validation.
- Location/geocoder resolution.
- Valhalla request compilation.
- Candidate scoring.
- URL generation.
- GPX export.

## Required Test Fixtures

Add prompt fixtures for:

- basic routing
- Waze search
- Waze avoid flags
- contextual “from A to B prefer C” rules
- conditional avoidance
- low-stress route
- smart stops
- provider warnings
- GPX export

## Important Guardrail

Do not claim external navigators will preserve exact Valhalla route geometry unless using GPX or a provider explicitly supports the required behavior. Prefer warnings over fake certainty.
