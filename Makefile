run:
	npm run dev

run-backend:
	cd backend && uv run python -m app

lint:
	npm run lint
	cd backend && uv run ruff check . && uv run mypy

test:
	npm run test
	cd backend && uv run pytest

install-hooks:
	mkdir -p .git/hooks && ln -sf ../.githooks/pre-commit .git/hooks/pre-commit

install:
	npm install
	cd backend && uv sync

reset:
	git fetch origin main
	git checkout -B main origin/main

.PHONY: run run-backend lint test install install-hooks reset
