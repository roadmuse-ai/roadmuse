"""Entrypoint for running the backend with `python -m app`.

Reads host/port from Settings so the documented ROADMUSE_HOST / ROADMUSE_PORT
environment variables actually take effect.
"""

import uvicorn

from app.config import get_settings


def main() -> None:
    """Launch the Uvicorn server using configured host and port."""

    settings = get_settings()
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)


if __name__ == "__main__":
    main()
