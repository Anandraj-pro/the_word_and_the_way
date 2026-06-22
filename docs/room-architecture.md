# The Word and the Way — Room Architecture

**The north-star spec.** Everything we build serves one idea: the app is not a dashboard with
pages. It is **one room you enter** — a personal prayer chamber / library where the Word enters
your life and walks a path through it.

> The Word enters. The Word walks a way through you. The app holds the room where that happens.

This document supersedes the feature-list framing of the brainstorm. The 62 ideas are not 62
features — they are furniture and lighting in a single room, organized around one object moving
through one lifecycle.

---

## 1. The core insight — one object, five stages

The six "content types" (rhema, journal, promises, confessions, declarations, testimonies) are
**not separate features that connect to each other.** They are one object — an **Encounter** —
seen at different points on a single path:

```
   RECEIVE          REFLECT          DECLARE           CARRY            WITNESS
   (rhema)   →     (journal)   →   (confession/   →   (promise)   →   (testimony)
                                    declaration)
```

A verse meets your life. You **receive** it, **reflect** on it in writing, **declare** it,
**carry** it across seasons until it becomes a cornerstone, and finally **witness** that God
kept it. That movement *is* "The Word and the Way."

### The Encounter — the single data spine

Everything in the room is one record type with facets, not six tables:

| Field | Meaning |
|---|---|
| `scripture` | The verse(s) — may be empty (a pure journal/prayer entry) |
| `words` | The Pastor's own text — what he received, wrote, or declared |
| `stage` | `received` · `reflecting` · `declared` · `carried` · `witnessed` |
| `season_id` | The named season it belongs to (never a raw date as the primary lens) |
| `received_on` | The date — surfaced for "On This Day," never used to sort the archive |
| `carry_count` | Times carried forward across seasons (3+ = Cornerstone → Altar) |
| `themes` | Inferred by Ollama, never hand-tagged |

The six features stop needing to be "connected" — they were never separate. A confession is an
Encounter at the `declared` stage; a cornerstone promise is an Encounter with `carry_count >= 3`.

---

## 2. The room — one space, five stations

Not twelve nav items. Five places in one room. **You enter facing the Altar.**

```
┌─────────────────────────────────────────────────────────┐
│                      THE ALTAR                          │  ← entry view; you face this
│        ▓▓ cornerstone promises, carved in stone ▓▓       │     (Carry stage)
│        ▓▓▓▓ carried words sit deeper, darker ▓▓▓▓        │
│                                                          │
│   "What are you bringing to God today?"  __________      │  ← threshold line, on the Altar
├──────────────┬───────────────────────────┬──────────────┤
│  THE SHELVES │        THE DESK           │  THE WALL    │
│  (Archive)   │   (Receive + Reflect)     │  (Declare)   │
│  seasons as  │   today's page, rhema     │  confessions │
│  spines      │   capture, journal        │  & War Room  │
├──────────────┴───────────────────────────┴──────────────┤
│                      THE WINDOW                          │
│        testimonies — yours first, then the world         │  ← Witness stage
└─────────────────────────────────────────────────────────┘
```

| Station | Lifecycle stage | Holds | From brainstorm |
|---|---|---|---|
| **The Altar** | Carry | Cornerstone promises inscribed in stone; the threshold prayer line | Altar of Remembrance, Sanctuary Wall, Carried Promise |
| **The Desk** | Receive + Reflect | Today's blank page, rhema capture, dialogue journal | Threshold Moment, Dialogue Journal, Praying Reader |
| **The Shelves** | Archive | Past Encounters, **spines = named seasons** | Rhema Archive, Season Wall, Named Seasons |
| **The Wall** | Declare | Confessions & declarations corpus; War Room mode | Confessions library, Declaration Volume, War Room |
| **The Window** | Witness | Personal testimonies, then Global Testimony Wall | Testimony Wall, Spiritual Wrapped |

The corpus in `docs/confessions_md/` (50+ files) populates **The Wall** on day one.

---

## 3. The decisions that killed the old build (now resolved)

The previous version felt incoherent because three rival systems fought each other. Resolved:

- **One navigation, not three.** Sacred Compass / Three-Watch / Progressive Revelation were
  competing nav paradigms. They are now **lighting on one room, not navigation:**
  - *Spatial layout* = the room (permanent, always the five stations).
  - *Three-Watch & Seasonal Skin* = **how the room is lit** (palette/typography shift by hour
    and season) — never moves the furniture.
  - *Progressive Revelation* = **stations fade in as you have data** — but the room is always
    the room; empty stations are simply dim, not absent.
- **One opening, not five.** You enter **facing the Altar** with the threshold line on it. On
  This Day, Prophetic Greeting, and Listen-Before-Speaking are *content surfaced on the Altar*,
  not separate entry screens.
- **One calendar.** Season is the organizing lens. Dates exist only for "On This Day."

---

## 4. Build plan — the full room shell, shallow first

Target: **all five stations visible in one room**, each shallow, then deepen. Order:

1. **The room shell + Encounter model** — single-page spatial layout (Altar entry, four
   stations framing it) backed by the one `Encounter` table. Stations render real but minimal.
2. **The Desk → Altar loop** — capture an Encounter at the Desk; carry it; watch it inscribe on
   the Altar. This is the soul of the app; prove it end-to-end.
3. **The Wall** — load the `confessions_md` corpus; reading + Declare/War Room mode.
4. **The Shelves** — seasons as spines; browse past Encounters by season.
5. **The Window** — personal testimonies first; Global Testimony Wall later (TODO).
6. **Lighting** — Seasonal Skin + Three-Watch palette/type shifts.

Phase II (church RBAC, corporate watch, sermon quarry) is deferred — it is more furniture for a
room that must first feel holy to one person.

---

## 5. Design language (unchanged — Ember & Stone)

Terracotta `#c4643d` · stone grey `#8b6b5a` · linen `#f0ebe4` · dark `#2c2420` ·
Abril Fatface (headings) + Source Serif 4 (body). Vocabulary is liturgical: stone, sanctuary,
threshold, vigil, inscription, carried, witness — never technological.

**Stack:** FastAPI + SQLite + SQLAlchemy · React + TypeScript + Tailwind + shadcn/ui · Ollama
(local, offline) for invisible theme inference and the Promise Surfacer.
