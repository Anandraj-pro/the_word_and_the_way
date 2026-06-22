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

On startup it: creates tables → seeds idempotently (`seed_if_empty`,
`reading_service.seed_plan_if_empty`, `prayer_service.seed_prayer_if_empty`) →
`load_confessions(db)` syncs the Wall corpus from `../docs/confessions_md` every boot →
`rag.index_confessions(...)` embeds any new confessions into ChromaDB. Seeding is safe to
re-run.

## Layout

```
app/
  main.py              FastAPI app + lifespan (seed/sync/index); CORS for :5173
  database.py          engine, SessionLocal, Base
  models.py            SQLAlchemy models — the Encounter is the spine
  schemas.py           Pydantic request/response models
  seed.py              initial data
  bible.py             scripture text lookup
  reading.py           daily reading plan service (the Desk's "In the Word")
  prayer.py            daily prayer watch service (the Desk's "The Watch")
  rag.py               ChromaDB semantic search over confessions (embeddings via Ollama)
  confessions_loader.py  sync ../docs/confessions_md → DB
  routers/             encounters, seasons, confessions, scripture, reading, prayer
```

## Conventions & gotchas

- **Endpoints live under `/api/...`** (the frontend Vite server proxies `/api` → here).
  Routers are mounted in `main.py`; add new ones there.
- **Runtime data is gitignored**: `the_word_and_the_way.db` and `chroma_db/`. Never commit
  them. Deleting the `.db` resets the room (re-seeded on next boot).
- **Semantic search needs Ollama running locally.** If it's unreachable, the Wall falls
  back to title filtering — keep that graceful-degradation contract when touching `rag.py`.
- Keep services (`bible`/`reading`/`prayer`/`rag`) separate from routers; routers stay thin.
