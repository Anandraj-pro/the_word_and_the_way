"""The daily reading — today's passage on the Desk, and marking it read."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import reading as reading_service
from ..database import get_db
from ..schemas import ReadingComplete, ReadingToday

router = APIRouter(prefix="/api/reading", tags=["reading"])


@router.get("/today", response_model=ReadingToday)
def get_today(db: Session = Depends(get_db)):
    return reading_service.today_reading(db)


@router.post("/complete", response_model=ReadingToday)
def complete(payload: ReadingComplete, db: Session = Depends(get_db)):
    return reading_service.complete_today(db, payload.response, payload.reference)
