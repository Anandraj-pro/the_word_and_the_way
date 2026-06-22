"""The Word and the Way — backend.

A single local FastAPI app serving the one room. Offline-first: SQLite on disk, no cloud.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import select

from . import rag
from .confessions_loader import load_confessions
from .database import Base, SessionLocal, engine
from .models import Confession
from . import prayer as prayer_service
from . import reading as reading_service
from .routers import confessions, encounters, prayer, reading, scripture, seasons
from .seed import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_empty(db)
        reading_service.seed_plan_if_empty(db)  # the daily reading plan
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
