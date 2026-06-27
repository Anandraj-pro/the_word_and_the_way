"""Pydantic request/response shapes for the room's API."""
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from .models import Stage


# ---- Season ----
class SeasonBase(BaseModel):
    name: str
    opening_scripture: str | None = None
    opening_declaration: str | None = None


class SeasonCreate(SeasonBase):
    pass


class SeasonRead(SeasonBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    epitaph: str | None = None
    opened_on: date
    closed_on: date | None = None
    is_open: bool
    encounter_count: int  # the weight the season holds — count of its Encounters


class SeasonCross(BaseModel):
    """The crossing ritual: close the open season and open the next in one act."""

    epitaph: str  # the closing season's name in hindsight — intentional
    name: str
    opening_scripture: str | None = None
    opening_declaration: str | None = None
    # Open-season words the Pastor chooses to carry into the new season.
    carry_encounter_ids: list[int] = []


# ---- Encounter ----
class EncounterBase(BaseModel):
    scripture: str | None = None
    scripture_text: str | None = None
    words: str | None = None
    stage: Stage = Stage.received
    season_id: int | None = None


class EncounterCreate(EncounterBase):
    pass


class EncounterKeep(BaseModel):
    """Keep a single verse to meditate on — it becomes a received Encounter in the open season."""

    scripture: str  # a verse reference, e.g. "John 3:16"
    scripture_text: str | None = None
    words: str | None = None  # an optional word kept with it


class EncounterUpdate(BaseModel):
    """All optional — patch any facet, including advancing the stage."""

    scripture: str | None = None
    scripture_text: str | None = None
    words: str | None = None
    stage: Stage | None = None
    season_id: int | None = None
    themes: str | None = None


class EncounterRead(EncounterBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    received_on: date
    carry_count: int
    themes: str | None = None
    is_cornerstone: bool
    created_at: datetime
    updated_at: datetime


# ---- Confession (the Wall corpus) ----
class ConfessionSummary(BaseModel):
    """Lightweight — the browsable list on the Wall. No full body."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    refs: list[str]


class ConfessionRead(ConfessionSummary):
    """Full text — one confession opened to read and declare."""

    body: str


# ---- Scripture lookup (the Desk) ----
class ScriptureRead(BaseModel):
    reference: str  # the canonical reference, e.g. "Psalms 27:14"
    text: str
    translation: str


class Verse(BaseModel):
    verse: int | None = None
    text: str


class PassageRead(BaseModel):
    """A whole chapter broken into numbered verses for the book reader."""

    reference: str
    translation: str
    verses: list[Verse]
    previous_reference: str | None = None
    next_reference: str | None = None


# ---- Daily reading (the Desk) ----
class ReadingToday(BaseModel):
    status: str  # "to_read" | "done_today" | "plan_complete"  (plan_complete = goal done)
    reference: str | None = None  # the goal's next unread chapter (or the last, when done)
    text: str | None = None
    translation: str | None = None
    total: int  # chapters in the goal
    completed: int  # distinct goal chapters read
    streak: int  # consecutive periods the pace was met
    pace_count: int  # chapters per period
    pace_unit: str  # "day" | "week"
    read_this_period: int  # goal chapters read this day/week
    pace_met: bool  # this period's quota is met
    goal_label: str  # e.g. "James 1–5"
    read_today_refs: list[str] = []  # goal chapters already kept today (for the reader)
    next_reference: str | None = None  # the chapter after `reference`, a look-ahead


class ReadingGoalRead(BaseModel):
    id: int
    book: str
    start_chapter: int
    end_chapter: int
    pace_count: int
    pace_unit: str
    label: str

    model_config = ConfigDict(from_attributes=True)


class ReadingGoalSet(BaseModel):
    book: str
    start_chapter: int = 1
    end_chapter: int
    pace_count: int = 1
    pace_unit: str = "day"  # "day" | "week"


class ReadingHistoryEntry(BaseModel):
    reference: str
    completed_on: date
    on_plan: bool  # advanced the plan, vs. a free reading that only kept the streak
    became_encounter: bool


class ReadingHistory(BaseModel):
    days: int  # the window looked back over
    days_read: int  # distinct calendar days with a reading in that window
    chapters: int  # total chapters read in the window
    entries: list[ReadingHistoryEntry]


class ReadingComplete(BaseModel):
    response: str | None = None  # the Pastor's word in answer — becomes an Encounter
    # The chapter actually read. Omitted (or equal to the plan's chapter) → a plan reading
    # that advances the plan; a different chapter → free reading that only keeps the streak.
    reference: str | None = None


# ---- Daily prayer (the watch, at the Desk) ----
class PrayerFocusRead(BaseModel):
    id: int
    label: str
    kind: str  # "standard" | "personal"
    scripture: str | None = None
    prayed_today: bool
    last_prayed: date | None = None


class PrayerToday(BaseModel):
    focuses: list[PrayerFocusRead]
    streak: int
    prayed_today: int
    total: int


class PrayerFocusCreate(BaseModel):
    label: str
    scripture: str | None = None


# ---- The crossing result ----
class CrossResult(BaseModel):
    """What the crossing did: the new season, the words carried, and any newly inscribed."""

    season: SeasonRead
    carried: list[EncounterRead]
    inscribed: list[EncounterRead]  # crossed to Cornerstone in this very crossing
