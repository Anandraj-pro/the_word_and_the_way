# backend — FastAPI · SQLAlchemy · SQLite

The local server for the one room. Offline-first: SQLite on disk, no cloud. All app code
lives in `app/`. See the repo-root [`CLAUDE.md`](../CLAUDE.md) for the "one room" model.

## Setup & run

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload --port 8000   # docs at /127.0.0.1:8000/docs
```

## How a boot works (`app/main.py` lifespan)

On startup it: creates tables → runs `_migrate_reading_goal` (a hand ALTER — see below) →
seeds idempotently (`seed_if_empty`, `reading_service.seed_goal_if_empty`,
`prayer_service.seed_prayer_if_empty`) → `load_confessions(db)` syncs the Wall corpus from
`../docs/confessions_md` every boot → `rag.index_confessions(...)` embeds any new
confessions into ChromaDB. Seeding is safe to re-run.

> **`create_all` never ALTERs existing tables** — it only makes missing ones. New tables
> (e.g. `reading_goal`) appear automatically, but a new *column* on an existing table needs
> a hand migration in the lifespan (`_migrate_reading_goal` adds `reading_log.goal_id` if
> absent). Follow that pattern for future column adds; don't expect `create_all` to do it.

## Layout

```
app/
  main.py              FastAPI app + lifespan (seed/sync/index); CORS for :5173
  database.py          engine, SessionLocal, Base
  models.py            SQLAlchemy models — the Encounter is the spine
  schemas.py           Pydantic request/response models
  seed.py              initial data
  bible.py             scripture text lookup
  reading.py           reading-goal service (the Desk's "In the Word") — see below
  prayer.py            daily prayer watch service (the Desk's "The Watch")
  rag.py               ChromaDB semantic search over confessions (embeddings via Ollama)
  confessions_loader.py  sync ../docs/confessions_md → DB
  routers/             encounters, seasons, confessions, scripture, reading, prayer
```

## The reading model — goals, not a fixed plan (`reading.py`)

"In the Word" at the Desk runs on a **`ReadingGoal`**, not the old hardcoded John plan.

- **A goal is a book + chapter range read at a pace.** `book`, `start_chapter`,
  `end_chapter` (one book; range inclusive), plus `pace_count` chapters per `pace_unit`
  (`"day"` | `"week"`). **One goal is `active` at a time** — `set_goal` retires the prior.
  The default seeded goal is John 1–21 @ 1/day. Chapter ranges are clamped to the book's
  real length via `canon.py` (the 66-book canon, mirrors `frontend/src/bibleBooks.ts`).
- **Reading logs can be many per day.** `complete_reading` lifted the old one-per-day rule:
  any number of distinct chapters log in a day; the *same* chapter is idempotent per day.
  A chapter inside the active goal's scope gets `ReadingLog.goal_id`; anything else is a
  **free reading** (`goal_id` null) — kept in the look-back, not counted toward the goal.
  `day_index` on `ReadingLog` is legacy/unused (left for the retired `ReadingPlanEntry`).
- **The streak is pace-aware.** `_pace_streak` counts consecutive *periods* (day or week,
  bucketed by `_period_key`) whose chapter quota was met — not just any-reading days. An
  in-progress period that hasn't hit quota yet doesn't break it.
- **`today_reading` is goal-centric**: returns the next unread chapter, `completed/total`,
  `read_this_period`, `pace_met`, `streak`, `goal_label`, and `read_today_refs` (the chapters
  the reader seeds as already-kept). `next_reference` is the look-ahead chapter.
- **Chapter nav rolls across books.** `bible.chapter_neighbors` uses `canon.py` so the last
  chapter of a book points to the next book's first (James 5 → 1 Peter 1), and stops at
  Genesis 1 / Revelation 22. Don't reintroduce naive `chapter ± 1`.

## Conventions & gotchas

- **Endpoints live under `/api/...`** (the frontend Vite server proxies `/api` → here).
  Routers are mounted in `main.py`; add new ones there.
- **Runtime data is gitignored**: `the_word_and_the_way.db` and `chroma_db/`. Never commit
  them. Deleting the `.db` resets the room (re-seeded on next boot).
- **Semantic search needs Ollama running locally.** If it's unreachable, the Wall falls
  back to title filtering — keep that graceful-degradation contract when touching `rag.py`.
- Keep services (`bible`/`reading`/`prayer`/`rag`) separate from routers; routers stay thin.
