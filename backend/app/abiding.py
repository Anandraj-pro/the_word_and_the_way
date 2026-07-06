"""The Vine — a felt rhythm of daily practice, kept at the Desk.

Each morning the Pastor comes to *abide*: he chooses which branches of the one plant to tend
(Word · Prayer · Confession · Freestyle), then keeps presence with them while a clock quietly
sculpts each branch into the day's shape. This service records that presence — which branches,
in what order, for how long — as its own meta-layer. It does not touch the Encounter spine, the
reading logs, or the prayer logs; it is a projection of tending, nothing more.
"""
import math
from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .models import ABIDING_BRANCHES, AbidingBranch, AbidingDay

# The Vine's long memory. Fullness is a recency-decay-weighted sense of how faithfully the
# Pastor has tended lately — presence over the last month, older days fading. It is COMPUTED,
# never a streak counted. `TAU` sets the fade (~12-day feel); `WINDOW` is how far back we look.
_FULLNESS_TAU = 12.0
_FULLNESS_WINDOW = 30


def _serialize(day: AbidingDay | None, fullness: float, days_dormant: int | None) -> dict:
    """Today's Vine as the API sees it — the plan, each branch's tending, and the long state."""
    branches = sorted(day.branches, key=lambda b: b.order_index) if day is not None else []
    return {
        "day": day.day if day is not None else date.today(),
        "has_plan": bool(day.planned) if day is not None else False,
        "planned_branches": day.planned if day is not None else [],
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
        "fullness": fullness,
        "days_dormant": days_dormant,
    }


def _today(db: Session) -> AbidingDay | None:
    return db.scalar(select(AbidingDay).where(AbidingDay.day == date.today()))


def _vine_state(db: Session) -> tuple[float, int | None]:
    """The Vine's long memory, derived from history — never stored.

    `fullness` (0..1) is a recency-decay-weighted sense of how faithfully the Pastor has tended
    over the recent window: each day he *tended* (≥1 tended branch) adds `exp(-age/TAU)`, divided
    by the same sum over every day in the window (the "tended every day" maximum). Faithful daily
    tending nears 1; a rough patch recovers as tending resumes; long-ago tending fades out.

    `days_dormant` is calendar days since the last tended day (0 = tended today, None = never).
    Neglect is honest but never fatal — the glyph reads this as sleep, not death.
    """
    today = date.today()
    cutoff = today - timedelta(days=_FULLNESS_WINDOW - 1)
    # The set of recent days that were actually tended (a plan alone is not tending). Bounded
    # to today so a stray future-dated row (clock skew) can't inflate the sum past its weight.
    tended_days = set(
        db.scalars(
            select(AbidingDay.day)
            .join(AbidingBranch, AbidingBranch.abiding_day_id == AbidingDay.id)
            .where(
                AbidingBranch.tended.is_(True),
                AbidingDay.day >= cutoff,
                AbidingDay.day <= today,
            )
            .distinct()
        ).all()
    )

    normalizer = sum(math.exp(-d / _FULLNESS_TAU) for d in range(_FULLNESS_WINDOW))
    raw = sum(math.exp(-((today - d).days) / _FULLNESS_TAU) for d in tended_days)
    fullness = min(1.0, raw / normalizer) if normalizer > 0 else 0.0

    # Dormancy looks past the window — the last tended day, however long ago (but not the future).
    last_tended = db.scalar(
        select(AbidingDay.day)
        .join(AbidingBranch, AbidingBranch.abiding_day_id == AbidingDay.id)
        .where(AbidingBranch.tended.is_(True), AbidingDay.day <= today)
        .order_by(AbidingDay.day.desc())
        .limit(1)
    )
    days_dormant = (today - last_tended).days if last_tended is not None else None

    return round(fullness, 4), days_dormant


def _view(db: Session) -> dict:
    """The full Vine payload for today — the day's tending plus the long state."""
    fullness, days_dormant = _vine_state(db)
    return _serialize(_today(db), fullness, days_dormant)


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
    return _view(db)


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
    return _view(db)


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
    return _view(db)
