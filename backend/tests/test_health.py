"""Tests for the backend skeleton: health endpoint and OpenAPI availability."""

from fastapi.testclient import TestClient

from app.main import create_app

client = TestClient(create_app())


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
