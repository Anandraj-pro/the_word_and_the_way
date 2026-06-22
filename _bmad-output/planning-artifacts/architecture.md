# Architecture Document: The Word and the Way

**Product**: The Word and the Way — Personal Spiritual Journal Web App
**Prepared by**: BMAD Architect
**Date**: 21 June 2026
**Status**: Draft v1.0
**Based on**: Project Brief v1.0 + PRD v1.0 (BMAD, 21 June 2026)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Project Structure](#2-project-structure)
3. [Database Schema](#3-database-schema)
4. [API Design](#4-api-design)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Ollama Integration](#6-ollama-integration)
7. [Data Flow](#7-data-flow)
8. [Development Setup](#8-development-setup)
9. [Alembic Migration Strategy](#9-alembic-migration-strategy)
10. [Open Questions Resolved](#10-open-questions-resolved)

---

## 1. System Overview

### Architecture Pattern

The application follows a **local client-server** model. Both processes run on the user's machine. No internet connection is required. FastAPI is the backend API server; the compiled React app is served as static files by FastAPI in production, and via Vite's dev server during development.

```
+---------------------------------------------------+
|                  USER'S MACHINE                   |
|                                                   |
|  +------------------+    +---------------------+  |
|  |                  |    |                     |  |
|  |   Browser        |    |   Ollama            |  |
|  |   (Chrome /      |    |   localhost:11434   |  |
|  |    Firefox)      |    |   (optional)        |  |
|  |                  |    |                     |  |
|  |  React 18 App    |    +----------+----------+  |
|  |  localhost:5173  |               |             |
|  |  (dev only)      |               | HTTP        |
|  |                  |               | (httpx)     |
|  +--------+---------+               |             |
|           |                         |             |
|           | REST / JSON             |             |
|           | (TanStack Query)        |             |
|           v                         v             |
|  +------------------------------------------+    |
|  |                                          |    |
|  |   FastAPI + Uvicorn                      |    |
|  |   localhost:8000                         |    |
|  |                                          |    |
|  |   /api/*        — REST endpoints         |    |
|  |   /             — serves React build     |    |
|  |   (prod only)                            |    |
|  |                                          |    |
|  +-------------------+----------------------+    |
|                      |                           |
|                      | SQLAlchemy 2.0            |
|                      | (async)                   |
|                      v                           |
|  +------------------------------------------+    |
|  |                                          |    |
|  |   SQLite                                 |    |
|  |   data/wordandway.db                     |    |
|  |   (local file — never leaves machine)    |    |
|  |                                          |    |
|  +------------------------------------------+    |
|                                                   |
+---------------------------------------------------+
```

### Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data storage | SQLite local file | Zero infra, fully offline, exportable |
| API pattern | REST over JSON | Simple, TanStack Query-compatible, OpenAPI auto-docs |
| AI proxy | FastAPI proxies Ollama | Browser never speaks to Ollama directly; graceful degradation |
| Production serving | FastAPI serves compiled React | Single process, no separate web server |
| Dev serving | Vite dev server + FastAPI | Hot module reload for frontend; CORS enabled in dev |
| Auth | None (Phase I) | Single-user, local-only; `user_id` reserved in schema for Phase II |

---

## 2. Project Structure

### Repository Root

```
the_word_and_the_way/
├── backend/
├── frontend/
├── data/
│   └── wordandway.db          # SQLite database file (git-ignored)
├── _bmad-output/
│   └── planning-artifacts/
│       ├── project-brief.md
│       ├── prd.md
│       └── architecture.md    # This document
├── .gitignore
└── README.md
```

### Backend Directory

```
backend/
├── pyproject.toml             # uv project config (dependencies, Python version)
├── uv.lock                    # uv lock file (committed to VCS)
├── alembic.ini                # Alembic migration configuration
├── .env                       # Local environment variables (git-ignored)
├── .env.example               # Example env file (committed)
│
├── alembic/
│   ├── env.py                 # Alembic env — imports models, sets target_metadata
│   ├── script.py.mako         # Migration script template
│   └── versions/
│       └── 0001_initial_schema.py   # First migration (all 8 tables)
│
└── app/
    ├── main.py                # FastAPI app factory; mounts router; serves static files
    ├── config.py              # Settings (DB path, Ollama URL, CORS origins)
    ├── database.py            # SQLAlchemy async engine + session factory
    │
    ├── models/
    │   ├── __init__.py
    │   ├── base.py            # DeclarativeBase + common mixin (id, created_at, updated_at)
    │   ├── devotional_record.py
    │   ├── reading_session.py
    │   ├── prayer_log.py
    │   ├── prayer_item.py
    │   ├── standard_prayer.py
    │   ├── reflection_entry.py
    │   ├── saved_verse.py
    │   └── user_settings.py
    │
    ├── schemas/
    │   ├── __init__.py
    │   ├── devotional_record.py   # Pydantic v2 request/response models
    │   ├── reading_session.py
    │   ├── prayer_log.py
    │   ├── prayer_item.py
    │   ├── standard_prayer.py
    │   ├── reflection_entry.py
    │   ├── saved_verse.py
    │   ├── user_settings.py
    │   └── ai.py                  # Ollama request/response schemas
    │
    ├── routers/
    │   ├── __init__.py
    │   ├── dashboard.py       # GET /api/dashboard/today, GET /api/dashboard/stats
    │   ├── reading.py         # CRUD for ReadingSession
    │   ├── prayer.py          # CRUD for PrayerLog + PrayerItem
    │   ├── reflection.py      # CRUD for ReflectionEntry
    │   ├── verses.py          # CRUD for SavedVerse
    │   ├── standard_prayers.py # CRUD for StandardPrayer
    │   ├── history.py         # DevotionalRecord list + detail
    │   ├── settings.py        # UserSettings + data export
    │   └── ai.py              # Ollama proxy endpoints
    │
    └── services/
        ├── __init__.py
        ├── devotional_service.py   # Business logic: create/fetch devotional records
        ├── reading_service.py      # Current position logic, chapter counting
        ├── prayer_service.py       # Prayer log + item business logic
        ├── reflection_service.py   # Auto-save, linking logic
        ├── stats_service.py        # Streak calculation, chapter counts, monthly stats
        ├── ollama_service.py       # Ollama HTTP client + graceful degradation
        └── backup_service.py       # SQLite file streaming for export
```

### Frontend Directory

```
frontend/
├── package.json               # pnpm project config
├── pnpm-lock.yaml
├── tsconfig.json              # TypeScript strict mode
├── tsconfig.node.json
├── vite.config.ts             # Vite config (proxy to :8000, PWA plugin)
├── tailwind.config.ts         # Tailwind with Ember & Stone tokens
├── postcss.config.js
├── components.json            # shadcn/ui config
├── index.html
│
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # App icons (192px, 512px)
│
└── src/
    ├── main.tsx               # React app entry point
    ├── App.tsx                # Router setup, QueryClientProvider
    │
    ├── lib/
    │   ├── api.ts             # Axios/fetch base client (base URL: /api)
    │   ├── queryKeys.ts       # TanStack Query key factory
    │   └── utils.ts           # cn() helper, date formatters, time-of-day logic
    │
    ├── types/
    │   └── index.ts           # TypeScript interfaces mirroring Pydantic schemas
    │
    ├── hooks/
    │   ├── useDashboard.ts    # useQuery for today's dashboard data
    │   ├── useReadingSessions.ts
    │   ├── usePrayerLog.ts
    │   ├── usePrayerItems.ts
    │   ├── useReflection.ts
    │   ├── useSavedVerses.ts
    │   ├── useStandardPrayers.ts
    │   ├── useHistory.ts
    │   ├── useSettings.ts
    │   ├── useOllamaStatus.ts  # Pings /api/ai/status on mount
    │   └── useAutoSave.ts      # Debounced mutation hook for reflection auto-save
    │
    ├── components/
    │   ├── ui/                 # shadcn/ui generated components (Button, Input, etc.)
    │   │
    │   ├── layout/
    │   │   ├── AppShell.tsx    # Sidebar + main content area wrapper
    │   │   ├── Sidebar.tsx     # Nav links, app title, settings link
    │   │   └── PageHeader.tsx  # Section title + breadcrumb
    │   │
    │   ├── dashboard/
    │   │   ├── DashboardPage.tsx        # Route component /
    │   │   ├── GreetingHeader.tsx       # "Good Evening, Pastor John"
    │   │   ├── ActivityRow.tsx          # Single row (prayer / reading / etc.)
    │   │   ├── ActivityGrid.tsx         # Renders four ActivityRows
    │   │   ├── HebrewsTracker.tsx       # 13-chapter visual progress bar
    │   │   └── StatsFooter.tsx          # Streak + month count
    │   │
    │   ├── reading/
    │   │   ├── ReadingPage.tsx          # Route component /reading
    │   │   ├── ReadingSessionForm.tsx   # Log new session (book, chapters, notes)
    │   │   ├── BookChapterSelector.tsx  # Dropdown: book + chapter numbers
    │   │   ├── ReadingSessionList.tsx   # History list
    │   │   ├── ReadingSessionCard.tsx   # Single session card
    │   │   ├── HolySpiritPrompt.tsx     # "What should I read next?" modal-free panel
    │   │   └── VerseSuggestions.tsx     # LLM suggestions or manual entry
    │   │
    │   ├── prayer/
    │   │   ├── PrayerPage.tsx           # Route component /prayer
    │   │   ├── PrayerLogForm.tsx        # Log today's prayer time + notes
    │   │   ├── PrayerItemList.tsx       # Running prayer list grouped by category
    │   │   ├── PrayerItemCard.tsx       # Single item with edit/answer controls
    │   │   ├── PrayerItemForm.tsx       # Add/edit prayer item form
    │   │   ├── AnsweredPrayersArchive.tsx
    │   │   └── PrayerLogLinker.tsx      # Multi-select prayer items for today's log
    │   │
    │   ├── reflection/
    │   │   ├── ReflectionPage.tsx       # Route component /reflection
    │   │   ├── ReflectionEditor.tsx     # Toggles between free/guided mode
    │   │   ├── FreeWritingEditor.tsx    # Single textarea with auto-save
    │   │   ├── GuidedPromptsEditor.tsx  # Four prompt textareas side-by-side
    │   │   ├── VerseLinkChips.tsx       # Verse reference chips + add new
    │   │   ├── VerseReferenceInput.tsx  # Structured book/chapter/verse selector
    │   │   └── ReflectionList.tsx       # Past reflections browsable list
    │   │
    │   ├── verses/
    │   │   ├── VersesPage.tsx           # Route component /verses
    │   │   ├── SavedVerseList.tsx       # Library list view
    │   │   ├── SavedVerseCard.tsx       # Single verse with text + linked reflection
    │   │   └── SavedVerseForm.tsx       # Add/edit verse form
    │   │
    │   ├── standard-prayers/
    │   │   ├── StandardPrayersPage.tsx  # Route component /standard-prayers
    │   │   ├── PrayerCategoryList.tsx   # Category accordion/list
    │   │   ├── PrayerCategoryEditor.tsx # Editable rich text per category
    │   │   └── AiExpandButton.tsx       # Ollama "Help me expand" trigger
    │   │
    │   ├── history/
    │   │   ├── HistoryPage.tsx          # Route component /history
    │   │   ├── DevotionalRecordList.tsx # Date-sorted list
    │   │   └── DevotionalRecordDetail.tsx # Read-only day view with all linked data
    │   │
    │   └── settings/
    │       ├── SettingsPage.tsx         # Route component /settings
    │       ├── ProfileSettings.tsx      # Name, title fields
    │       ├── ThemeSettings.tsx        # Light/dark/system toggle
    │       ├── OllamaStatus.tsx         # Connection status indicator
    │       ├── DataExport.tsx           # Download .sqlite button
    │       └── ImportStandardPrayers.tsx # File import UI
    │
    └── pages/
        └── NotFoundPage.tsx
```

---

## 3. Database Schema

### Base Mixin

Every table inherits from `TimestampMixin` which provides `created_at` and `updated_at` automatically.

```python
# app/models/base.py

import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
```

---

### Entity 1: UserSettings

Singleton table — always exactly one row.

```python
# app/models/user_settings.py

from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base, TimestampMixin


class UserSettings(Base, TimestampMixin):
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    # Dashboard greeting
    display_name: Mapped[str] = mapped_column(String(100), default="Friend")
    display_title: Mapped[str] = mapped_column(String(100), default="")
    # Theme: "light" | "dark" | "system"
    theme: Mapped[str] = mapped_column(String(20), default="system")
    # Ollama model name (stored so UI can display it)
    ollama_model: Mapped[str] = mapped_column(String(100), default="llama3.2:3b")
    # Hebrews tracker: tracks which book the dashboard tracker currently follows
    tracker_book: Mapped[str] = mapped_column(String(50), default="Hebrews")
    tracker_total_chapters: Mapped[int] = mapped_column(default=13)
```

---

### Entity 2: DevotionalRecord

The anchor record for each calendar date. All session types link to this.

```python
# app/models/devotional_record.py

from datetime import date
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Date, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .reading_session import ReadingSession
    from .prayer_log import PrayerLog
    from .reflection_entry import ReflectionEntry
    from .saved_verse import SavedVerse


class DevotionalRecord(Base, TimestampMixin):
    __tablename__ = "devotional_records"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    # The calendar date this record represents (unique — one record per day)
    record_date: Mapped[date] = mapped_column(Date, nullable=False, unique=True, index=True)
    # Optional listening-to-the-word freeform text
    listening_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Reserved for Phase II multi-user support
    user_id: Mapped[str] = mapped_column(String(36), default="local", index=True)

    # Relationships
    reading_sessions: Mapped[List["ReadingSession"]] = relationship(
        back_populates="devotional_record", cascade="all, delete-orphan"
    )
    prayer_log: Mapped[Optional["PrayerLog"]] = relationship(
        back_populates="devotional_record", cascade="all, delete-orphan", uselist=False
    )
    reflection_entry: Mapped[Optional["ReflectionEntry"]] = relationship(
        back_populates="devotional_record", cascade="all, delete-orphan", uselist=False
    )
    saved_verses: Mapped[List["SavedVerse"]] = relationship(
        back_populates="devotional_record", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_devotional_records_date_user", "record_date", "user_id"),
    )
```

---

### Entity 3: ReadingSession

One reading session per sitting. A day may have multiple sessions.

```python
# app/models/reading_session.py

from datetime import date
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Date, ForeignKey, Integer, String, Text, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .devotional_record import DevotionalRecord


class ReadingSession(Base, TimestampMixin):
    __tablename__ = "reading_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    devotional_record_id: Mapped[int] = mapped_column(
        ForeignKey("devotional_records.id", ondelete="CASCADE"), nullable=False, index=True
    )
    session_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # Bible position
    book: Mapped[str] = mapped_column(String(50), nullable=False)
    start_chapter: Mapped[int] = mapped_column(Integer, nullable=False)
    end_chapter: Mapped[int] = mapped_column(Integer, nullable=False)

    # Optional session notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Holy Spirit prompt — recorded after completing a book
    holy_spirit_prompt_triggered: Mapped[bool] = mapped_column(Boolean, default=False)
    holy_spirit_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # The verse selected for meditation from this session
    meditation_verse_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    meditation_verse_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Computed convenience: chapters_read = end_chapter - start_chapter + 1
    # Not stored; calculated in service layer

    # Relationships
    devotional_record: Mapped["DevotionalRecord"] = relationship(
        back_populates="reading_sessions"
    )

    __table_args__ = (
        Index("ix_reading_sessions_date_book", "session_date", "book"),
    )
```

---

### Entity 4: PrayerLog

One prayer log entry per day. Captures duration + freeform notes.

```python
# app/models/prayer_log.py

from datetime import date
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Date, ForeignKey, String, Text, Index, Table, Column, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .devotional_record import DevotionalRecord
    from .prayer_item import PrayerItem


# Association table: prayer_log <-> prayer_items (many-to-many)
prayer_log_items = Table(
    "prayer_log_items",
    Base.metadata,
    Column("prayer_log_id", Integer, ForeignKey("prayer_logs.id", ondelete="CASCADE")),
    Column("prayer_item_id", Integer, ForeignKey("prayer_items.id", ondelete="CASCADE")),
)


class PrayerLog(Base, TimestampMixin):
    __tablename__ = "prayer_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    devotional_record_id: Mapped[int] = mapped_column(
        ForeignKey("devotional_records.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    log_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # Duration as freeform text (e.g., "1 hr 15 min"); also stored as minutes for sorting/stats
    duration_text: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Freeform notes on what was prayed
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    devotional_record: Mapped["DevotionalRecord"] = relationship(
        back_populates="prayer_log"
    )
    prayed_items: Mapped[List["PrayerItem"]] = relationship(
        secondary=prayer_log_items, back_populates="prayer_logs"
    )
```

---

### Entity 5: PrayerItem

Running intercessory prayer list. Independent of any single day.

```python
# app/models/prayer_item.py

from datetime import date
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, Date, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .prayer_log import PrayerLog


class PrayerItem(Base, TimestampMixin):
    __tablename__ = "prayer_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Identity
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    # Category: "personal" | "family" | "church" | "kingdom"
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Active vs. answered
    is_answered: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    answered_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    answered_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Date the user started praying for this
    date_added: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # Reserved for Phase II
    user_id: Mapped[str] = mapped_column(String(36), default="local", index=True)

    # Relationships
    prayer_logs: Mapped[List["PrayerLog"]] = relationship(
        secondary="prayer_log_items", back_populates="prayed_items"
    )

    __table_args__ = (
        Index("ix_prayer_items_category_answered", "category", "is_answered"),
    )
```

---

### Entity 6: StandardPrayer

Recurring prayer categories (Church, Pastors, Kingdom, Missions, etc.).

```python
# app/models/standard_prayer.py

from typing import Optional
from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base, TimestampMixin


class StandardPrayer(Base, TimestampMixin):
    __tablename__ = "standard_prayers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    category_name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    # Display order in the UI
    sort_order: Mapped[int] = mapped_column(Integer, default=0, index=True)
    # Freeform prayer content (markdown supported in the UI)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Reserved for Phase II
    user_id: Mapped[str] = mapped_column(String(36), default="local", index=True)
```

---

### Entity 7: ReflectionEntry

One reflection entry per day. Supports free-writing and guided-prompts modes.

```python
# app/models/reflection_entry.py

from datetime import date
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, Date, ForeignKey, String, Text, Index, Table, Column, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .devotional_record import DevotionalRecord
    from .saved_verse import SavedVerse


# Association table: reflection_entry <-> saved_verses (linked verses)
reflection_verses = Table(
    "reflection_verses",
    Base.metadata,
    Column("reflection_entry_id", Integer, ForeignKey("reflection_entries.id", ondelete="CASCADE")),
    Column("saved_verse_id", Integer, ForeignKey("saved_verses.id", ondelete="CASCADE")),
)


class ReflectionEntry(Base, TimestampMixin):
    __tablename__ = "reflection_entries"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    devotional_record_id: Mapped[int] = mapped_column(
        ForeignKey("devotional_records.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    entry_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # Mode: "free" | "guided"
    mode: Mapped[str] = mapped_column(String(10), nullable=False, default="free")

    # Free-writing mode content
    free_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Guided prompts mode — each stored separately for structured retrieval
    prompt_stood_out: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    prompt_god_saying: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    prompt_do_differently: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    prompt_remember: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    devotional_record: Mapped["DevotionalRecord"] = relationship(
        back_populates="reflection_entry"
    )
    linked_verses: Mapped[List["SavedVerse"]] = relationship(
        secondary=reflection_verses, back_populates="linked_reflections"
    )
```

---

### Entity 8: SavedVerse

The user's personal verse library. Can be linked from readings or added standalone.

```python
# app/models/saved_verse.py

from datetime import date
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Date, ForeignKey, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .devotional_record import DevotionalRecord
    from .reflection_entry import ReflectionEntry


class SavedVerse(Base, TimestampMixin):
    __tablename__ = "saved_verses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    devotional_record_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("devotional_records.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Structured reference — stored separately for indexing and display
    book: Mapped[str] = mapped_column(String(50), nullable=False)
    chapter: Mapped[int] = mapped_column(nullable=False)
    verse: Mapped[int] = mapped_column(nullable=False)
    # Human-readable reference, e.g., "Hebrews 10:23" (denormalized for convenience)
    reference: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # The verse text as typed by the user
    verse_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    date_saved: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # Reserved for Phase II
    user_id: Mapped[str] = mapped_column(String(36), default="local", index=True)

    # Relationships
    devotional_record: Mapped[Optional["DevotionalRecord"]] = relationship(
        back_populates="saved_verses"
    )
    linked_reflections: Mapped[List["ReflectionEntry"]] = relationship(
        secondary="reflection_verses", back_populates="linked_verses"
    )

    __table_args__ = (
        Index("ix_saved_verses_book_chapter", "book", "chapter"),
    )
```

---

### Entity Relationship Summary

```
UserSettings (singleton — 1 row)

DevotionalRecord (1 per date)
    |
    |--- (1:many) ReadingSession
    |--- (1:1)    PrayerLog
    |                 |--- (many:many via prayer_log_items) PrayerItem
    |--- (1:1)    ReflectionEntry
    |                 |--- (many:many via reflection_verses) SavedVerse
    |--- (1:many) SavedVerse

StandardPrayer (independent — not linked to DevotionalRecord)
PrayerItem     (independent — linked to PrayerLog via junction table)
```

---

## 4. API Design

All endpoints are prefixed with `/api`. FastAPI auto-generates OpenAPI docs at `http://localhost:8000/docs`.

All responses use `application/json`. All request bodies use `application/json`. Dates are ISO 8601 strings (`"2026-06-21"`). IDs are integers.

**Standard error responses:**
- `404 Not Found`: `{"detail": "Resource not found"}`
- `422 Unprocessable Entity`: Pydantic validation error detail
- `500 Internal Server Error`: `{"detail": "Internal server error"}`

---

### Domain: Dashboard

#### GET /api/dashboard/today

Returns all data needed to render the dashboard for the current date.

**Response Body:**
```json
{
  "date": "2026-06-21",
  "greeting_period": "evening",
  "display_name": "John",
  "display_title": "Pastor",
  "prayer": {
    "logged": true,
    "duration_text": "1 hr 15 min",
    "duration_minutes": 75,
    "prayed_item_labels": ["John", "Church Board", "Missions"]
  },
  "reading": {
    "logged": true,
    "sessions": [
      {
        "id": 42,
        "book": "Hebrews",
        "start_chapter": 10,
        "end_chapter": 13,
        "chapters_read": 4,
        "meditation_verse_reference": "Heb 10:23"
      }
    ],
    "total_chapters_today": 4
  },
  "listening": {
    "logged": false,
    "notes": null
  },
  "reflection": {
    "logged": true,
    "mode": "free",
    "teaser": "He who promised is faithful..."
  },
  "hebrews_tracker": {
    "book": "Hebrews",
    "total_chapters": 13,
    "completed_chapters": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
  },
  "stats": {
    "current_streak_days": 7,
    "month_logged_days": 18,
    "month_total_days": 30
  }
}
```

#### GET /api/dashboard/stats

Returns streak and monthly stats only (lighter call for background refresh).

**Response Body:**
```json
{
  "current_streak_days": 7,
  "month_logged_days": 18,
  "month_total_days": 30,
  "total_devotional_days": 142
}
```

---

### Domain: Reading Sessions

#### GET /api/reading/sessions

List all reading sessions, sorted by date descending.

**Query Params:** `?limit=50&offset=0&book=Hebrews`

**Response Body:**
```json
{
  "items": [
    {
      "id": 42,
      "devotional_record_id": 18,
      "session_date": "2026-06-21",
      "book": "Hebrews",
      "start_chapter": 10,
      "end_chapter": 13,
      "chapters_read": 4,
      "notes": null,
      "meditation_verse_reference": "Heb 10:23",
      "meditation_verse_text": "Let us hold unswervingly...",
      "holy_spirit_prompt_triggered": false,
      "holy_spirit_response": null,
      "created_at": "2026-06-21T07:32:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

#### POST /api/reading/sessions

Log a new reading session. Creates a DevotionalRecord for today if one does not exist.

**Request Body:**
```json
{
  "session_date": "2026-06-21",
  "book": "Hebrews",
  "start_chapter": 10,
  "end_chapter": 13,
  "notes": "The Hall of Faith passage was striking today.",
  "meditation_verse_reference": "Heb 10:23",
  "meditation_verse_text": "Let us hold unswervingly to the hope we profess..."
}
```

**Response:** `201 Created` — full session object (same shape as list item above).

#### GET /api/reading/sessions/{session_id}

**Response:** Single session object.

#### PATCH /api/reading/sessions/{session_id}

Update notes, meditation verse, or Holy Spirit response on an existing session.

**Request Body (all fields optional):**
```json
{
  "notes": "Updated note",
  "meditation_verse_reference": "Heb 11:1",
  "meditation_verse_text": "Now faith is confidence in what we hope for...",
  "holy_spirit_response": "Continue in James"
}
```

**Response:** Updated session object.

#### DELETE /api/reading/sessions/{session_id}

**Response:** `204 No Content`

#### GET /api/reading/position

Returns the user's current reading position (last completed book + chapter).

**Response Body:**
```json
{
  "book": "Hebrews",
  "last_chapter": 13,
  "session_date": "2026-06-21",
  "book_completed": true
}
```

#### GET /api/reading/stats

**Response Body:**
```json
{
  "today": 4,
  "this_week": 12,
  "this_month": 34,
  "all_time": 412
}
```

#### GET /api/reading/hebrews-tracker

Returns chapter completion state for the tracker book (configurable in settings).

**Response Body:**
```json
{
  "book": "Hebrews",
  "total_chapters": 13,
  "completed_chapters": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
}
```

---

### Domain: Prayer

#### GET /api/prayer/log/today

Get or initialise today's prayer log.

**Response Body:**
```json
{
  "id": 7,
  "log_date": "2026-06-21",
  "duration_text": "1 hr 15 min",
  "duration_minutes": 75,
  "notes": "Interceded for the elders meeting. Felt a deep sense of peace for John.",
  "prayed_items": [
    { "id": 3, "label": "John", "category": "personal" },
    { "id": 9, "label": "Church Board", "category": "church" }
  ]
}
```

#### PUT /api/prayer/log/today

Create or update today's prayer log (upsert).

**Request Body:**
```json
{
  "duration_text": "1 hr 15 min",
  "duration_minutes": 75,
  "notes": "Interceded for the elders meeting.",
  "prayed_item_ids": [3, 9, 14]
}
```

**Response:** Updated prayer log object.

#### GET /api/prayer/log/{log_id}

Get a specific past prayer log.

**Response:** Single prayer log object.

#### GET /api/prayer/items

List all prayer items.

**Query Params:** `?category=church&is_answered=false&limit=100&offset=0`

**Response Body:**
```json
{
  "items": [
    {
      "id": 3,
      "label": "John",
      "category": "personal",
      "notes": "Praying for healing and clarity in his calling.",
      "is_answered": false,
      "answered_date": null,
      "answered_notes": null,
      "date_added": "2026-05-01",
      "created_at": "2026-05-01T10:00:00Z"
    }
  ],
  "total": 12,
  "limit": 100,
  "offset": 0
}
```

#### POST /api/prayer/items

**Request Body:**
```json
{
  "label": "John",
  "category": "personal",
  "notes": "Praying for healing.",
  "date_added": "2026-06-21"
}
```

**Response:** `201 Created` — full prayer item object.

#### PATCH /api/prayer/items/{item_id}

Update any field on a prayer item.

**Request Body (all optional):**
```json
{
  "label": "John Smith",
  "notes": "Updated note",
  "is_answered": true,
  "answered_date": "2026-06-21",
  "answered_notes": "God opened a door in remarkable timing."
}
```

**Response:** Updated prayer item object.

#### DELETE /api/prayer/items/{item_id}

**Response:** `204 No Content`

---

### Domain: Reflection

#### GET /api/reflection/today

Get today's reflection entry, or `null` if none logged.

**Response Body:**
```json
{
  "id": 5,
  "entry_date": "2026-06-21",
  "mode": "guided",
  "free_text": null,
  "prompt_stood_out": "The cloud of witnesses surrounding us in chapter 12.",
  "prompt_god_saying": "Run with endurance. Fix your eyes.",
  "prompt_do_differently": "Lay aside the weight of distraction in the morning.",
  "prompt_remember": "He who promised is faithful.",
  "linked_verses": [
    { "id": 11, "reference": "Heb 12:1", "verse_text": "Therefore, since we are surrounded..." }
  ]
}
```

#### PUT /api/reflection/today

Upsert today's reflection (auto-save target). Called on every debounced keystroke.

**Request Body:**
```json
{
  "mode": "guided",
  "free_text": null,
  "prompt_stood_out": "The cloud of witnesses...",
  "prompt_god_saying": "Run with endurance.",
  "prompt_do_differently": "Lay aside distractions.",
  "prompt_remember": "He who promised is faithful.",
  "linked_verse_ids": [11]
}
```

**Response:** `200 OK` — full reflection entry object.

#### GET /api/reflection/{entry_id}

Get a past reflection by ID.

#### PATCH /api/reflection/{entry_id}

Partial update for a past reflection (allows adding notes to a past day).

**Request Body (all optional):**
```json
{
  "mode": "free",
  "free_text": "Additional thought added later.",
  "linked_verse_ids": [11, 14]
}
```

**Response:** Updated reflection object.

#### GET /api/reflection/list

List all reflection entries, sorted by date descending.

**Query Params:** `?limit=50&offset=0`

**Response Body:**
```json
{
  "items": [
    {
      "id": 5,
      "entry_date": "2026-06-21",
      "mode": "guided",
      "teaser": "The cloud of witnesses surrounding us...",
      "linked_verse_count": 1
    }
  ],
  "total": 45,
  "limit": 50,
  "offset": 0
}
```

---

### Domain: Verses

#### GET /api/verses

List all saved verses.

**Query Params:** `?book=Hebrews&limit=50&offset=0`

**Response Body:**
```json
{
  "items": [
    {
      "id": 11,
      "book": "Hebrews",
      "chapter": 10,
      "verse": 23,
      "reference": "Heb 10:23",
      "verse_text": "Let us hold unswervingly to the hope we profess...",
      "date_saved": "2026-06-21",
      "linked_reflection_ids": [5]
    }
  ],
  "total": 28,
  "limit": 50,
  "offset": 0
}
```

#### POST /api/verses

**Request Body:**
```json
{
  "book": "Hebrews",
  "chapter": 10,
  "verse": 23,
  "reference": "Heb 10:23",
  "verse_text": "Let us hold unswervingly to the hope we profess...",
  "date_saved": "2026-06-21",
  "devotional_record_id": 18
}
```

**Response:** `201 Created` — full verse object.

#### GET /api/verses/{verse_id}

**Response:** Full verse object including `linked_reflection_ids`.

#### PATCH /api/verses/{verse_id}

**Request Body (all optional):**
```json
{
  "verse_text": "Updated text",
  "linked_reflection_ids": [5, 7]
}
```

**Response:** Updated verse object.

#### DELETE /api/verses/{verse_id}

**Response:** `204 No Content`

---

### Domain: Standard Prayers

#### GET /api/standard-prayers

List all standard prayer categories, sorted by `sort_order`.

**Response Body:**
```json
{
  "items": [
    {
      "id": 1,
      "category_name": "Church",
      "sort_order": 0,
      "content": "Lord, build your church...",
      "updated_at": "2026-06-20T18:00:00Z"
    }
  ]
}
```

#### POST /api/standard-prayers

Create a new category.

**Request Body:**
```json
{
  "category_name": "Missions",
  "sort_order": 3,
  "content": ""
}
```

**Response:** `201 Created` — full standard prayer object.

#### GET /api/standard-prayers/{prayer_id}

**Response:** Full standard prayer object.

#### PATCH /api/standard-prayers/{prayer_id}

Update content or metadata.

**Request Body (all optional):**
```json
{
  "category_name": "World Missions",
  "sort_order": 2,
  "content": "Expanded prayer content here..."
}
```

**Response:** Updated object.

#### DELETE /api/standard-prayers/{prayer_id}

**Response:** `204 No Content`

#### POST /api/standard-prayers/import

Import prayer content from a plain text or markdown file. Multipart form upload.

**Request:** `multipart/form-data` — field `file` (`.txt` or `.md`) + field `category_name` (string)

**Response:**
```json
{
  "id": 1,
  "category_name": "Church",
  "content": "...imported content...",
  "message": "Imported successfully"
}
```

---

### Domain: History (Devotional Records)

#### GET /api/history

List all devotional records with summary data, sorted by date descending.

**Query Params:** `?limit=50&offset=0&year=2026&month=6`

**Response Body:**
```json
{
  "items": [
    {
      "id": 18,
      "record_date": "2026-06-21",
      "summary": {
        "reading": "Hebrews 10–13",
        "prayer_duration": "1 hr 15 min",
        "reflection_written": true,
        "verse_count": 1
      }
    }
  ],
  "total": 142,
  "limit": 50,
  "offset": 0
}
```

#### GET /api/history/{record_id}

Get full devotional record with all linked data.

**Response Body:**
```json
{
  "id": 18,
  "record_date": "2026-06-21",
  "listening_notes": null,
  "reading_sessions": [ /* full session objects */ ],
  "prayer_log": { /* full prayer log object with prayed_items */ },
  "reflection_entry": { /* full reflection object with linked_verses */ },
  "saved_verses": [ /* full verse objects */ ]
}
```

#### GET /api/history/by-date/{date}

Get the devotional record for a specific date (`YYYY-MM-DD`). Returns `404` if no record exists for that date.

**Response:** Same shape as `GET /api/history/{record_id}`.

#### PATCH /api/history/{record_id}

Update the listening notes on a devotional record.

**Request Body:**
```json
{
  "listening_notes": "Listened to the sermon on Acts 2 by Pastor James."
}
```

**Response:** Updated devotional record (full shape).

---

### Domain: Settings

#### GET /api/settings

**Response Body:**
```json
{
  "id": 1,
  "display_name": "John",
  "display_title": "Pastor",
  "theme": "system",
  "ollama_model": "llama3.2:3b",
  "tracker_book": "Hebrews",
  "tracker_total_chapters": 13
}
```

#### PATCH /api/settings

**Request Body (all optional):**
```json
{
  "display_name": "John",
  "display_title": "Pastor",
  "theme": "dark",
  "ollama_model": "gemma2:2b",
  "tracker_book": "James",
  "tracker_total_chapters": 5
}
```

**Response:** Updated settings object.

#### GET /api/settings/export

Streams the SQLite database file as a download.

**Response:** `application/octet-stream` with header `Content-Disposition: attachment; filename="wordandway-backup-2026-06-21.sqlite"`

---

### Domain: AI (Ollama Proxy)

#### GET /api/ai/status

Check Ollama availability. Called on app startup.

**Response Body (when connected):**
```json
{
  "available": true,
  "model": "llama3.2:3b",
  "ollama_version": "0.3.6"
}
```

**Response Body (when not connected):**
```json
{
  "available": false,
  "model": null,
  "ollama_version": null
}
```

#### POST /api/ai/suggest-verses

Request verse suggestions for a completed reading session.

**Request Body:**
```json
{
  "book": "Hebrews",
  "start_chapter": 10,
  "end_chapter": 13
}
```

**Response Body (Ollama available):**
```json
{
  "available": true,
  "suggestions": [
    { "reference": "Heb 10:23", "reason": "The call to perseverance in holding to hope." },
    { "reference": "Heb 11:1", "reason": "The definition of faith as the passage into chapter 11." },
    { "reference": "Heb 12:1", "reason": "The cloud of witnesses exhortation." }
  ]
}
```

**Response Body (Ollama unavailable):**
```json
{
  "available": false,
  "suggestions": []
}
```

#### POST /api/ai/expand-prayer

Request prayer content expansion for a standard prayer category.

**Request Body:**
```json
{
  "category_name": "Church",
  "current_content": "Lord, build your church..."
}
```

**Response Body (Ollama available):**
```json
{
  "available": true,
  "suggestion": "Expanded prayer content text here..."
}
```

**Response Body (Ollama unavailable):**
```json
{
  "available": false,
  "suggestion": null
}
```

---

### Domain: Backup

#### GET /api/settings/export

(Documented above under Settings.) Streams the live SQLite file.

---

## 5. Frontend Architecture

### Routing Table

```
Path                         Component                   Notes
/                            DashboardPage               Default home screen
/reading                     ReadingPage                 Reading sessions + form
/reading/:sessionId          ReadingSessionDetail        View/edit single session
/prayer                      PrayerPage                  Prayer log + item list
/reflection                  ReflectionPage              Today's reflection editor
/reflection/:entryId         ReflectionDetail            View past reflection
/verses                      VersesPage                  Saved verse library
/standard-prayers            StandardPrayersPage         Recurring prayer categories
/history                     HistoryPage                 Devotional record list
/history/:recordId           DevotionalRecordDetail      Single past day view
/settings                    SettingsPage                User settings
*                            NotFoundPage
```

All routes are children of `AppShell`, which renders the persistent sidebar and main content area.

### Component Tree

```
App.tsx (QueryClientProvider + BrowserRouter)
  AppShell.tsx
    Sidebar.tsx
      - App title: "The Word and the Way" (Abril Fatface)
      - NavLink: Dashboard (/)
      - NavLink: Reading (/reading)
      - NavLink: Prayer (/prayer)
      - NavLink: Reflection (/reflection)
      - NavLink: Saved Verses (/verses)
      - NavLink: Standard Prayers (/standard-prayers)
      - NavLink: History (/history)
      - NavLink: Settings (/settings)
      - OllamaStatusDot (small indicator)
    <Outlet> (React Router)
      DashboardPage
        GreetingHeader
        ActivityGrid
          ActivityRow (Prayer)
          ActivityRow (Bible Reading)
          ActivityRow (Listening)
          ActivityRow (Reflection)
        HebrewsTracker
        StatsFooter
      ReadingPage
        ReadingSessionForm
          BookChapterSelector
        VerseSuggestions (shown after session logged)
        HolySpiritPrompt (shown if book completed)
        ReadingSessionList
          ReadingSessionCard[]
      PrayerPage
        PrayerLogForm
          PrayerLogLinker
        PrayerItemList
          PrayerItemCard[]
        AnsweredPrayersArchive
      ReflectionPage
        ReflectionEditor
          FreeWritingEditor | GuidedPromptsEditor
          VerseLinkChips
            VerseReferenceInput
      VersesPage
        SavedVerseList
          SavedVerseCard[]
        SavedVerseForm
      StandardPrayersPage
        PrayerCategoryList
          PrayerCategoryEditor[]
            AiExpandButton
      HistoryPage
        DevotionalRecordList
          DevotionalRecordSummaryRow[]
      DevotionalRecordDetail
        (read-only view of all linked session data)
      SettingsPage
        ProfileSettings
        ThemeSettings
        OllamaStatus
        DataExport
        ImportStandardPrayers
```

### TanStack Query Patterns

**Query Key Factory** (`src/lib/queryKeys.ts`):

```typescript
export const queryKeys = {
  dashboard: {
    today: () => ['dashboard', 'today'] as const,
    stats: () => ['dashboard', 'stats'] as const,
  },
  reading: {
    sessions: (filters?: { book?: string }) => ['reading', 'sessions', filters] as const,
    session: (id: number) => ['reading', 'session', id] as const,
    position: () => ['reading', 'position'] as const,
    stats: () => ['reading', 'stats'] as const,
    hebrewsTracker: () => ['reading', 'hebrews-tracker'] as const,
  },
  prayer: {
    logToday: () => ['prayer', 'log', 'today'] as const,
    log: (id: number) => ['prayer', 'log', id] as const,
    items: (filters?: { category?: string; isAnswered?: boolean }) =>
      ['prayer', 'items', filters] as const,
    item: (id: number) => ['prayer', 'item', id] as const,
  },
  reflection: {
    today: () => ['reflection', 'today'] as const,
    entry: (id: number) => ['reflection', 'entry', id] as const,
    list: () => ['reflection', 'list'] as const,
  },
  verses: {
    all: (filters?: { book?: string }) => ['verses', filters] as const,
    verse: (id: number) => ['verses', 'verse', id] as const,
  },
  standardPrayers: {
    all: () => ['standard-prayers'] as const,
    prayer: (id: number) => ['standard-prayers', id] as const,
  },
  history: {
    list: (filters?: { year?: number; month?: number }) => ['history', filters] as const,
    record: (id: number) => ['history', 'record', id] as const,
  },
  settings: {
    all: () => ['settings'] as const,
  },
  ai: {
    status: () => ['ai', 'status'] as const,
  },
} as const;
```

**Auto-Save Pattern** (used in `ReflectionEditor`):

```typescript
// src/hooks/useAutoSave.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/lib/api';

export function useAutoSave() {
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutation = useMutation({
    mutationFn: (data: ReflectionUpdatePayload) =>
      api.put('/reflection/today', data).then(r => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.reflection.today(), data);
    },
  });

  const scheduleAutoSave = useCallback(
    (data: ReflectionUpdatePayload) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        mutation.mutate(data);
      }, 1500); // 1.5-second debounce
    },
    [mutation]
  );

  return { scheduleAutoSave, isSaving: mutation.isPending };
}
```

**Optimistic Update Pattern** (used for prayer item mark-as-answered):

```typescript
const mutation = useMutation({
  mutationFn: (payload: { id: number; is_answered: boolean; answered_date: string }) =>
    api.patch(`/prayer/items/${payload.id}`, payload).then(r => r.data),
  onMutate: async (payload) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.prayer.items() });
    const previous = queryClient.getQueryData(queryKeys.prayer.items());
    queryClient.setQueryData(queryKeys.prayer.items(), (old: PrayerItemListResponse) => ({
      ...old,
      items: old.items.map(item =>
        item.id === payload.id ? { ...item, is_answered: payload.is_answered } : item
      ),
    }));
    return { previous };
  },
  onError: (_err, _payload, context) => {
    queryClient.setQueryData(queryKeys.prayer.items(), context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.prayer.items() });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.today() });
  },
});
```

### Tailwind Token Definitions

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ember & Stone palette
        ember: {
          primary: '#c4643d',    // terracotta
          secondary: '#8b6b5a',  // stone grey
          nav: '#2c2420',        // dark ember (sidebar)
          background: '#f0ebe4', // linen
          surface: '#faf7f4',    // warm white
          'text-primary': '#3a2e2a',
          'text-muted': '#9c8275',
        },
      },
      fontFamily: {
        display: ['"Abril Fatface"', 'serif'],
        body: ['"Source Serif 4"', 'Georgia', 'serif'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['36px', { lineHeight: '1.2' }],
        'display-md': ['28px', { lineHeight: '1.25' }],
        'heading-lg': ['22px', { lineHeight: '1.35' }],
        'heading-md': ['18px', { lineHeight: '1.4' }],
        'body-lg': ['18px', { lineHeight: '1.6' }],
        'body-md': ['16px', { lineHeight: '1.6' }],
        'label': ['14px', { lineHeight: '1.5' }],
        'meta': ['13px', { lineHeight: '1.4' }],
      },
      spacing: {
        sidebar: '240px',
      },
      borderRadius: {
        card: '8px',
        pill: '999px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

**Usage examples in components:**

```tsx
// Sidebar
<nav className="w-sidebar bg-ember-nav h-screen flex flex-col p-4">
  <h1 className="font-display text-display-md text-ember-surface mb-8">
    The Word and the Way
  </h1>
