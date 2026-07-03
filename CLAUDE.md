# The Word and the Way

A personal spiritual application. The guiding idea is the single most important
thing to internalize before changing anything:

> **It is one room, not a dashboard of features.** You enter facing the **Altar of
> Remembrance**, with the **Desk**, **Shelves**, **Wall**, and **Window** framing it.
> Everything in the room is one object — an **Encounter** — moving along a single path:
> **Receive → Reflect → Declare → Carry → Witness**.

Read [`docs/room-architecture.md`](docs/room-architecture.md) (the north star) before
reworking UX or data flow. Do **not** turn stations into routed pages or a feature grid.

## Shape of the repo

```
backend/   FastAPI · SQLAlchemy · SQLite — the Encounter spine + services   → backend/CLAUDE.md
frontend/  React · TypeScript · Tailwind v4 · Vite — the one room (UI)       → frontend/CLAUDE.md
docs/      room-architecture.md (north star), corpus, design notes           → docs/CLAUDE.md
```

## Run it (two local processes, offline-first — SQLite on disk, no cloud)

```bash
# backend — http://127.0.0.1:8000 (API docs at /docs)
cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000

# frontend — http://localhost:5173 (proxies /api → :8000)
cd frontend && npm run dev
```

The DB is created and seeded on first backend boot. See the folder CLAUDE.md files for
setup details.

## Conventions that bind the whole repo

- **Voice.** Code comments are sparse and written in the room's contemplative voice
  (e.g. "the wall you face on entry"). Match that register; don't add noisy boilerplate.
- **Aesthetic.** "Ember & Stone" — terracotta / stone / linen / ink, with Abril Fatface
  (display) + Source Serif 4 (body). Tokens live in `frontend/src/index.css`.
- **Don't commit artifacts.** `node_modules/`, `frontend/dist/`, `*.tsbuildinfo`,
  `_bmad-output/`, and the SQLite DB / `chroma_db/` are build/runtime artifacts — all
  covered by the root `.gitignore` (its `node_modules/` rule matches at any depth, so
  `frontend/node_modules` is ignored, not tracked). Still, stage paths explicitly and
  never `git add -A`, to keep stray runtime files out.
- **Branch.** Solo project; work has historically landed directly on `master`.
