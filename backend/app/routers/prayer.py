"""The daily watch — prayer foci, marked prayed each day, at the Desk."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import prayer as prayer_service
from ..database import get_db
from ..schemas import PrayerFocusCreate, PrayerToday

router = APIRouter(prefix="/api/prayer", tags=["prayer"])


@router.get("/today", response_model=PrayerToday)
def get_today(db: Session = Depends(get_db)):
    return prayer_service.today_watch(db)


@router.post("/{focus_id}/pray", response_model=PrayerToday)
def pray(focus_id: int, db: Session = Depends(get_db)):
    result = prayer_service.toggle(db, focus_id)
    if result is None:
        raise HTTPException(404, "Prayer focus not found")
    return result


@router.post("/focus", response_model=PrayerToday, status_code=201)
def add_focus(payload: PrayerFocusCreate, db: Session = Depends(get_db)):
    return prayer_service.add_focus(db, payload.label, payload.scripture)


@router.delete("/focus/{focus_id}", response_model=PrayerToday)
def remove_focus(focus_id: int, db: Session = Depends(get_db)):
    result = prayer_service.remove_focus(db, focus_id)
    if result is None:
        raise HTTPException(404, "Prayer focus not found")
    return result
