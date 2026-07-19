"""Application configuration loaded from the environment."""

from functools import lru_cache

from fastapi import Request
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Backend settings, read from environment variables or a local .env file."""

    model_config = SettingsConfigDict(
        env_prefix="ROADMUSE_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "RoadMuse Backend"
    app_version: str = "0.1.0"
    environment: str = "development"
    cors_origins: list[str] = ["http://localhost:5173"]
    # Pydantic AI model identifier in "provider:model" form, e.g.
    # "anthropic:claude-opus-4-8", "openai:gpt-5", "google-gla:gemini-2.5-pro".
    # The provider's own API key is read from its standard env var.
    route_agent_model: str = "anthropic:claude-opus-4-8"

    # API keys for the providers we support.
    anthropic_api_key: str | None = None
    openai_api_key: str | None = None
    google_api_key: str | None = None


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""

    return Settings()


def app_settings(request: Request) -> Settings:
    """FastAPI dependency: the Settings stored on the app by `create_app`.

    Tests inject their own Settings via `create_app(Settings(...))`; overriding
    this dependency (`app.dependency_overrides[app_settings]`) also works.
    """

    settings: Settings = request.app.state.settings
    return settings