</nav>

// Dashboard greeting
<h2 className="font-display text-display-md text-ember-text-primary">
  Good {greetingPeriod}, {title} {name}
</h2>

// Activity row — logged state
<div className="bg-ember-surface rounded-card border-l-4 border-ember-primary p-4">

// Activity row — not logged state
<div className="bg-ember-surface rounded-card border-l-4 border-ember-secondary/30 p-4 opacity-70">
```

---

## 6. Ollama Integration

### Architecture

The browser never calls Ollama directly. FastAPI acts as the proxy. This ensures:
- Ollama is never exposed to browser CORS restrictions
- Graceful degradation is handled server-side with consistent response shapes
- The browser always receives a structured JSON response regardless of Ollama state

### Service Layer

```python
# app/services/ollama_service.py

import httpx
from app.config import settings
import logging

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_TIMEOUT = 30.0  # seconds


async def check_ollama_status() -> dict:
    """Ping Ollama and return availability + model info."""
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if response.status_code == 200:
                data = response.json()
                models = [m["name"] for m in data.get("models", [])]
                return {
                    "available": True,
                    "model": settings.ollama_model,
                    "ollama_version": response.headers.get("x-ollama-version"),
                }
    except (httpx.ConnectError, httpx.TimeoutException):
        pass
    return {"available": False, "model": None, "ollama_version": None}


