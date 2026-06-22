"""The daily watch — the prayer half of the founding intent (read AND pray).

Prayer focuses are the standing things prayed over: seeded "standard" foci (church,
pastors, kingdom) plus the Pastor's own "personal" ones. Each day a focus is prayed
over is logged; consecutive days form the watch's streak. This is a discipline tracker,
separate from the Encounter spine.
"""
from datetime import date, timedelta

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from .models import PrayerFocus, PrayerLog

# The standard watch named in the founding proposal: church, pastors, kingdom expansion.
STANDARD_FOCUSES = [
    {"label": "The Church — her growth and establishment", "scripture": "Matthew 16:18"},
    {"label": "Pastors & leaders", "scripture": "Ephesians 6:19"},
    {"label": "Kingdom expansion", "scripture": "Matthew 6:10"},
    {"label": "The harvest — souls", "scripture": "Matthew 9:38"},
]


def seed_prayer_if_empty(db: Session) -> None:
    if db.scalar(select(PrayerFocus).limit(1)) is not None:
        return
    db.add_all(
        PrayerFocus(label=f["label"], scripture=f["scripture"], kind="standard", sort_order=i)
        for i, f in enumerate(STANDARD_FOCUSES)
    )
    db.commit()


def _streak(db: Session, today: date) -> int:
    """Consecutive calendar days, ending today or yesterday, with any prayer logged."""
    dates = set(db.scalars(select(PrayerLog.prayed_on).distinct()).all())
    if not dates:
        return 0
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


def today_watch(db: Session) -> dict:
    """The active focuses with today's prayed-state, plus progress and streak."""
    today = date.today()
    focuses = db.scalars(
        select(PrayerFocus)
        .where(PrayerFocus.active.is_(True))
        .order_by(PrayerFocus.kind.desc(), PrayerFocus.sort_order, PrayerFocus.id)
    ).all()

    prayed_today_ids = set(
        db.scalars(select(PrayerLog.focus_id).where(PrayerLog.prayed_on == today)).all()
    )

    items = []
    for f in focuses:
        last = db.scalar(
            select(PrayerLog.prayed_on)
            .where(PrayerLog.focus_id == f.id)
            .order_by(desc(PrayerLog.prayed_on))
        )
        items.append(
            {
                "id": f.id,
                "label": f.label,
                "kind": f.kind,
                "scripture": f.scripture,
                "prayed_today": f.id in prayed_today_ids,
                "last_prayed": last,
            }
        )

    return {
        "focuses": items,
        "streak": _streak(db, today),
        "prayed_today": len(prayed_today_ids & {i["id"] for i in items}),
        "total": len(items),
    }


def toggle(db: Session, focus_id: int) -> dict | None:
    """Mark a focus prayed today, or un-mark it if already prayed. None if no such focus."""
    focus = db.get(PrayerFocus, focus_id)
    if focus is None:
        return None
    today = date.today()
    existing = db.scalar(
        select(PrayerLog).where(
            PrayerLog.focus_id == focus_id, PrayerLog.prayed_on == today
        )
    )
    if existing is not None:
        db.delete(existing)
    else:
        db.add(PrayerLog(focus_id=focus_id, prayed_on=today))
    db.commit()
    return today_watch(db)


def add_focus(db: Session, label: str, scripture: str | None) -> dict:
    """Add a personal focus to the watch."""
    top = db.scalar(select(func.max(PrayerFocus.sort_order))) or 0
    db.add(
        PrayerFocus(
            label=label.strip(),
            scripture=(scripture or "").strip() or None,
            kind="personal",
            sort_order=top + 1,
        )
    )
    db.commit()
    return today_watch(db)


def remove_focus(db: Session, focus_id: int) -> dict | None:
    """Remove a personal focus (and its logs). Standard foci stay. None if not found."""
    focus = db.get(PrayerFocus, focus_id)
    if focus is None:
        return None
    if focus.kind == "standard":
        focus.active = False  # keep the record; just retire it from the watch
    else:
        db.query(PrayerLog).filter(PrayerLog.focus_id == focus_id).delete()
        db.delete(focus)
    db.commit()
    return today_watch(db)
