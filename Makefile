UV_CACHE_DIR ?= $(CURDIR)/.cache/uv
export UV_CACHE_DIR

run-spa:
	cd spa && npm run dev

run-backend:
	cd backend && uv run uvicorn app.main:app --reload --host $${ROADMUSE_HOST:-127.0.0.1} --port $${ROADMUSE_PORT:-8000}

build-spa:
	cd spa && npm run build

build-pages:
	cd spa && npm run build:pages

lint:
	cd spa && npm run lint
	cd backend && uv run ruff check . && uv run mypy

test:
	cd spa && npm run test
	cd backend && uv run pytest

test-watch:
	cd spa && npm run test:watch

install-hooks:
	mkdir -p .git/hooks && ln -sf ../.githooks/pre-commit .git/hooks/pre-commit

install:
	cd spa && npm install
	cd backend && uv sync

reset:
	git fetch origin main
	git checkout -B main origin/main

.PHONY: run-spa run-backend build-spa build-pages lint test test-watch install install-hooks reset