async def suggest_verses(book: str, start_chapter: int, end_chapter: int) -> list[dict]:
    """
    Ask Ollama to suggest 1-3 key verses from the given chapter range.
    Returns empty list if Ollama is unavailable.
    """
    chapter_range = (
        f"{book} {start_chapter}"
        if start_chapter == end_chapter
        else f"{book} {start_chapter}-{end_chapter}"
    )
    prompt = (
        f"The reader just finished {chapter_range}. "
        f"Suggest 2-3 key verses from this passage that would be meaningful for meditation. "
        f"For each verse, give the reference (e.g., 'Heb 10:23') and a one-sentence reason. "
        f"Format: one verse per line, reference | reason. No other text."
    )

    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.3, "num_predict": 200},
                },
            )
            if response.status_code == 200:
                raw_text = response.json().get("response", "")
                return _parse_verse_suggestions(raw_text)
    except (httpx.ConnectError, httpx.TimeoutException) as e:
        logger.info("Ollama unavailable for verse suggestions: %s", e)

    return []


async def expand_prayer(category_name: str, current_content: str) -> str | None:
    """
    Ask Ollama to suggest an expansion of prayer content for a given category.
    Returns None if Ollama is unavailable.
    """
    prompt = (
        f"I am writing a prayer for the category: '{category_name}'. "
        f"Here is my current prayer:\n\n{current_content}\n\n"
        f"Please suggest a thoughtful, Scripture-rooted addition to this prayer. "
        f"Write in first-person prayer voice. Keep it concise (2-4 sentences). "
        f"Return only the suggested addition text, nothing else."
    )

    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.5, "num_predict": 300},
                },
            )
            if response.status_code == 200:
                return response.json().get("response", "").strip()
    except (httpx.ConnectError, httpx.TimeoutException) as e:
        logger.info("Ollama unavailable for prayer expansion: %s", e)

    return None


