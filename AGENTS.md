# Agents Workflow Guide

Use this file as the source of truth for future changes in this repository.

## Project layout and command map

- Frontend lives in `spa/`. It is a React + TypeScript + Vite SPA with its own
  `package.json`, source files under `spa/src/`, public assets under
  `spa/public/`, and Vite/Vitest/TypeScript config files in the `spa/` folder.
- Backend lives in `backend/`. It is a FastAPI service with app code under
  `backend/app/`, tests under `backend/tests/`, and Python project/dependency
  files in `backend/`.
- Product and planning docs live in `docs/`.
- The root `Makefile` is the preferred command entrypoint. It wraps the
  frontend and backend commands so agents can run common workflows from the repo
  root without guessing package-manager or runtime details.

### Makefile targets

- `make install` installs both frontend (`npm install`) and backend (`uv sync`)
  dependencies.
- `make run-spa` starts the local Vite frontend dev server from `spa/`.
- `make run-backend` starts the FastAPI backend from `backend/`, honoring
  `ROADMUSE_HOST` and `ROADMUSE_PORT` when set.
- `make build-spa` builds the frontend for local verification.
- `make build-pages` builds the frontend for GitHub Pages deployment.
- `make lint` runs frontend type-checking plus backend Ruff and mypy checks.
- `make test` runs frontend coverage tests plus backend pytest tests.
- `make test-watch` runs the frontend tests in watch mode.
- `make install-hooks` installs the repo pre-commit hook.
- `make reset` refreshes local `main` from `origin/main`.

## Branching policy (before starting code changes)

1. Create a new branch for every ticket.
2. Use one of these patterns:
   - `feat/<N>-<DESCRIPTION>` for feature work
   - `fix/<N>-<DESCRIPTION>` for fixes
   - `ref/<N>-<DESCRIPTION>` for refactoring
3. `N` is the ticket number. It can be skipped if there is no associated issue.
4. `<DESCRIPTION>` is a short kebab-case summary (lowercase, hyphen-separated).

### Branch examples

- `feat/42-add-navigation-home-link`
- `fix/7-handle-empty-route-input`
- `ref/move-frontend-to-spa`

## Required workflow after code change

Before finishing a task, ensure all of the following are done:

1. Run lint.
2. Run tests.
3. Ensure test coverage is 80% or higher.
4. Commit the change.
5. Push to remote.

Add the issue ID in the commit message: `Commit message first line (#<N>)`.

## PR requirements (when asked to create a PR)

A pull request must include the following sections:

1. **Issue reference**
   - The source issue number and direct link.
2. **Problem**
   - What was wrong/needed.
3. **Solution**
   - What was changed and why.
4. **List of changes**
   - Bullet list of file-level changes.
5. **Validation**
   - Commands run (lint/test/build/checks).
   - Results summary.

Add the issue ID in the PR title: `PR title (#<N>)`.

## Suggested PR body format

```markdown
## Issue
- Closes #<N>

## Problem
- <brief problem statement>

## Solution
- <brief solution summary>

## List of changes
- <itemized file-level changes>

## Validation
- make lint
- make test
- (any additional checks)
```
