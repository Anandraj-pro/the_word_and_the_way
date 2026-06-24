"""The daily reading — the goal on the Desk, marking a chapter read, and setting the goal."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import reading as reading_service
from ..database import get_db
from ..schemas import (
    ReadingComplete,
    ReadingGoalRead,
    ReadingGoalSet,
    ReadingHistory,
    ReadingToday,
)

router = APIRouter(prefix="/api/reading", tags=["reading"])


def _goal_read(goal) -> ReadingGoalRead:
    return ReadingGoalRead(
        id=goal.id,
        book=goal.book,
        start_chapter=goal.start_chapter,
        end_chapter=goal.end_chapter,
        pace_count=goal.pace_count,
        pace_unit=goal.pace_unit,
        label=reading_service._goal_label(goal),
    )


@router.get("/today", response_model=ReadingToday)
def get_today(db: Session = Depends(get_db)):
    return reading_service.today_reading(db)


@router.get("/history", response_model=ReadingHistory)
def get_history(days: int = 7, db: Session = Depends(get_db)):
    return reading_service.recent_readings(db, days)


@router.get("/goal", response_model=ReadingGoalRead | None)
def get_goal(db: Session = Depends(get_db)):
    goal = reading_service.active_goal(db)
    return _goal_read(goal) if goal else None


@router.post("/goal", response_model=ReadingGoalRead)
def set_goal(payload: ReadingGoalSet, db: Session = Depends(get_db)):
    try:
        goal = reading_service.set_goal(
            db,
            payload.book,
            payload.start_chapter,
            payload.end_chapter,
            payload.pace_count,
            payload.pace_unit,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return _goal_read(goal)


@router.post("/complete", response_model=ReadingToday)
def complete(payload: ReadingComplete, db: Session = Depends(get_db)):
    return reading_service.complete_reading(db, payload.response, payload.reference)