def _parse_verse_suggestions(raw_text: str) -> list[dict]:
    """Parse Ollama's pipe-delimited verse suggestion output."""
    suggestions = []
    for line in raw_text.strip().splitlines():
        if "|" in line:
            parts = line.split("|", 1)
            if len(parts) == 2:
                reference = parts[0].strip()
                reason = parts[1].strip()
                if reference:
                    suggestions.append({"reference": reference, "reason": reason})
    return suggestions[:3]  # cap at 3
```

### Graceful Degradation Pattern

The FastAPI router always returns the same response shape regardless of Ollama state:

```python
# app/routers/ai.py

from fastapi import APIRouter
from app.services.ollama_service import check_ollama_status, suggest_verses, expand_prayer
from app.schemas.ai import VerseRequest, PrayerExpandRequest

router = APIRouter(prefix="/ai", tags=["AI"])


@router.get("/status")
async def get_ollama_status():
    return await check_ollama_status()


@router.post("/suggest-verses")
async def suggest_key_verses(request: VerseRequest):
    suggestions = await suggest_verses(request.book, request.start_chapter, request.end_chapter)
    return {
        "available": len(suggestions) > 0,
        "suggestions": suggestions,
    }


@router.post("/expand-prayer")
async def expand_prayer_content(request: PrayerExpandRequest):
    suggestion = await expand_prayer(request.category_name, request.current_content)
    return {
        "available": suggestion is not None,
        "suggestion": suggestion,
    }
