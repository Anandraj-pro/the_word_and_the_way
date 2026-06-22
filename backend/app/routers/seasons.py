"""Seasons — the Pastor's named containers of time. The Shelves' spines.

One season is open at a time; it is the lens the whole room looks through. You leave
a season by *crossing* into the next — an intentional ritual that closes the old with
an epitaph and carries chosen words forward.
"""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import CORNERSTONE_CARRY_THRESHOLD, Encounter, Season, Stage
from ..schemas import CrossResult, SeasonCreate, SeasonCross, SeasonRead

router = APIRouter(prefix="/api/seasons", tags=["seasons"])


def _open_season(db: Session) -> Season | None:
    return db.scalar(select(Season).where(Season.closed_on.is_(None)))


@router.get("", response_model=list[SeasonRead])
def list_seasons(db: Session = Depends(get_db)):
    return db.scalars(select(Season).order_by(Season.opened_on.desc())).all()


@router.post("", response_model=SeasonRead, status_code=201)
def open_season(payload: SeasonCreate, db: Session = Depends(get_db)):
    """Open the first season. Only allowed when none is open — otherwise you cross."""
    if _open_season(db) is not None:
        raise HTTPException(409, "A season is already open. Cross into a new one instead.")
    season = Season(**payload.model_dump())
    db.add(season)
    db.commit()
    db.refresh(season)
    return season


@router.post("/cross", response_model=CrossResult)
def cross_season(payload: SeasonCross, db: Session = Depends(get_db)):
    """Leave one season and enter the next in a single act.

    The open season is closed and given its epitaph (its name in hindsight). A new season
    is opened. Each chosen word is carried into it — carry_count rises and the word moves
    to the new season; any word that reaches the threshold is inscribed on the Altar.
    """
    closing = _open_season(db)
    if closing is None:
        raise HTTPException(409, "No open season to close. Open the first season instead.")

    closing.closed_on = date.today()
    closing.epitaph = payload.epitaph

    new_season = Season(
        name=payload.name,
        opening_scripture=payload.opening_scripture,
        opening_declaration=payload.opening_declaration,
    )
    db.add(new_season)
    db.flush()  # assign new_season.id

    carried: list[Encounter] = []
    inscribed: list[Encounter] = []
    for eid in payload.carry_encounter_ids:
        encounter = db.get(Encounter, eid)
        if encounter is None:
            continue
        was_cornerstone = encounter.is_cornerstone
        encounter.carry_count += 1
        encounter.season_id = new_season.id
        if encounter.carry_count >= CORNERSTONE_CARRY_THRESHOLD:
            encounter.stage = Stage.carried
        carried.append(encounter)
        if not was_cornerstone and encounter.is_cornerstone:
            inscribed.append(encounter)

    db.commit()
    db.refresh(new_season)
    for e in carried:
        db.refresh(e)
    return CrossResult(season=new_season, carried=carried, inscribed=inscribed)


@router.post("/{season_id}/close", response_model=SeasonRead)
def close_season(season_id: int, epitaph: str | None = None, db: Session = Depends(get_db)):
    """Close a season without opening another. The epitaph is its name in hindsight."""
    season = db.get(Season, season_id)
    if season is None:
        raise HTTPException(404, "Season not found")
    season.closed_on = date.today()
    season.epitaph = epitaph
    db.commit()
    db.refresh(season)
    return season
