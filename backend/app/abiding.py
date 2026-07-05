"""The Vine — a felt rhythm of daily practice, kept at the Desk.

Each morning the Pastor comes to *abide*: he chooses which branches of the one plant to tend
(Word · Prayer · Confession · Freestyle), then keeps presence with them while a clock quietly
sculpts each branch into the day's shape. This service records that presence — which branches,
in what order, for how long — as its own meta-layer. It does not touch the Encounter spine, the
reading logs, or the prayer logs; it is a projection of tending, nothing more.
"""
from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .models import ABIDING_BRANCHES, AbidingBranch, AbidingDay


def _serialize(day: AbidingDay | None) -> dict:
    """Today's Vine as the API sees it — the plan and each branch's tending."""
    if day is None:
        return {"day": date.today(), "has_plan": False, "planned_branches": [], "branches": []}
    branches = sorted(day.branches, key=lambda b: b.order_index)
    return {
        "day": day.day,
        "has_plan": bool(day.planned),
        "planned_branches": day.planned,
        "branches": [
            {
                "branch": b.branch,
                "seconds": b.seconds,
                "order_index": b.order_index,
                "tended": b.tended,
                "first_touched_at": b.first_touched_at,
            }
            for b in branches
        ],
    }


def _today(db: Session) -> AbidingDay | None:
    return db.scalar(select(AbidingDay).where(AbidingDay.day == date.today()))


def _get_or_open_today(db: Session) -> AbidingDay:
    """Today's AbidingDay, opening one if the Pastor has not yet come today.

    If two requests race to open the first day, the `unique` day key lets one win; the other
    rolls back and takes the day already there.
    """
    day = _today(db)
    if day is None:
        day = AbidingDay(day=date.today(), planned_branches="")
        db.add(day)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            day = _today(db)  # another request opened today first
        else:
            db.refresh(day)
    return day


def today_abiding(db: Session) -> dict:
    """Read today's tending. Does not open a day — silence before the first act stays silent."""
    return _serialize(_today(db))


def set_plan(db: Session, branches: list[str]) -> dict:
    """The morning ask — name which branches to tend today. A compass, not a contract.

    Unknown keys are ignored; order and uniqueness are preserved.
    """
    chosen = []
    for b in branches:
        if b in ABIDING_BRANCHES and b not in chosen:
            chosen.append(b)
    day = _get_or_open_today(db)
    day.planned_branches = ",".join(chosen)
    db.commit()
    return _serialize(_today(db))


def tend(db: Session, branch: str, seconds: int) -> dict:
    """Keep presence with a branch — the linger accrues, and the branch comes to leaf.

    Additive: repeated tending on a branch accumulates its seconds. On first touch the branch
    takes the next place in the day's arc. Presence is honored even for a branch never planned.
    """
    if branch not in ABIDING_BRANCHES:
        raise ValueError(f"Unknown branch: {branch}")
    seconds = max(0, seconds)

    day = _get_or_open_today(db)
    existing = db.scalar(
        select(AbidingBranch).where(
            AbidingBranch.abiding_day_id == day.id, AbidingBranch.branch == branch
        )
    )
    if existing is None:
        next_order = (
            max((b.order_index for b in day.branches), default=0) + 1
        )  # the arc — where this branch first opened
        db.add(
            AbidingBranch(
                abiding_day_id=day.id,
                branch=branch,
                seconds=seconds,
                order_index=next_order,
                first_touched_at=datetime.now(),
                tended=True,
            )
        )
        try:
            db.commit()
        except IntegrityError:
            # Another request opened this branch first — fold this linger into it.
            db.rollback()
            existing = db.scalar(
                select(AbidingBranch).where(
                    AbidingBranch.abiding_day_id == day.id,
                    AbidingBranch.branch == branch,
                )
            )
            if existing is not None:
                existing.seconds += seconds
                existing.tended = True
                db.commit()
    else:
        existing.seconds += seconds
        existing.tended = True
        db.commit()
    return _serialize(_today(db))