```

**Frontend degradation** — `useOllamaStatus` hook controls feature visibility:

```typescript
// src/hooks/useOllamaStatus.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/lib/api';

export function useOllamaStatus() {
  return useQuery({
    queryKey: queryKeys.ai.status(),
    queryFn: () => api.get('/ai/status').then(r => r.data),
    staleTime: 60_000,        // re-check every minute
    retry: false,             // don't retry on failure
    refetchOnWindowFocus: false,
  });
}
```

The `VerseSuggestions` component uses `useOllamaStatus()`:
- If `available === true`: show AI suggestions in a selectable list
- If `available === false`: show plain manual verse input (no error state, no loading spinner)

---

## 7. Data Flow

### Typical Devotional Session — End to End

This traces what happens when the user opens the app, logs a Bible reading session, and writes a guided reflection.

```
Step 1: App opens, dashboard loads
──────────────────────────────────
Browser → GET /api/dashboard/today
  FastAPI: calls stats_service.get_today_summary(date.today())
    SQLAlchemy: SELECT devotional_records WHERE record_date = today
      If found: JOIN reading_sessions, prayer_logs, reflection_entries
      If not found: return empty state (no record yet)
  FastAPI: returns DashboardResponse JSON
Browser: TanStack Query caches response under queryKeys.dashboard.today()
React: DashboardPage renders ActivityGrid with empty reading row

