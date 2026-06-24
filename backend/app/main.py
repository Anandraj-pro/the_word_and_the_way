"""The Word and the Way — backend.

A single local FastAPI app serving the one room. Offline-first: SQLite on disk, no cloud.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import inspect, select, text

from . import rag
from .confessions_loader import load_confessions
from .database import Base, SessionLocal, engine
from .models import Confession
from . import prayer as prayer_service
from . import reading as reading_service
from .routers import confessions, encounters, prayer, reading, scripture, seasons
from .seed import seed_if_empty


def _migrate_reading_goal(engine) -> None:
    """Add reading_log.goal_id to a database created before reading goals existed.

    `create_all` makes new tables but never alters existing ones, so an older `reading_log`
    needs the column added by hand — a no-op once it's there.
    """
    columns = {c["name"] for c in inspect(engine).get_columns("reading_log")}
    if "goal_id" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE reading_log ADD COLUMN goal_id INTEGER"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _migrate_reading_goal(engine)  # add goal_id to existing reading_log tables
    db = SessionLocal()
    try:
        seed_if_empty(db)
        reading_service.seed_goal_if_empty(db)  # the standing reading goal
        prayer_service.seed_prayer_if_empty(db)  # the daily prayer watch
        load_confessions(db)  # sync the Wall corpus from disk every startup
        all_confessions = db.scalars(select(Confession)).all()
        rag.index_confessions(all_confessions)  # embed any new confessions into ChromaDB
    finally:
        db.close()
    yield


app = FastAPI(title="The Word and the Way", version="0.1.0", lifespan=lifespan)

# The frontend (Vite dev server) talks to this locally.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(encounters.router)
app.include_router(seasons.router)
app.include_router(confessions.router)
app.include_router(scripture.router)
app.include_router(reading.router)
app.include_router(prayer.router)


@app.get("/api/health")
def health():
    return {"status": "the room is open"}
