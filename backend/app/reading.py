"""The daily reading rhythm — a reading goal at the Desk, and the streak that keeps its pace.

A goal is a book (or a range of its chapters) read at a chosen pace: so many chapters per
day or per week. The Desk shows the next chapter still unread, how much of this period's
pace is met, and a streak of consecutive periods the pace was kept. Reading a chapter logs
it; a chapter outside the goal's scope is a free reading that keeps the look-back without
counting toward the goal.
"""
from collections import Counter
from datetime import date, timedelta

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from . import bible, canon
from .models import (
    Encounter,
    ReadingGoal,
    ReadingLog,
    Season,
    Stage,
)

# The goal the room opens with until the Pastor sets their own: John, a chapter a day.
DEFAULT_GOAL = {
    "book": "John",
    "start_chapter": 1,
    "end_chapter": 21,
    "pace_count": 1,
    "pace_unit": "day",
}


def _normalize_ref(reference: str) -> str:
    """Loose comparison key — case- and whitespace-insensitive ("john  1" == "John 1")."""
    return " ".join((reference or "").split()).lower()


def active_goal(db: Session) -> ReadingGoal | None:
    return db.scalar(
        select(ReadingGoal).where(ReadingGoal.active.is_(True)).order_by(desc(ReadingGoal.id))
    )


def seed_goal_if_empty(db: Session) -> None:
    """Plant the default goal once, and adopt any prior readings of its book into it."""
    if db.scalar(select(ReadingGoal).limit(1)) is not None:
        return
    goal = ReadingGoal(**DEFAULT_GOAL, active=True)
    db.add(goal)
    db.flush()
    # Bring forward any readings already kept in the goal's scope, so progress isn't lost.
    scope = {_normalize_ref(r) for r in _goal_chapters(goal)}
    for log in db.scalars(select(ReadingLog).where(ReadingLog.goal_id.is_(None))).all():
        if _normalize_ref(log.reference) in scope:
            log.goal_id = goal.id
    db.commit()


def set_goal(
    db: Session, book: str, start_chapter: int, end_chapter: int, pace_count: int, pace_unit: str
) -> ReadingGoal:
    """Retire the standing goal and set a new one, clamped to the book's real chapter range."""
    chapters = canon.chapter_count(book)
    if chapters is None:
        raise ValueError(f"Unknown book: {book!r}")
    start = max(1, min(start_chapter, chapters))
    end = max(start, min(end_chapter, chapters))
    unit = pace_unit if pace_unit in ("day", "week") else "day"
    pace = max(1, pace_count)

    for prior in db.scalars(select(ReadingGoal).where(ReadingGoal.active.is_(True))).all():
        prior.active = False
    goal = ReadingGoal(
        book=canon.BOOKS[canon.book_index(book)][0],  # canonical spelling
        start_chapter=start,
        end_chapter=end,
        pace_count=pace,
        pace_unit=unit,
        active=True,
    )
    db.add(goal)
    db.flush()
    # Adopt readings already kept within the new scope so a re-chosen goal shows real progress.
    scope = {_normalize_ref(r) for r in _goal_chapters(goal)}
    for log in db.scalars(select(ReadingLog)).all():
        if _normalize_ref(log.reference) in scope and log.goal_id != goal.id:
            log.goal_id = goal.id
    db.commit()
    db.refresh(goal)
    return goal


def _goal_chapters(goal: ReadingGoal) -> list[str]:
    """The ordered chapter references the goal covers, e.g. ['James 1', …, 'James 5']."""
    return [f"{goal.book} {n}" for n in range(goal.start_chapter, goal.end_chapter + 1)]


def _goal_label(goal: ReadingGoal) -> str:
    if goal.start_chapter == goal.end_chapter:
        return f"{goal.book} {goal.start_chapter}"
    return f"{goal.book} {goal.start_chapter}–{goal.end_chapter}"


def _read_goal_refs(db: Session, goal: ReadingGoal) -> set[str]:
    """Normalized references of the goal's chapters that have been read at least once."""
    rows = db.scalars(select(ReadingLog.reference).where(ReadingLog.goal_id == goal.id)).all()
    return {_normalize_ref(r) for r in rows}


def _next_unread(db: Session, goal: ReadingGoal) -> str | None:
    """The first chapter of the goal, in order, not yet read — or None when all are read."""
    read = _read_goal_refs(db, goal)
    for ref in _goal_chapters(goal):
        if _normalize_ref(ref) not in read:
            return ref
    return None


def _period_key(d: date, unit: str):
    """The bucket a date falls in: the date itself for 'day', the ISO (year, week) for 'week'."""
    if unit == "week":
        iso = d.isocalendar()
        return (iso[0], iso[1])
    return d


def _period_counts(db: Session, goal: ReadingGoal) -> Counter:
    """How many goal chapters were read in each period (day or week)."""
    dates = db.scalars(select(ReadingLog.completed_on).where(ReadingLog.goal_id == goal.id)).all()
    return Counter(_period_key(d, goal.pace_unit) for d in dates)