Step 2: User clicks "Bible Reading" row → navigates to /reading
──────────────────────────────────────────────────────────────
Browser → GET /api/reading/position
  FastAPI: reading_service.get_current_position()
    SQLAlchemy: SELECT reading_sessions ORDER BY session_date DESC LIMIT 1
  Returns: { book: "Hebrews", last_chapter: 9, book_completed: false }
React: ReadingSessionForm pre-fills book=Hebrews, start_chapter=10

Browser → GET /api/ai/status (background, if not already cached)
  FastAPI: ollama_service.check_ollama_status()
  Returns: { available: true, model: "llama3.2:3b" }

Step 3: User logs a reading session (Hebrews 10-13) and submits
────────────────────────────────────────────────────────────────
Browser → POST /api/reading/sessions
  Payload: { session_date: "2026-06-21", book: "Hebrews",
             start_chapter: 10, end_chapter: 13, notes: "..." }

  FastAPI: reading_service.create_session(payload)
    Step A — Ensure devotional record exists for today:
      SQLAlchemy: SELECT devotional_records WHERE record_date = today
        If none: INSERT devotional_records (record_date=today)
    Step B — Insert reading session:
      SQLAlchemy: INSERT reading_sessions (devotional_record_id, book, ...)
    Step C — Check if book is complete:
      reading_service.check_book_completion(book="Hebrews", through_chapter=13)
      Hebrews has 13 chapters → completed → sets holy_spirit_prompt_triggered=True
    Step D — Commit transaction
  Returns: 201 ReadingSession JSON

  TanStack Query: invalidates queryKeys.reading.sessions(),
                              queryKeys.reading.position(),
                              queryKeys.dashboard.today()

