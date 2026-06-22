"""The Wall corpus — inherited confessions the Pastor reads and declares from."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import rag
from ..database import get_db
from ..models import Confession
from ..schemas import ConfessionRead, ConfessionSummary

router = APIRouter(prefix="/api/confessions", tags=["confessions"])


class ConfessionSearchQuery(BaseModel):
    q: str
    n: int = 5


@router.get("", response_model=list[ConfessionSummary])
def list_confessions(db: Session = Depends(get_db)):
    """Every confession on the Wall, by title — the browsable library."""
    stmt = select(Confession).order_by(Confession.title.asc())
    return db.scalars(stmt).all()


@router.post("/search", response_model=list[ConfessionSummary])
def search_confessions(query: ConfessionSearchQuery, db: Session = Depends(get_db)):
    """Semantic search — returns confessions most relevant to a topic or need."""
    slugs = rag.search(query.q, n=query.n)
    if not slugs:
        return []
    rows = db.scalars(select(Confession).where(Confession.slug.in_(slugs))).all()
    slug_order = {slug: i for i, slug in enumerate(slugs)}
    return sorted(rows, key=lambda c: slug_order.get(c.slug, 999))


@router.get("/{slug}", response_model=ConfessionRead)
def get_confession(slug: str, db: Session = Depends(get_db)):
    """One confession unrolled — full text to read aloud and declare."""
    confession = db.scalar(select(Confession).where(Confession.slug == slug))
    if confession is None:
        raise HTTPException(404, "Confession not found")
    return confession
