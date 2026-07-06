"""Application configuration loaded from the environment."""

from functools import lru_cache

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
    route_agent_model: str = "claude-opus-4-8"


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""

    return Settings()
