"""Encounters — the single spine. Every station reads and writes this one object."""
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import CORNERSTONE_CARRY_THRESHOLD, Encounter, Season, Stage
from ..schemas import EncounterCreate, EncounterKeep, EncounterRead, EncounterUpdate

router = APIRouter(prefix="/api/encounters", tags=["encounters"])


@router.get("", response_model=list[EncounterRead])
def list_encounters(
    stage: Stage | None = Query(None, description="Filter by point on the path"),
    season_id: int | None = Query(None, description="Filter to one season (the Shelves)"),
    db: Session = Depends(get_db),
):
    stmt = select(Encounter).order_by(Encounter.received_on.desc())
    if stage is not None:
        stmt = stmt.where(Encounter.stage == stage)
    if season_id is not None:
        stmt = stmt.where(Encounter.season_id == season_id)
    return db.scalars(stmt).all()


@router.get("/altar", response_model=list[EncounterRead])
def altar(db: Session = Depends(get_db)):
    """Cornerstone promises — carried 3+ seasons. The wall the Pastor faces on entry.

    Most-carried sit deepest (worn into the stone by returning hands), so order by
    carry_count descending.
    """
    stmt = (
        select(Encounter)
        .where(Encounter.carry_count >= CORNERSTONE_CARRY_THRESHOLD)
        .order_by(Encounter.carry_count.desc(), Encounter.received_on.asc())
    )
    return db.scalars(stmt).all()


@router.get("/on-this-day", response_model=list[EncounterRead])
def on_this_day(db: Session = Depends(get_db)):
    """Encounters received on this calendar day in past years — gentle remembrance."""
    today = date.today()
    stmt = select(Encounter).where(Encounter.received_on < today - timedelta(days=1))
    matches = [
        e
        for e in db.scalars(stmt).all()
        if e.received_on.month == today.month and e.received_on.day == today.day
    ]
    return matches


@router.get("/kept-verses", response_model=list[int])
def kept_verses(reference: str, db: Session = Depends(get_db)):
    """Verse numbers already kept in a chapter (e.g. 'John 3' -> [16]) — for highlighting."""
    prefix = " ".join(reference.split())  # normalize whitespace: "John  3" -> "John 3"
    rows = db.scalars(
        select(Encounter.scripture).where(Encounter.scripture.like(f"{prefix}:%"))
    ).all()
    numbers: set[int] = set()
    for scripture in rows:
        tail = (scripture or "").rsplit(":", 1)[-1].strip()  # the part after the last ':'
        digits = ""
        for ch in tail:  # leading digits only — "16", or "16-18" -> 16
            if ch.isdigit():
                digits += ch
            else:
                break
        if digits:
            numbers.add(int(digits))
    return sorted(numbers)


@router.post("/keep", response_model=EncounterRead, status_code=201)
def keep_verse(payload: EncounterKeep, db: Session = Depends(get_db)):
    """Keep a single verse to meditate on — a received Encounter joined to the open season,
    so it lands on the Desk ready to be carried toward the Altar."""
    open_season = db.scalar(select(Season).where(Season.closed_on.is_(None)))
    encounter = Encounter(
        scripture=payload.scripture,
        scripture_text=payload.scripture_text,
        words=payload.words or None,
        stage=Stage.received,
        season_id=open_season.id if open_season else None,
    )
    db.add(encounter)
    db.commit()
    db.refresh(encounter)
    return encounter


@router.get("/dwelling", response_model=list[EncounterRead])
def dwelling(db: Session = Depends(get_db)):
    """Verses still being meditated on — a verse-level scripture, carried but not yet a
    cornerstone. The 'dwelling on' strip at the Desk. Newest first."""
    stmt = (
        select(Encounter)
        .where(Encounter.scripture.like("%:%"))  # a verse ref ("John 3:16"), not a chapter
        .where(Encounter.stage.in_([Stage.received, Stage.reflecting]))
        .where(Encounter.carry_count < CORNERSTONE_CARRY_THRESHOLD)
        .order_by(Encounter.received_on.desc(), Encounter.id.desc())
    )
    return db.scalars(stmt).all()


@router.get("/{encounter_id}", response_model=EncounterRead)
def get_encounter(encounter_id: int, db: Session = Depends(get_db)):
    encounter = db.get(Encounter, encounter_id)
    if encounter is None:
        raise HTTPException(404, "Encounter not found")
    return encounter


@router.post("", response_model=EncounterRead, status_code=201)
def create_encounter(payload: EncounterCreate, db: Session = Depends(get_db)):
    encounter = Encounter(**payload.model_dump())
    db.add(encounter)
    db.commit()
    db.refresh(encounter)
    return encounter


@router.patch("/{encounter_id}", response_model=EncounterRead)
def update_encounter(
    encounter_id: int, payload: EncounterUpdate, db: Session = Depends(get_db)
):
    encounter = db.get(Encounter, encounter_id)
    if encounter is None:
        raise HTTPException(404, "Encounter not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(encounter, field, value)
    db.commit()
    db.refresh(encounter)
    return encounter


@router.post("/{encounter_id}/carry", response_model=EncounterRead)
def carry_forward(encounter_id: int, db: Session = Depends(get_db)):
    """Carry a word into a new season.

    The word stays where it is (still received/reflecting on the Desk) and only its
    carry_count rises — until it has been carried through three seasons. At that point
    it becomes a cornerstone: stage -> carried, and it leaves the Desk for the Altar.
    """
    encounter = db.get(Encounter, encounter_id)
    if encounter is None:
        raise HTTPException(404, "Encounter not found")
    encounter.carry_count += 1
    if encounter.carry_count >= CORNERSTONE_CARRY_THRESHOLD:
        encounter.stage = Stage.carried
    db.commit()
    db.refresh(encounter)
    return encounter


@router.delete("/{encounter_id}", status_code=204)
def delete_encounter(encounter_id: int, db: Session = Depends(get_db)):
    encounter = db.get(Encounter, encounter_id)
    if encounter is None:
        raise HTTPException(404, "Encounter not found")
    db.delete(encounter)
    db.commit()
