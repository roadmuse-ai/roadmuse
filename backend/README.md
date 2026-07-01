# RoadMuse Backend

FastAPI + Pydantic AI backend for RoadMuse. This is the skeleton service
(Issue #10): app factory, CORS, env config, a `/health` endpoint, and OpenAPI
docs. AI agents and routing are added in later stories.

## Requirements

- Python 3.12+
- [uv](https://docs.astral.sh/uv/)

## Setup

```bash
cd backend
uv sync
```

## Run

```bash
uv run uvicorn app.main:app --reload
```

Or via `make run-backend` from the repo root, which honors the `ROADMUSE_HOST`
and `ROADMUSE_PORT` shell environment variables (defaults: `127.0.0.1:8000`).

- Health check: http://127.0.0.1:8000/health
- OpenAPI docs: http://127.0.0.1:8000/docs
- OpenAPI schema: http://127.0.0.1:8000/openapi.json

## Configuration

Settings are read from environment variables (prefixed `ROADMUSE_`) or a local
`.env` file. See [`.env.example`](.env.example) for the available options.

## Develop

```bash
uv run ruff check .      # lint
uv run mypy              # type-check
uv run pytest            # tests
```
