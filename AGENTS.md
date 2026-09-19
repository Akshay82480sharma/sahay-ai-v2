# AGENTS.md — Quick Rules for AI Coding Assistants

> **Read [`CLAUDE.md`](./CLAUDE.md) in this repo root and follow it exactly.**

This file is a short pointer for any AI agent or coding assistant working on this repository. The full rules, conventions, and checklist are in `CLAUDE.md`. Below are the **5 most important rules** for quick reference.

---

## Top 5 Rules

1. **`API_SPEC.md` is the source of truth.** Update it BEFORE changing any endpoint, request/response body, or enum value. Both team members must agree on API changes.

2. **Never edit the other person's folder.** `/backend` belongs to Person A, `/frontend` belongs to Person B. If you need a change in the other folder, communicate and update `API_SPEC.md`.

3. **Never commit secrets.** The repo is **PUBLIC**. No `.env` files, no API keys, no real personal data. Use environment variables and `.env.example` for placeholders.

4. **The app must not crash when the LLM is unavailable.** Always fall back to the keyword-based classifier. All external calls need timeouts and error handling.

5. **Small commits, always pull first.** Use `feat:/fix:/chore:/docs:/test:` prefixes. Run `git pull --rebase origin main` before pushing. Never force-push.

---

For the complete rules, coding standards, and task checklist, see **[`CLAUDE.md`](./CLAUDE.md)**.
