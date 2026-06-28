# Agents Workflow Guide

Use this file as the source of truth for future changes in this repository.

## Branching policy (before starting code changes)

1. Create a new branch for every ticket.
2. Use one of these patterns:
   - `feat/<N>-<DESCRIPTION>` for feature work
   - `fix/<N>-<DESCRIPTION>` for fixes
3. `N` is the ticket number. It can be skipped if there is no associated issue.
4. `<DESCRIPTION>` is a short kebab-case summary (lowercase, hyphen-separated).

### Branch examples

- `feat/42-add-navigation-home-link`
- `fix/7-handle-empty-route-input`

## Required workflow after code change

Before finishing a task, ensure all of the following are done:

1. Run lint.
2. Run tests.
3. Commit the change.
4. Push to remote.

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
