# The Word and the Way

A personal spiritual room — not a dashboard of features. You enter facing the **Altar of
Remembrance**, with the **Desk**, **Shelves**, **Wall**, and **Window** framing it. See
[`docs/room-architecture.md`](docs/room-architecture.md) for the north-star design.

Everything in the room is one object — an **Encounter** — moving along a single path:
**Receive → Reflect → Declare → Carry → Witness**.

## Run it locally

Two local processes, offline-first (SQLite on disk, no cloud).

**Backend** (FastAPI, port 8000):

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload --port 8000
```

The database is created and seeded on first boot (`backend/the_word_and_the_way.db`).
API docs at http://127.0.0.1:8000/docs.

**Frontend** (Vite + React, port 5173):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend.

## Layout

```
backend/   FastAPI · SQLAlchemy · SQLite — the Encounter spine
frontend/  React · TypeScript · Tailwind v4 — the one room
docs/      room-architecture.md (north star), confessions corpus
```

## Stations → lifecycle stage

| Station    | Stage              | Component               |
|------------|--------------------|-------------------------|
| The Altar  | Carry (cornerstones) | `components/Altar.tsx`  |
| The Desk   | Receive · Reflect  | `components/Desk.tsx`   |
| The Shelves| Archive (seasons)  | `components/Shelves.tsx`|
| The Wall   | Declare            | `components/Wall.tsx`   |
| The Window | Witness            | `components/Window.tsx` |