def _pace_streak(db: Session, goal: ReadingGoal, today: date) -> int:
    """Consecutive periods (ending now, or the one just past) whose pace quota was met."""
    counts = _period_counts(db, goal)
    quota = max(1, goal.pace_count)
    met = {key for key, n in counts.items() if n >= quota}
    if not met:
        return 0
    step = 1 if goal.pace_unit == "day" else 7
    # Alive if this period's quota is met, or — still mid-period — the last one was.
    if _period_key(today, goal.pace_unit) in met:
        cursor = today
    elif _period_key(today - timedelta(days=step), goal.pace_unit) in met:
        cursor = today - timedelta(days=step)
    else:
        return 0
    count = 0
    while _period_key(cursor, goal.pace_unit) in met:
        count += 1
        cursor -= timedelta(days=step)
    return count


def today_reading(db: Session) -> dict:
    """The reading to show on the Desk now — the goal's next chapter, pace, and streak."""
    goal = active_goal(db)
    if goal is None:  # nothing to read against yet
        return {
            "status": "plan_complete",
            "reference": None,
            "text": None,
            "translation": None,
            "total": 0,
            "completed": 0,
            "streak": 0,
            "pace_count": 1,
            "pace_unit": "day",
            "read_this_period": 0,
            "pace_met": False,
            "goal_label": "",
            "read_today_refs": [],
            "next_reference": None,
        }

    today = date.today()
    chapters = _goal_chapters(goal)
    total = len(chapters)
    read = _read_goal_refs(db, goal)
    completed = sum(1 for ref in chapters if _normalize_ref(ref) in read)

    period_key = _period_key(today, goal.pace_unit)
    period_logs = [
        log
        for log in db.scalars(
            select(ReadingLog).where(ReadingLog.goal_id == goal.id)
        ).all()
        if _period_key(log.completed_on, goal.pace_unit) == period_key
    ]
    read_this_period = len({_normalize_ref(log.reference) for log in period_logs})
    pace_met = read_this_period >= max(1, goal.pace_count)

    next_ref = _next_unread(db, goal)
    goal_complete = next_ref is None

    if goal_complete:
        status = "plan_complete"
        shown_reference = chapters[-1] if chapters else None
        look_ahead = None
    else:
        status = "done_today" if pace_met else "to_read"
        shown_reference = next_ref
        idx = chapters.index(next_ref)
        look_ahead = chapters[idx + 1] if idx + 1 < len(chapters) else None

    read_today_refs = [
        log.reference for log in period_logs if log.completed_on == today
    ]

    result = {
        "status": status,
        "reference": shown_reference,
        "text": None,
        "translation": None,
        "total": total,
        "completed": completed,
        "streak": _pace_streak(db, goal, today),
        "pace_count": goal.pace_count,
        "pace_unit": goal.pace_unit,
        "read_this_period": read_this_period,
        "pace_met": pace_met,
        "goal_label": _goal_label(goal),
        "read_today_refs": read_today_refs,
        "next_reference": look_ahead,
    }

    if shown_reference is not None:
        try:
            verse = bible.lookup(db, shown_reference)
            if verse:
                result["reference"] = verse["reference"]
                result["text"] = verse["text"]
                result["translation"] = verse["translation"]
        except bible.ScriptureUnavailable:
            pass  # show the reference; the text simply isn't available offline yet
    return result


def recent_readings(db: Session, days: int = 7) -> dict:
    """The readings of the recent days — what was covered, newest first, for looking back.

    A window over the calendar (default a week): every chapter logged, toward a goal or
    free, with the day it was kept and whether it became an Encounter.
    """
    days = max(1, min(days, 90))
    today = date.today()
    since = today - timedelta(days=days - 1)
    logs = db.scalars(
        select(ReadingLog)
        .where(ReadingLog.completed_on >= since)
        .order_by(desc(ReadingLog.completed_on), desc(ReadingLog.id))
    ).all()
    return {
        "days": days,
        "days_read": len({log.completed_on for log in logs}),
        "chapters": len(logs),
        "entries": [
            {
                "reference": log.reference,
                "completed_on": log.completed_on,
                "on_plan": log.goal_id is not None,
                "became_encounter": log.encounter_id is not None,
            }
            for log in logs
        ],
    }


def complete_reading(db: Session, response: str | None, reference: str | None = None) -> dict:
    """Log a chapter read today — the goal's next chapter, or any chapter freely read.

    Multiple chapters can be kept in one day (a pace of more than one, or simply reading
    on). The same chapter is not logged twice in a day. A chapter within the active goal's
    scope counts toward it; anything else is a free reading. A response given becomes that
    day's Encounter against the chapter read.
    """
    today = date.today()
    goal = active_goal(db)

    chosen = (reference or "").strip()
    if not chosen:
        chosen = _next_unread(db, goal) if goal is not None else None
    if not chosen:
        return today_reading(db)

    norm = _normalize_ref(chosen)
    todays = db.scalars(select(ReadingLog).where(ReadingLog.completed_on == today)).all()
    if any(_normalize_ref(log.reference) == norm for log in todays):
        return today_reading(db)  # already kept this chapter today — nothing to add

    in_scope = goal is not None and norm in {_normalize_ref(r) for r in _goal_chapters(goal)}
    goal_id = goal.id if in_scope else None

    verse_text = None
    try:
        verse = bible.lookup(db, chosen)
        verse_text = verse["text"] if verse else None
    except bible.ScriptureUnavailable:
        pass

    encounter_id = None
    if response and response.strip():
        open_season = db.scalar(select(Season).where(Season.closed_on.is_(None)))
        encounter = Encounter(
            scripture=chosen,
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
            reference=chosen,
            completed_on=today,
            goal_id=goal_id,
            encounter_id=encounter_id,
        )
    )
    db.commit()
    return today_reading(db)
