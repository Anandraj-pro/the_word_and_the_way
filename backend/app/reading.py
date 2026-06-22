"""The daily reading rhythm — today's passage at the Desk, and the streak that keeps it.

This restores the founding intent: a daily tracker to read the Bible. The plan is an
ordered list of passages; today's reading is the next one not yet completed, so the
content never races ahead of you. Completing a reading can become that day's Encounter.
"""
from datetime import date, timedelta

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from . import bible
from .models import (
    Encounter,
    ReadingLog,
    ReadingPlanEntry,
    Season,
    Stage,
)

# Default plan: the Gospel of John, one chapter a day. Finite, whole, easily swapped.
DEFAULT_PLAN = [f"John {chapter}" for chapter in range(1, 22)]

# A free reading (a chapter the Pastor chose off-plan) is logged with this day_index so it
# keeps the daily streak without advancing the plan's ordered progress.
_FREE_READING = 0


def _normalize_ref(reference: str) -> str:
    """Loose comparison key — case- and whitespace-insensitive ("john  1" == "John 1")."""
    return " ".join(reference.split()).lower()


def seed_plan_if_empty(db: Session) -> None:
    if db.scalar(select(ReadingPlanEntry).limit(1)) is not None:
        return
    db.add_all(
        ReadingPlanEntry(day_index=i, reference=ref)
        for i, ref in enumerate(DEFAULT_PLAN, start=1)
    )
    db.commit()


def _streak(db: Session, today: date) -> int:
    """Consecutive calendar days, ending today or yesterday, with a completed reading."""
    dates = set(db.scalars(select(ReadingLog.completed_on).distinct()).all())
    if not dates:
        return 0
    # The streak is alive if read today, or not-yet-today but read yesterday.
    if today in dates:
        cursor = today
    elif (today - timedelta(days=1)) in dates:
        cursor = today - timedelta(days=1)
    else:
        return 0
    count = 0
    while cursor in dates:
        count += 1
        cursor -= timedelta(days=1)
    return count


def today_reading(db: Session) -> dict:
    """The reading to show on the Desk now, with progress and streak."""
    total = db.scalar(select(func.count()).select_from(ReadingPlanEntry)) or 0
    today = date.today()
    streak = _streak(db, today)

    # Plan progress counts only plan readings — a free chapter never consumes the plan.
    plan_done = db.scalar(
        select(func.count()).select_from(ReadingLog).where(ReadingLog.day_index > 0)
    ) or 0
    plan_entry = db.scalar(
        select(ReadingPlanEntry).where(ReadingPlanEntry.day_index == plan_done + 1)
    )

    last = db.scalar(select(ReadingLog).order_by(desc(ReadingLog.completed_on), desc(ReadingLog.id)))
    read_today = last is not None and last.completed_on == today

    if read_today:
        status = "done_today"
    elif plan_entry is not None:
        status = "to_read"
    else:
        status = "plan_complete"

    # After a *plan* reading, show the chapter just read with tomorrow's as the look-ahead.
    # Otherwise (not yet read, or only a free reading today) show the next plan chapter.
    if read_today and last.day_index > 0:
        entry = db.scalar(select(ReadingPlanEntry).where(ReadingPlanEntry.day_index == last.day_index))
        next_entry = plan_entry
    else:
        entry = plan_entry
        next_entry = None

    result = {
        "status": status,
        "day_index": entry.day_index if entry else None,
        "reference": entry.reference if entry else None,
        "text": None,
        "translation": None,
        "total": total,
        "completed": plan_done,
        "streak": streak,
        "next_reference": next_entry.reference if next_entry else None,
    }

    if entry is not None:
        try:
            verse = bible.lookup(db, entry.reference)
            if verse:
                result["reference"] = verse["reference"]
                result["text"] = verse["text"]
                result["translation"] = verse["translation"]
        except bible.ScriptureUnavailable:
            pass  # show the reference; the text simply isn't available offline yet
    return result


def complete_today(db: Session, response: str | None, reference: str | None = None) -> dict:
    """Mark today's reading done — the plan's chapter, or any chapter the Pastor freely read.

    A `reference` matching the plan's next chapter advances the plan; a different chapter is
    a free reading that keeps the streak (and may become an Encounter) without consuming the
    plan. Either way a response given becomes today's Encounter against the chapter read.
    """
    today = date.today()
    last = db.scalar(select(ReadingLog).order_by(desc(ReadingLog.completed_on), desc(ReadingLog.id)))
    if last is not None and last.completed_on == today:
        return today_reading(db)  # already read today — nothing to do

    plan_done = db.scalar(
        select(func.count()).select_from(ReadingLog).where(ReadingLog.day_index > 0)
    ) or 0
    plan_entry = db.scalar(
        select(ReadingPlanEntry).where(ReadingPlanEntry.day_index == plan_done + 1)
    )

    # What did the Pastor read? An explicit reference (free reading) wins; else the plan's next.
    if reference and reference.strip():
        chosen = reference.strip()
        on_plan = plan_entry is not None and _normalize_ref(chosen) == _normalize_ref(plan_entry.reference)
    else:
        chosen = plan_entry.reference if plan_entry else None
        on_plan = plan_entry is not None

    if chosen is None:
        return today_reading(db)  # plan finished and nothing else chosen

    read_ref = plan_entry.reference if on_plan else chosen
    logged_day_index = plan_entry.day_index if on_plan else _FREE_READING

    verse_text = None
    try:
        verse = bible.lookup(db, read_ref)
        verse_text = verse["text"] if verse else None
    except bible.ScriptureUnavailable:
        pass

    encounter_id = None
    if response and response.strip():
        open_season = db.scalar(select(Season).where(Season.closed_on.is_(None)))
        encounter = Encounter(
            scripture=read_ref,
            scripture_text=verse_text,
            words=response.strip(),
            stage=Stage.received,
            season_id=open_season.id if open_season else None,
        )
        db.add(encounter)
        db.flush()
        encounter_id = encounter.id

    db.add(
        ReadingLog(
            day_index=logged_day_index,
            reference=read_ref,
            completed_on=today,
            encounter_id=encounter_id,
        )
    )
    db.commit()
    return today_reading(db)
