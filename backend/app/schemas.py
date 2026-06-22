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


# ---- The crossing result ----
class CrossResult(BaseModel):
    """What the crossing did: the new season, the words carried, and any newly inscribed."""

    season: SeasonRead
    carried: list[EncounterRead]
    inscribed: list[EncounterRead]  # crossed to Cornerstone in this very crossing
