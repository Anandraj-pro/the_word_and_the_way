"""Scripture lookup — the Desk fills in a verse when a reference is received."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import bible
from ..database import get_db
from ..schemas import PassageRead, ScriptureRead

router = APIRouter(prefix="/api/scripture", tags=["scripture"])


@router.get("", response_model=ScriptureRead)
def get_scripture(
    reference: str = Query(..., description="A reference, e.g. 'Psalm 27:14'"),
    translation: str = Query(bible.DEFAULT_TRANSLATION),
    db: Session = Depends(get_db),
):
    try:
        result = bible.lookup(db, reference, translation)
    except bible.ScriptureUnavailable:
        raise HTTPException(503, "Couldn't reach the verse source. Check your connection.")
    if result is None:
        raise HTTPException(404, "No verse found for that reference.")
    return result


@router.get("/passage", response_model=PassageRead)
def get_passage(
    reference: str = Query(..., description="A whole chapter, e.g. 'John 1'"),
    translation: str = Query(bible.DEFAULT_TRANSLATION),
    db: Session = Depends(get_db),
):
    """A chapter broken into numbered verses, for the book reader."""
    try:
        result = bible.lookup_passage(db, reference, translation)
    except bible.ScriptureUnavailable:
        raise HTTPException(503, "Couldn't reach the verse source. Check your connection.")
    if result is None:
        raise HTTPException(404, "No passage found for that reference.")
    return result
