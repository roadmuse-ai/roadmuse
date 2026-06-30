"""Tests for the backend skeleton: health endpoint and OpenAPI availability."""

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app

# Inject explicit settings so tests don't depend on the developer's env or .env file.
test_settings = Settings(app_name="RoadMuse Backend", environment="test")
client = TestClient(create_app(test_settings))


def test_health_returns_ok() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_openapi_schema_available() -> None:
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert response.json()["info"]["title"] == "RoadMuse Backend"


def test_docs_available() -> None:
    response = client.get("/docs")
    assert response.status_code == 200
