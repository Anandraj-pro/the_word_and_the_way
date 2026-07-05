"""The Vine — the daily-abiding rhythm at the Desk.

Thin router over the abiding service: read today's tending, name the morning's plan, and
keep presence with a branch as the Pastor abides.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import abiding as abiding_service
from ..database import get_db
from ..schemas import AbidingPlan, AbidingTend, AbidingToday

router = APIRouter(prefix="/api/abiding", tags=["abiding"])


@router.get("/today", response_model=AbidingToday)
def get_today(db: Session = Depends(get_db)):
    return abiding_service.today_abiding(db)


@router.post("/plan", response_model=AbidingToday)
def set_plan(payload: AbidingPlan, db: Session = Depends(get_db)):
    return abiding_service.set_plan(db, payload.branches)


@router.post("/tend", response_model=AbidingToday)
def tend(payload: AbidingTend, db: Session = Depends(get_db)):
    try:
        return abiding_service.tend(db, payload.branch, payload.seconds)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