Browser → POST /api/ai/suggest-verses
  Payload: { book: "Hebrews", start_chapter: 10, end_chapter: 13 }
  FastAPI → ollama_service.suggest_verses()
    POST http://localhost:11434/api/generate (prompt: key verses in Heb 10-13)
    Ollama responds → parse → return 3 suggestions
  Returns: { available: true, suggestions: [...] }

React: VerseSuggestions component renders 3 clickable suggestions
User clicks "Heb 10:23" → triggers POST /api/verses to save it

Step 4: User navigates to /reflection and writes a guided reflection
─────────────────────────────────────────────────────────────────────
Browser → GET /api/reflection/today
  FastAPI: reflection_service.get_today_reflection()
    SQLAlchemy: SELECT reflection_entries WHERE entry_date = today
    No entry yet → returns null
  Returns: null

React: ReflectionPage renders GuidedPromptsEditor with four empty textareas
       (all four prompts visible simultaneously — see Section 10)

User begins typing in first prompt textarea
useAutoSave hook: starts 1.5-second debounce timer on each keystroke

After 1.5 seconds of idle:
Browser → PUT /api/reflection/today
  Payload: { mode: "guided", prompt_stood_out: "The cloud of witnesses..." }
  FastAPI: reflection_service.upsert_today_reflection(payload)
    SQLAlchemy: SELECT reflection_entries WHERE entry_date = today
      Not found → INSERT reflection_entries (devotional_record_id, mode, ...)
      Found → UPDATE reflection_entries SET prompt_stood_out = ...
    Commit
  Returns: 200 ReflectionEntry JSON
  TanStack Query: updates cache queryKeys.reflection.today()

User links verse to reflection:
Browser → PATCH /api/reflection/{entry_id}
  Payload: { linked_verse_ids: [11] }
  FastAPI: reflection_service.update_reflection_links(entry_id, verse_ids=[11])
    SQLAlchemy: INSERT reflection_verses (reflection_entry_id=5, saved_verse_id=11)
  Returns: 200 updated ReflectionEntry

Step 5: User returns to dashboard
──────────────────────────────────
TanStack Query: queryKeys.dashboard.today() is stale (was invalidated in Step 3)
Browser → GET /api/dashboard/today (automatic refetch)
  FastAPI: stats_service.get_today_summary()
    SQLAlchemy: SELECT with JOINs — finds reading session, reflection entry
  Returns: full dashboard payload with reading + reflection logged
React: ActivityGrid renders reading row (terracotta accent) + reflection row (terracotta)
       HebrewsTracker shows all 13 chapters complete
       StatsFooter shows updated streak
```

---

## 8. Development Setup

### Prerequisites

```bash
# Python 3.12+
python --version   # should be 3.12.x or higher

# uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Node.js 20+ and pnpm
node --version     # should be 20.x or higher
npm install -g pnpm

# Ollama (optional but recommended)
# Download from https://ollama.ai and install
ollama pull llama3.2:3b
```

### Backend Setup

```bash
# From repo root
cd backend

# Create virtual environment and install dependencies
uv sync

# Copy example env
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

# Run Alembic migrations (creates data/wordandway.db)
uv run alembic upgrade head

# Seed default settings and standard prayer categories
uv run python -m app.seeds.initial_seed

# Start the FastAPI dev server
uv run uvicorn app.main:app --reload --port 8000
```

**`.env.example` contents:**
```
DATABASE_URL=sqlite+aiosqlite:///./data/wordandway.db
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
CORS_ORIGINS=["http://localhost:5173"]
```

**`pyproject.toml` dependencies:**
```toml
[project]
name = "the-word-and-the-way-backend"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "sqlalchemy[asyncio]>=2.0.0",
    "aiosqlite>=0.20.0",
    "alembic>=1.13.0",
    "pydantic>=2.7.0",
    "pydantic-settings>=2.3.0",
    "httpx>=0.27.0",
    "python-multipart>=0.0.9",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "httpx>=0.27.0",
]
```

### Frontend Setup

```bash
# From repo root
cd frontend

# Install dependencies
pnpm install

# Initialize shadcn/ui (first time only)
pnpm dlx shadcn@latest init

# Start the Vite dev server
pnpm dev
# Runs on http://localhost:5173
# Proxies /api/* requests to http://localhost:8000
```

**`vite.config.ts` proxy configuration:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'The Word and the Way',
        short_name: 'Word & Way',
        theme_color: '#2c2420',
        background_color: '#f0ebe4',
        display: 'standalone',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

### Running Both Together (Development)

In two separate terminals:

```bash
# Terminal 1 — Backend
cd backend && uv run uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && pnpm dev
```

Open `http://localhost:5173` in the browser.

FastAPI docs available at `http://localhost:8000/docs`.

### Production Build

