"""The data spine of the room.

Everything in The Word and the Way is ONE object — an Encounter — seen at different
points on a single path:

    RECEIVE -> REFLECT -> DECLARE -> CARRY -> WITNESS
    (rhema)   (journal)  (confession) (promise) (testimony)

There are not six tables for six features. There is one Encounter with a `stage`.
A Season is the container the Pastor names; it is the only calendar the room knows.
"""
import enum
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

# A promise carried across this many seasons earns "Cornerstone" status and is
# inscribed permanently on the Altar.
CORNERSTONE_CARRY_THRESHOLD = 3


class Stage(str, enum.Enum):
    """The five points on the Word's path through a life."""

    received = "received"      # rhema — a word God spoke
    reflecting = "reflecting"  # journal — wrestled in writing
    declared = "declared"      # confession / declaration — proclaimed
    carried = "carried"        # promise — borne across seasons
    witnessed = "witnessed"    # testimony — God kept it


class Season(Base):
    """A Pastor-named container of time. The Shelves' spines. Never a raw date range."""

    __tablename__ = "seasons"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    opening_scripture: Mapped[str | None] = mapped_column(String(255), default=None)
    opening_declaration: Mapped[str | None] = mapped_column(Text, default=None)
    epitaph: Mapped[str | None] = mapped_column(Text, default=None)  # written at close
    opened_on: Mapped[date] = mapped_column(Date, default=date.today)
    closed_on: Mapped[date | None] = mapped_column(Date, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    encounters: Mapped[list["Encounter"]] = relationship(
        back_populates="season", cascade="all, delete-orphan"
    )

    @property
    def is_open(self) -> bool:
        return self.closed_on is None

    @property
    def encounter_count(self) -> int:
        """How much this season held — the weight on its spine in the Archive."""
        return len(self.encounters)


class Confession(Base):
    """A standing, authored confession — the liturgy the Pastor declares from.

    Distinct from the Encounter spine: an Encounter is the Pastor's *own* word walking
    its path; a Confession is the inherited corpus on the Wall, read and proclaimed.
    Loaded from `docs/confessions_md/` and refreshed from disk, not hand-entered — so it
    is keyed by a stable `slug` for idempotent re-loading.
    """

    __tablename__ = "confessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    # Scripture references gathered under the confession, one per line.
    scripture_refs: Mapped[str | None] = mapped_column(Text, default=None)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    @property
    def refs(self) -> list[str]:
        return [r for r in (self.scripture_refs or "").splitlines() if r.strip()]


class ScriptureCache(Base):
    """Verses fetched for the Desk lookup, kept so a once-seen verse reads even offline.

    Keyed by a normalized `reference` (lowercased reference + translation) so repeats
    are served locally without calling out again.
    """

    __tablename__ = "scripture_cache"

    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str] = mapped_column(String(160), unique=True, index=True)  # cache key
    display_reference: Mapped[str | None] = mapped_column(String(160), default=None)
    text: Mapped[str] = mapped_column(Text)
    # Per-verse breakdown as JSON ([{verse, text}, …]) for the book reader. Null for
    # rows cached before the reader existed; backfilled on first passage lookup.
    verses_json: Mapped[str | None] = mapped_column(Text, default=None)
    translation: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class ReadingPlanEntry(Base):
    """One day's passage in the reading plan — the room's daily Bible-reading rhythm.

    An ordered list of references; `day_index` is the position, not a calendar date, so a
    missed day never skips a passage — you simply read the next one you haven't finished.
    """

    __tablename__ = "reading_plan"

    id: Mapped[int] = mapped_column(primary_key=True)
    day_index: Mapped[int] = mapped_column(Integer, unique=True, index=True)  # 1-based order
    reference: Mapped[str] = mapped_column(String(120))


class ReadingGoal(Base):
    """A reading goal — a book (or a range of its chapters), read at a chosen pace.

    Scope is one book, `start_chapter`..`end_chapter` inclusive. Pace is `pace_count`
    chapters per `pace_unit` ("day" or "week"); the streak counts periods the pace was met.
    One goal is `active` at a time; setting a new goal retires the old.
    """

    __tablename__ = "reading_goal"

    id: Mapped[int] = mapped_column(primary_key=True)
    book: Mapped[str] = mapped_column(String(60))
    start_chapter: Mapped[int] = mapped_column(Integer)
    end_chapter: Mapped[int] = mapped_column(Integer)
    pace_count: Mapped[int] = mapped_column(Integer, default=1)
    pace_unit: Mapped[str] = mapped_column(String(8), default="day")  # "day" | "week"
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class ReadingLog(Base):
    """A completed reading — what was read, on which calendar day, and the word it became.

    A reading counts toward a goal when `goal_id` is set (the chapter fell in the goal's
    scope); a free reading off any goal leaves it null but still appears in the look-back.
    """

    __tablename__ = "reading_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    day_index: Mapped[int] = mapped_column(Integer, index=True, default=0)  # legacy plan order
    reference: Mapped[str] = mapped_column(String(120))
    completed_on: Mapped[date] = mapped_column(Date, default=date.today, index=True)
    goal_id: Mapped[int | None] = mapped_column(
        ForeignKey("reading_goal.id"), default=None, index=True
    )
    encounter_id: Mapped[int | None] = mapped_column(
        ForeignKey("encounters.id"), default=None
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class PrayerFocus(Base):
    """A standing thing prayed over — the daily watch. The other half of the founding intent.

    `kind` is "standard" (the seeded church / pastors / kingdom foci) or "personal" (the
    Pastor's own). Distinct from the Encounter spine: prayer is a discipline logged, not a
    word received.
    """

    __tablename__ = "prayer_focuses"

    id: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(String(160))
    kind: Mapped[str] = mapped_column(String(20), default="personal")  # standard | personal
    scripture: Mapped[str | None] = mapped_column(String(120), default=None)  # a verse to pray
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class PrayerLog(Base):
    """One day a focus was prayed over. Consecutive days form the watch's streak."""

    __tablename__ = "prayer_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    focus_id: Mapped[int] = mapped_column(ForeignKey("prayer_focuses.id"), index=True)
    prayed_on: Mapped[date] = mapped_column(Date, default=date.today, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Encounter(Base):
    """One moment Scripture met a life. The single spine of the entire room."""

    __tablename__ = "encounters"

    id: Mapped[int] = mapped_column(primary_key=True)

    # The Word and the words. Either may stand alone — a pure prayer has no verse;
    # a received verse may have no note yet.
    scripture: Mapped[str | None] = mapped_column(String(255), default=None)
    scripture_text: Mapped[str | None] = mapped_column(Text, default=None)
    words: Mapped[str | None] = mapped_column(Text, default=None)

    # Where this Encounter sits on the path.
    stage: Mapped[Stage] = mapped_column(Enum(Stage), default=Stage.received)

    # Season is the organizing lens. The date exists only for "On This Day".
    season_id: Mapped[int | None] = mapped_column(
        ForeignKey("seasons.id"), default=None, index=True
    )
    received_on: Mapped[date] = mapped_column(Date, default=date.today)

    # How many seasons this word has been carried forward. 3+ -> Cornerstone (Altar).
    carry_count: Mapped[int] = mapped_column(Integer, default=0)

    # Inferred by Ollama, never hand-tagged. Stored as a comma-separated string for now.
    themes: Mapped[str | None] = mapped_column(String(255), default=None)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    season: Mapped["Season | None"] = relationship(back_populates="encounters")

    @property
    def is_cornerstone(self) -> bool:
        """A promise worn into the stone by returning hands."""
        return self.carry_count >= CORNERSTONE_CARRY_THRESHOLD
