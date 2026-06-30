"""Health check endpoint."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    """Response body for the health check endpoint."""

    status: str


@router.get("/health")
async def health() -> HealthResponse:
    """Return service health status."""

    return HealthResponse(status="ok")
