# CLAUDE.md — AI Coding-Tool Rules for Sahay AI

> **Every AI coding assistant (Claude, Gemini, Copilot, Cursor, etc.) working on this repo MUST read and follow this file.**

---

## Project Summary

**Sahay AI** is an AI-powered emergency response and resource coordination platform built for Bit N Build'26 (PS-9). It collects multi-source incident reports, uses AI to classify and deduplicate them, recommends resources, and shows everything on a real-time command dashboard.

- **Repository:** Public on GitHub — never commit secrets.
- **Stack:** Python/FastAPI backend, React/Vite frontend, LLM API with fallback classifier.

---

## Folder Ownership

| Folder | Owner | Notes |
|---|---|---|
| `/backend` | **Person A** | Python, FastAPI, database, AI pipeline |
| `/frontend` | **Person B** | React, Vite, Tailwind, dashboard UI |
| Root docs | **Either** | But tell the other person before editing |

### Rules

- **Never edit the other person's folder.** If you need a backend change and you own frontend, update `API_SPEC.md` and communicate — don't touch `/backend`.
- **Root-level docs** (README, API_SPEC, PROGRESS, etc.) can be edited by either person, but you must inform the other person of the change.

---

## API Contract

> **`API_SPEC.md` is the single source of truth for all API endpoints and data shapes.**

- Before changing **any** endpoint URL, request/response body, or enum value — **update `API_SPEC.md` first**.
- Both people must agree on API changes before implementing them.
- JSON field names, enum values, and timestamp formats must match `API_SPEC.md` exactly.

---

## Naming & Data Conventions

| Rule | Example |
|---|---|
| JSON fields: **snake_case** | `incident_id`, `created_at`, `report_count` |
| Timestamps: **ISO 8601 UTC** | `2026-09-19T04:12:00Z` |
| Enum values: **exactly as in API_SPEC.md** | `flood`, `critical`, `en_route` |
| IDs: **integers** | `1`, `42` |
| Coordinates: **lat/lng as floats** | `22.3072, 73.1812` |

---

## Git Rules

1. **Small, frequent commits** with conventional prefixes:
   - `feat:` — new feature
   - `fix:` — bug fix
   - `chore:` — tooling, config, dependencies
   - `docs:` — documentation only
   - `test:` — adding or updating tests

2. **Always pull before pushing:**
   ```bash
   git pull --rebase origin main
   ```

3. **Never force-push** (`--force` or `--force-with-lease`) to `main`.

4. **Never commit secrets or `.env` files.** The repo is **PUBLIC**.
   - API keys go in `.env` (git-ignored).
   - Placeholder values go in `.env.example`.

5. **Check `git status`** before every commit — no `.env`, `*.db`, `__pycache__/`, or `node_modules/` should be staged.

---

## Security

- **Never hardcode API keys** — always read from environment variables.
- **No real personal data** in code, tests, or seed data — use fictional names and locations.
- **The repository is PUBLIC.** Treat every commit as visible to the world.

---

## Resilience

- **The app must not crash when the LLM API is unavailable.**
- When the LLM call fails or times out, the system must fall back to the **keyword-based fallback classifier**.
- All external API calls must have **timeouts and error handling**.

---

## Coding Standards

### Python (Backend)

- **Type hints** on all function signatures.
- **Pydantic models** for request/response validation.
- Async functions where appropriate (FastAPI async endpoints).
- Meaningful variable names — no single-letter names outside loops.
- Docstrings on public functions and classes.

### React (Frontend)

- **Functional components** only (no class components).
- **Hooks** for state management and side effects.
- **PropTypes or TypeScript** for component props (if using JS, use PropTypes).
- Clear component hierarchy — small, focused, reusable components.
- Error boundaries for graceful failure.

### General

- Handle errors explicitly — no silent catches.
- Log errors with enough context to debug.
- Keep functions short and focused (< 50 lines where practical).

---

## Before You Finish a Task — Checklist

Before you consider any task done, run through this checklist:

- [ ] **Run the app** — does it start without errors?
- [ ] **Run tests** — do all existing tests pass? (`pytest` for backend, `npm test` for frontend)
- [ ] **No lint errors** — check for obvious issues.
- [ ] **Update `PROGRESS.md`** — log what you did and what's next.
- [ ] **Check `git status`** — no secrets, no `.env`, no database files, no `node_modules/`.
- [ ] **Commit and push** — small commit with a proper prefix message.
- [ ] **Tell your teammate** — if your change affects the API contract or shared config.

---

## Quick Reference

```
API Contract  →  API_SPEC.md (update BEFORE changing endpoints)
Progress Log  →  PROGRESS.md (update AFTER completing work)
Env Template  →  .env.example (update if you add new env vars)
AI Rules      →  CLAUDE.md (this file)
```