```bash
# Build the React app
cd frontend && pnpm build
# Output: frontend/dist/

# Copy dist into FastAPI's static directory
cp -r frontend/dist backend/app/static/

# Start FastAPI (serves both API and static files)
cd backend && uv run uvicorn app.main:app --port 8000
```

**`app/main.py` static file serving:**
```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

app = FastAPI(title="The Word and the Way API")

# API routes
app.include_router(dashboard_router, prefix="/api")
# ... other routers ...

# Serve React build (production only)
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the React SPA for all non-API routes."""
        return FileResponse(static_dir / "index.html")
```

---

## 9. Alembic Migration Strategy

### Configuration

```ini
# alembic.ini
[alembic]
script_location = alembic
sqlalchemy.url = sqlite+aiosqlite:///./data/wordandway.db
```

```python
# alembic/env.py
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

from app.models.base import Base
# Import all models to register them with Base.metadata
from app.models import (
    devotional_record, reading_session, prayer_log,
    prayer_item, standard_prayer, reflection_entry,
    saved_verse, user_settings
)

config = context.config
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.config_ini_section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
```

### Migration Workflow

**Creating a new migration after modifying a model:**
```bash
cd backend
# Alembic compares current models against the live DB schema
uv run alembic revision --autogenerate -m "add_listening_notes_to_devotional_record"
# Review the generated file in alembic/versions/
uv run alembic upgrade head
```

**Rolling back one migration:**
```bash
uv run alembic downgrade -1
```

**Checking current migration state:**
```bash
uv run alembic current
uv run alembic history --verbose
```

### Migration Naming Convention

Migrations are named with a sequential prefix and a descriptive slug:
```
0001_initial_schema.py
0002_add_listening_notes.py
0003_add_user_id_to_prayer_items.py
```

### First Migration: Initial Schema

The first migration (`0001_initial_schema.py`) creates all 8 tables in dependency order:
1. `user_settings`
2. `devotional_records`
3. `prayer_items`
4. `reading_sessions`
5. `prayer_logs`
6. `prayer_log_items` (junction table)
7. `reflection_entries`
8. `reflection_verses` (junction table)
9. `saved_verses`

After the initial migration runs, an initial seed script inserts:
- One `UserSettings` row with defaults (`display_name="Friend"`, `tracker_book="Hebrews"`)
- Four default `StandardPrayer` categories: Church, Pastors, Kingdom Expansion, Missions

### Phase II Migration Path

When Phase II introduces multi-user support, the `user_id` column already exists on `devotional_records`, `prayer_items`, `standard_prayers`, and `saved_verses` (defaulting to `"local"`). The Phase II migration will:
1. Create a `users` table
2. Add a FK constraint from `user_id` columns → `users.id`
3. Backfill the existing "local" user as a real user record

---

## 10. Open Questions Resolved

The PRD flagged three open questions (Q6, Q7, Q8). All three are resolved here with architecture-binding decisions.

### Q6 — Hebrews Tracker: Fixed or Following?

**Question**: Should the dashboard chapter tracker be hardcoded to Hebrews, or should it follow the user's current reading position automatically?

**Decision**: The tracker follows the current reading position automatically, starting with Hebrews.

**Implementation**:
- `UserSettings` stores two fields: `tracker_book` (default `"Hebrews"`) and `tracker_total_chapters` (default `13`).
- When the user completes the last chapter of the current tracker book (as detected by `reading_service.check_book_completion()`), the API returns `holy_spirit_prompt_triggered=True` in the reading session response.
- After the user records the Holy Spirit response and manually selects the next book/chapter in the `HolySpiritPrompt` panel, a `PATCH /api/settings` call updates `tracker_book` and `tracker_total_chapters` to reflect the new book.
- The Hebrews Tracker component on the dashboard reads from `GET /api/reading/hebrews-tracker` which uses `UserSettings.tracker_book` dynamically.
- The tracker title on the dashboard updates accordingly (e.g., "James — Chapter Progress").

**Why not hardcode**: The user is already in Hebrews; they will finish it. Hardcoding creates a dead component within weeks. Dynamic tracking costs minimal additional complexity and provides indefinitely useful value.

---

### Q7 — What Constitutes a "Day Logged" for the Streak Counter?

**Question**: What must be recorded for a day to count toward the reading streak and monthly logged-day count?

**Decision**: A day is counted as logged if **any one** of the following is recorded for that date: a reading session, a prayer log with duration, or a reflection entry with content.

**Implementation** in `app/services/stats_service.py`:

```python
async def is_day_logged(record_date: date, session: AsyncSession) -> bool:
    """
    A day is 'logged' if the devotional record has at least one of:
    - A reading session
    - A prayer log with duration_minutes > 0
    - A reflection entry with any non-empty text field
    """
    result = await session.execute(
        select(DevotionalRecord)
        .options(
            selectinload(DevotionalRecord.reading_sessions),
            selectinload(DevotionalRecord.prayer_log),
            selectinload(DevotionalRecord.reflection_entry),
        )
        .where(DevotionalRecord.record_date == record_date)
    )
    record = result.scalar_one_or_none()
    if not record:
        return False
    if record.reading_sessions:
        return True
    if record.prayer_log and record.prayer_log.duration_minutes:
        return True
    if record.reflection_entry and _reflection_has_content(record.reflection_entry):
        return True
    return False


def _reflection_has_content(entry: ReflectionEntry) -> bool:
    fields = [
        entry.free_text,
        entry.prompt_stood_out,
        entry.prompt_god_saying,
        entry.prompt_do_differently,
        entry.prompt_remember,
    ]
    return any(f and f.strip() for f in fields)
```

**Streak calculation**: Consecutive days counting backwards from today until the first day that is not logged. The `stats_service.calculate_streak()` function walks backwards through `devotional_records` ordered by date.

**Rationale**: Using any single activity honors the reality of devotional life — some days prayer is the center, some days reading is. Requiring all three would penalize valid, meaningful time with God. Using a strict "all three" rule contradicts the app's spirit of capturing the user's actual rhythm, not enforcing a prescribed one.

---

### Q8 — Guided Prompts: Sequential or All at Once?

**Question**: Should the four reflection prompts be shown one at a time (wizard style) or all simultaneously?

**Decision**: All four prompts are visible simultaneously, each with its own independent text area.

**Implementation** in `GuidedPromptsEditor.tsx`:

```tsx
const GUIDED_PROMPTS = [
  { field: 'prompt_stood_out', label: 'What stood out to me?' },
  { field: 'prompt_god_saying', label: 'What is God saying to me through this?' },
  { field: 'prompt_do_differently', label: 'What will I do differently?' },
  { field: 'prompt_remember', label: 'What do I want to remember?' },
] as const;

export function GuidedPromptsEditor({ value, onChange }: GuidedPromptsEditorProps) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {GUIDED_PROMPTS.map(({ field, label }) => (
        <div key={field} className="flex flex-col gap-2">
          <label className="font-ui text-label text-ember-text-muted">{label}</label>
          <textarea
            className="min-h-[120px] resize-y rounded-card border border-ember-secondary/30
                       bg-ember-surface p-3 font-body text-body-md text-ember-text-primary
                       focus:border-ember-primary focus:outline-none"
            value={value[field] ?? ''}
            onChange={(e) => onChange({ ...value, [field]: e.target.value })}
            placeholder="Write your reflection here..."
          />
        </div>
      ))}
    </div>
  );
}
```

**Why not sequential**: A wizard that hides prompts behind "Next" buttons adds clicks, creates perceived friction, and prevents the user from seeing the full shape of the reflection at a glance. Writing is non-linear — the user may want to answer prompt 4 before prompt 2. All prompts visible simultaneously respects how reflective writing actually works and aligns with the app's zero-friction principle.

**Auto-save behavior**: Each keystroke in any of the four textareas triggers the shared `useAutoSave` debounce. All four values are sent together in the PUT payload, so partial answers accumulate naturally without any explicit "save this prompt" action.

---

*"Your word is a lamp to my feet and a light to my path." — Psalm 119:105*

*This architecture document was produced by the BMAD Architect agent based on the approved Project Brief v1.0 and PRD v1.0. All technical decisions, data models, API contracts, and resolved open questions documented here are authoritative for Phase I implementation. Revisions require architect review.*