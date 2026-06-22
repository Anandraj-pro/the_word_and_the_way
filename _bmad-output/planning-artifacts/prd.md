# Product Requirements Document: The Word and the Way

**Product**: The Word and the Way — Personal Spiritual Journal Web App
**Prepared by**: BMAD Product Manager
**Date**: 21 June 2026
**Status**: Draft v1.0
**Based on**: Project Brief v1.0 (BMAD Business Analyst, 21 June 2026)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Goals and Objectives](#2-goals-and-objectives)
3. [User Personas](#3-user-personas)
4. [User Stories](#4-user-stories)
5. [Functional Requirements](#5-functional-requirements)
   - 5.1 Dashboard
   - 5.2 Bible Reading Tracker
   - 5.3 Prayer Tracker
   - 5.4 Reflection Journal
   - 5.5 Favorite Verse Library
   - 5.6 Standard and Recurring Prayers
   - 5.7 Unified Devotional Record
   - 5.8 Settings
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Design Specifications](#7-design-specifications)
8. [Technical Architecture Overview](#8-technical-architecture-overview)
9. [Out of Scope — Phase I](#9-out-of-scope--phase-i)
10. [Success Metrics](#10-success-metrics)
11. [Phased Roadmap](#11-phased-roadmap)
12. [Open Questions and Decisions Log](#12-open-questions-and-decisions-log)

---

## 1. Executive Summary

"The Word and the Way" is a personal spiritual discipline companion — a local-first, offline-capable web application that unifies Bible reading, prayer, and personal reflection into a single, warm, and intentional devotional experience. It is built for one user in Phase I: a pastor and developer who has an established daily devotional rhythm and needs a coherent digital home for that practice.

The application replaces fragmented tracking across notebooks, mental notes, and disconnected apps. Every devotional moment — the chapters read, the prayers offered, the verse that arrested the heart, the reflection written — is captured together, linked, and retrievable. The historical record becomes a living testimony of faithfulness.

Phase I delivers a fully functional personal web app. All data is stored locally on the user's device using SQLite via WebAssembly (OPFS), ensuring complete privacy, zero dependency on third-party services, and full offline operation. An optional Ollama integration provides local AI assistance for verse suggestions and prayer drafts without any data leaving the device.

The aesthetic is "Ember and Stone" — terracotta, warm stone, aged linen — designed to evoke a leather-bound journal rather than a productivity SaaS product.

---

## 2. Goals and Objectives

### Primary Goal

Enable the user to replace all manual devotional tracking (notebooks, mental notes) with this single application within the first week of use.

### Product Objectives

| # | Objective | Measure |
|---|-----------|---------|
| O1 | Capture every component of a daily devotional session in one place | All five session types (prayer, reading, reflection, verse, listening) can be logged from the dashboard |
| O2 | Make the app indispensable through zero friction | Time from app open to first log entry under 10 seconds |
| O3 | Preserve every recorded word without data loss | Zero data loss across app closes, browser refreshes, and offline sessions |
| O4 | Honor the personal nature of the practice | The greeting, history, and layout feel built for this specific user, not a generic audience |
| O5 | Operate without internet | All features (except optional Ollama AI) work fully offline |
| O6 | Establish the foundation for Phase II sharing | Data model and architecture support future multi-user extension without a rewrite |

### Non-Goals for Phase I

- Serving any user other than the primary user
- Any cloud connectivity, sync, or account system
- Mobile native apps
- Gamification, streaks leaderboards, or social features

---

## 3. User Personas

### Phase I — Primary Persona: The Pastor-Developer

| Attribute | Detail |
|-----------|--------|
| Role | Pastor and software developer (single user) |
| Devotional habit | Established daily rhythm; prayer, Bible reading, and journaling |
| Current Bible position | New Testament; currently in Hebrews |
| Prayer practice | Maintains a running intercessory prayer list for people, church, and kingdom intentions |
| Technical comfort | High — builder of this application; no need for onboarding simplification |
| Access pattern | Opens the app on their own terms; no reminders needed |
| Device | Laptop or desktop browser |
| Key frustration | Devotional data is split across mental memory, a notebook, and nothing at all |
| Core desire | One warm, personal place that captures what God is saying and what has been prayed |

---

## 4. User Stories

### Epic 1: Daily Dashboard

**US-01** — As a user, I want to see a personalized greeting when I open the app so that the experience feels personal and warm, not generic.

**US-02** — As a user, I want the dashboard to show a summary of today's devotional activity (prayer time, Bible reading, listening, reflection) so that I can see at a glance how my time with God has gone today.

**US-03** — As a user, I want each dashboard section to be clickable so that I can navigate directly to prayer, reading, or reflection without hunting through menus.

**US-04** — As a user, I want sections I have not yet completed today to show a subtle prompt so that I am gently reminded of what is still open, without feeling pressured.

**US-05** — As a user, I want to see a Hebrews chapter tracker prominently on the dashboard so that I can track my progress through the current book at a glance.

### Epic 2: Bible Reading Tracker

**US-06** — As a user, I want to log a Bible reading session by selecting a book, start chapter, and end chapter so that my reading is tracked precisely.

**US-07** — As a user, I want the app to remember where I left off so that I never have to re-enter my current position.

**US-08** — As a user, I want to see how many chapters I have read today and in total so that I have a sense of my reading pace and progress.

**US-09** — As a user, I want to be prompted to record what the Holy Spirit is saying about what to read next after finishing a book or section so that my reading remains Spirit-led rather than schedule-driven.

**US-10** — As a user, I want the app to suggest 1–3 key verses from the chapters I just read (via local LLM or curated list) so that I have a starting point for meditation without doing my own research.

**US-11** — As a user, I want to add a reflection note directly from the reading session so that my reflection is immediately linked to the passage that prompted it.

### Epic 3: Prayer Tracker

**US-12** — As a user, I want to maintain a running prayer list of people, intentions, and themes so that I never forget who or what I am praying for.

**US-13** — As a user, I want to add a category to each prayer item (personal, family, church, kingdom) so that I can organize and filter my intercession.

**US-14** — As a user, I want to mark a prayer item as answered with a date and optional note so that I have a permanent record of God's faithfulness.

**US-15** — As a user, I want to archive answered prayers and browse them by date so that I can revisit what God has done.

**US-16** — As a user, I want to log today's prayer session with time spent and optional freeform notes so that I capture the quality and duration of my prayer time.

**US-17** — As a user, I want to associate today's prayer log with specific items from my running prayer list so that I know which intercessions were active today.

**US-18** — As a user, I want to see a list of standard recurring prayers (church, pastors, kingdom, missions) in their own section so that structured prayers are always accessible during prayer time.

### Epic 4: Reflection Journal

**US-19** — As a user, I want to write a free-form reflection journal entry so that I can capture exactly what God is saying in my own words, without structural constraint.

**US-20** — As a user, I want to choose guided prompts mode for a reflection so that I have structured questions to work through when I want more intentional engagement with Scripture.

**US-21** — As a user, I want my reflection to be automatically associated with today's reading session and prayer log so that I do not have to manually link them.

**US-22** — As a user, I want to link a reflection to one or more specific Bible verses so that the entry is anchored to the text that prompted it.

**US-23** — As a user, I want all reflections to auto-save so that I never lose what I am writing due to accidental navigation or browser close.

### Epic 5: Favorite Verse Library

**US-24** — As a user, I want to save a verse as a favorite or meditation verse directly from a reading session so that meaningful verses are captured in the moment without friction.

**US-25** — As a user, I want my saved verses to be stored in a personal library so that I can browse, search, and return to them over time.

**US-26** — As a user, I want each saved verse to display the reference, my text entry (typed or noted), the date it was saved, and any linked reflection so that the full context of the moment is preserved.

### Epic 6: Unified Devotional Record

**US-27** — As a user, I want every day's reading session, prayer log, reflection, and saved verse to be stored as a single linked devotional record so that I can open any past date and see everything that happened in that devotional moment.

**US-28** — As a user, I want to browse a history of past devotional records by date so that my spiritual journey is reviewable and searchable over time.

### Epic 7: Settings and Personalization

**US-29** — As a user, I want to set my display name and title (e.g., "Pastor John") so that the dashboard greeting is accurate.

**US-30** — As a user, I want to export my data as a `.sqlite` file so that I have a local backup of my entire spiritual journal.

**US-31** — As a user, I want the app to detect whether Ollama is running and gracefully disable AI features if it is not so that the app is fully usable regardless of my local LLM status.

---

## 5. Functional Requirements

### 5.1 Dashboard

**FR-D-01**: On launch, the app renders the dashboard as the default home screen.

**FR-D-02**: The dashboard displays a personalized greeting in the format: `Good [Morning / Afternoon / Evening], [Title] [Name]`. Time-of-day logic: Morning = 5:00–11:59, Afternoon = 12:00–17:59, Evening = 18:00–4:59.

**FR-D-03**: The date is displayed below the greeting in the format: `[Day of Week], [DD Month YYYY]` (e.g., Sunday, 19 June 2026).

**FR-D-04**: The dashboard displays the following activity rows for the current day:
- Prayer — shows time logged (e.g., "1 hr 15 min") and a summary of prayer items covered
- Bible Reading — shows book and chapter range read (e.g., "Hebrews 10–13") and chapter count
- Listening to the Word — shows freeform text entry or dash if empty
- Reflection — shows "Written" with a teaser quote, or "Not yet logged"

**FR-D-05**: Each activity row is a clickable navigation target that routes to the corresponding section.

**FR-D-06**: Rows with no entry for the current day display a soft secondary-text prompt (e.g., "No reading logged yet today") with a visible add affordance.

**FR-D-07**: Rows with a completed entry for the day are visually distinguished with the primary accent color (terracotta).

**FR-D-08**: The dashboard includes a Hebrews chapter tracker showing completed chapters as a visual progress indicator (chapters 1–13, each chapter represented as a checkable block).

**FR-D-09**: The dashboard displays a stats row showing today's totals: prayer time, chapters read, and reflection status.

**FR-D-10**: The day resets at midnight. Data from previous days is accessible via history navigation, not by altering the current-day dashboard.

**FR-D-11**: An optional stats block at the bottom of the dashboard shows: current reading streak (consecutive days with a reading log) and current month's logged day count (e.g., "18/30 days").

### 5.2 Bible Reading Tracker

**FR-BR-01**: A reading session form accepts: Bible book (dropdown, full Bible), start chapter (number), end chapter (number), date (defaults to today), and optional notes.

**FR-BR-02**: The app stores the user's most recently completed chapter and book as their current reading position and displays it as context on the reading form (e.g., "Last read: Hebrews 9").

**FR-BR-03**: On completing a book, the app presents a "Holy Spirit Prompt" modal: "You've finished [Book]. Ask the Holy Spirit: what should I read next?" with a freeform text input to record the response and a manual selector to set the next book/chapter.

**FR-BR-04**: After logging a reading session, the app optionally surfaces 1–3 suggested key verses from the chapters read. If Ollama is available, suggestions come from the local LLM. If Ollama is unavailable, the field is presented as a manual entry with no suggestion.

**FR-BR-05**: The user can select one of the suggested verses or type their own as the session's "verse to meditate on," saving it directly to the Favorite Verse Library.

**FR-BR-06**: The Bible Reading section displays cumulative chapter counts: today, this week, this month, and all time.

**FR-BR-07**: The full reading history is browsable as a list of sessions, sorted by date descending, showing book, chapter range, and date.

**FR-BR-08**: Each reading session log entry is linked to the devotional record for that day.

**FR-BR-09**: The Hebrews chapter tracker (also visible on dashboard) displays all 13 chapters as individually checkable items. Chapters are marked complete when a reading session covering that chapter is logged.

**FR-BR-10**: The reading tracker supports all 66 books of the Protestant Bible canon in the book dropdown.

### 5.3 Prayer Tracker

#### 5.3.1 Running Prayer List (Intercessory)

**FR-PT-01**: The user can add a prayer item with the following fields: name or label (required), category (required — one of: Personal, Family, Church, Kingdom), notes (optional freeform), date added (auto-set to today, editable).

**FR-PT-02**: Prayer items are displayed as a list, grouped by category by default, with the ability to view as a flat list.

**FR-PT-03**: The user can edit any field of an existing prayer item inline.

**FR-PT-04**: The user can mark a prayer item as "Answered" by toggling its status. On marking as answered: a date-answered field is auto-populated (editable) and an optional "how it was answered" freeform note is presented.

**FR-PT-05**: Answered prayer items are moved to an "Answered Prayers" archive view, accessible within the Prayer section.

**FR-PT-06**: The answered prayers archive is browsable, sorted by date answered descending, and shows the full item including original notes and answer notes.

**FR-PT-07**: The user can delete a prayer item with a confirmation step.

#### 5.3.2 Daily Prayer Log

**FR-PT-08**: For each day, the user can log a prayer session with: time spent (manual text entry, e.g., "1 hr 15 min"), freeform notes on themes and petitions (optional), and a link to one or more active prayer list items that were prayed for today.

**FR-PT-09**: Each daily prayer log entry is linked to the devotional record for that day.

**FR-PT-10**: The prayer log for any past day is accessible from the history view.

**FR-PT-11**: Today's prayer log time is surfaced on the dashboard stats row.

### 5.4 Reflection Journal

**FR-RJ-01**: The reflection section provides two input modes, selectable per entry:
- Free Writing: a single open text area with auto-save
- Guided Prompts: four structured prompts presented sequentially or together, each with its own text area:
  1. "What stood out to me?"
  2. "What is God saying to me through this?"
  3. "What will I do differently?"
  4. "What do I want to remember?"

**FR-RJ-02**: The user can switch between free writing and guided prompts mode for a given entry without losing content already written.

**FR-RJ-03**: All reflection content auto-saves on every keystroke or at a maximum interval of 2 seconds. No explicit save action is required.

**FR-RJ-04**: Each reflection entry is automatically associated with the current day's reading session and prayer log.

**FR-RJ-05**: The user can link a reflection to one or more specific Bible verse references (book, chapter, verse). These links are stored as structured data, not just text.

**FR-RJ-06**: Linked verses are displayed as reference chips within the journal entry view.

**FR-RJ-07**: The reflection history is browsable as a list, sorted by date descending, showing the date, mode, a teaser of the first line, and linked verse references.

**FR-RJ-08**: A reflection entry can also be initiated directly from a reading session or prayer session, pre-linking it to that session.

### 5.5 Favorite Verse Library

**FR-VL-01**: The user can save a verse with the following fields: reference (book, chapter, verse — structured), verse text (manual entry), date saved (auto-set to today, editable), and linked reflection entry (optional).

**FR-VL-02**: Verses can be saved from: the Bible Reading Tracker (post-session verse capture), the Reflection Journal (via verse linking), or directly from the Favorite Verse Library as a standalone addition.

**FR-VL-03**: The library displays all saved verses in a list, sorted by date saved descending, with the reference, a truncated verse text, and the date.

**FR-VL-04**: The user can open any saved verse to view the full text, linked reflection, and date saved.

**FR-VL-05**: The user can edit the verse text and linked reflection after saving.

**FR-VL-06**: The user can delete a saved verse with a confirmation step.

### 5.6 Standard and Recurring Prayers

**FR-SP-01**: A dedicated section presents structured recurring prayer categories (e.g., Church, Pastors, Kingdom Expansion, Missions).

**FR-SP-02**: Each category contains prayer content editable by the user as freeform rich text.

**FR-SP-03**: Initial content for each category is either: blank with placeholder guidance text, or seeded from files imported by the user during setup (format: plain text or markdown files, one file per category).

**FR-SP-04**: The user can add new categories, rename existing ones, and delete categories.

**FR-SP-05**: Standard prayer content is accessible for reading during prayer time and can be referenced from the daily prayer log.

**FR-SP-06**: If Ollama is available, the user can invoke a "Help me expand this prayer" prompt per category, which sends the current content to the local LLM and returns a suggested addition. The user accepts, edits, or discards the suggestion before it is applied.

### 5.7 Unified Devotional Record

**FR-DR-01**: For each calendar date on which any activity is logged, the system automatically creates and maintains a Devotional Record linking: the reading session(s), the prayer log, the reflection entry, and all saved verses from that date.

**FR-DR-02**: The Devotional Record for a past day is accessible via a History/Archive view.

**FR-DR-03**: The History view lists all dates with at least one logged activity, sorted by date descending, with a summary line per date (e.g., "Hebrews 10–13 · 1 hr 15 min prayer · Reflection written").

**FR-DR-04**: Opening a past Devotional Record displays all linked content in a read-only view with the option to add additional notes to the reflection.

**FR-DR-05**: The user can navigate between adjacent Devotional Records (previous day / next day) from within the record view.

### 5.8 Settings

**FR-ST-01**: A Settings screen allows the user to configure: display name (e.g., "John"), display title (e.g., "Pastor"), and theme preference (light / dark / system).

**FR-ST-02**: The settings screen provides a data export function that creates and downloads a `.sqlite` file of the entire application database.

**FR-ST-03**: The settings screen displays the Ollama connection status (connected / not detected) and the model name in use when connected.

**FR-ST-04**: The settings screen provides a section for importing Standard Prayer content from local files (plain text or markdown, one file per category).

---

## 6. Non-Functional Requirements

### 6.1 Offline Operation

**NFR-OF-01**: The application must function fully without an internet connection. All core features — logging, viewing, editing, and browsing history — must work offline.

**NFR-OF-02**: The application must be served as a Progressive Web App (PWA), installable on the user's machine for app-like launch behavior.

**NFR-OF-03**: All application assets (JavaScript, CSS, fonts) must be cached via a service worker on first load so that the UI renders from cache without any internet connection.

**NFR-OF-04**: The Ollama AI integration is the only feature that requires a connection to a local process (localhost:11434). All AI-dependent features must degrade gracefully when Ollama is unavailable, presenting the relevant field as a manual input without error states.

**NFR-OF-05**: The SQLite database file must persist across app restarts and machine reboots without data loss. It is stored in the project's `data/` directory on the local filesystem.

### 6.2 Performance

**NFR-PF-01**: The application must reach interactive state (dashboard visible and responsive) within 2 seconds on a modern laptop over a cold launch with cached assets.

**NFR-PF-02**: All in-app navigation transitions must complete within 300 milliseconds.

**NFR-PF-03**: Auto-save writes must complete within 500 milliseconds of the triggering keystroke without blocking the UI.

**NFR-PF-04**: The SQLite WASM worker must initialize in the background without blocking the initial dashboard render.

**NFR-PF-05**: The application must remain responsive with a devotional history of up to 5 years of daily records (approximately 1,825 records) without performance degradation.

### 6.3 Privacy and Data Sovereignty

**NFR-PR-01**: No user data is transmitted to any external server, API, or analytics service in Phase I.

**NFR-PR-02**: The entire database lives in the browser's Origin Private File System (OPFS), scoped to the application origin. No other browser tab, extension, or application can access it.

**NFR-PR-03**: Ollama requests are made to `localhost:11434` only. No cloud LLM API is called. No journal content, prayer list content, or reflection text is sent to any remote endpoint.

**NFR-PR-04**: The application does not use cookies, localStorage for sensitive data, or any third-party tracking scripts.

**NFR-PR-05**: The data export function (`.sqlite` file) places the exported file in the user's local downloads directory and does not transmit it.

### 6.4 Reliability and Durability

**NFR-RD-01**: Auto-save must ensure that no more than 2 seconds of typed content can be lost due to unexpected browser close or navigation.

**NFR-RD-02**: The application must handle SQLite write errors gracefully, surfacing a non-intrusive error indicator and retrying the write operation.

**NFR-RD-03**: The application must handle the SQLite WASM worker becoming unavailable (e.g., browser killing the worker) by detecting the failure and prompting the user to reload.

### 6.5 Accessibility

**NFR-AC-01**: All interactive elements must be keyboard navigable.

**NFR-AC-02**: All form inputs must have associated labels.

**NFR-AC-03**: Color is not the only means of conveying state (e.g., logged vs. not logged rows use both color and a text/icon indicator).

**NFR-AC-04**: The application must support system-level dark mode preference as the default dark mode trigger, with a manual override in settings.

### 6.6 Browser Compatibility

**NFR-BC-01**: The application must support the latest stable versions of Chrome and Firefox on macOS.

**NFR-BC-02**: OPFS is required and is not polyfillable. If a browser does not support OPFS, the application must display a clear, friendly message explaining the requirement rather than silently failing.

---

## 7. Design Specifications

### 7.1 Design Theme: Ember and Stone

The visual language is warm, contemplative, and personal. The application should feel like opening a leather-bound journal, not launching a productivity tool.

### 7.2 Color Palette

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--color-primary` | Terracotta | `#c4643d` | Primary actions, active states, accent highlights |
| `--color-secondary` | Stone Grey | `#8b6b5a` | Secondary text, borders, muted elements |
| `--color-background` | Linen | `#f0ebe4` | Main page background |
| `--color-nav` | Dark Ember | `#2c2420` | Navigation sidebar background |
| `--color-surface` | Warm White | `#faf7f4` | Card and panel surfaces |
| `--color-text-primary` | Deep Stone | `#3a2e2a` | Primary body text |
| `--color-text-muted` | Warm Taupe | `#9c8275` | Secondary and placeholder text |

### 7.3 Typography

| Role | Font Family | Weight | Size |
|------|------------|--------|------|
| Display / App Title | Abril Fatface | 400 | 28–36px |
| Dashboard Greeting | Abril Fatface | 400 | 24–28px |
| Section Headings | Source Serif 4 | 600 | 18–22px |
| Body / Reflection Text | Source Serif 4 | 400 | 16–18px |
| Scripture / Verse Text | Source Serif 4 | 400 Italic | 16–18px |
| UI Labels / Navigation | System UI / Inter | 500 | 13–14px |
| Stats / Metadata | System UI / Inter | 400 | 12–13px |

Both Abril Fatface and Source Serif 4 are loaded from Google Fonts and cached by the service worker for offline availability.

### 7.4 Layout

The application uses a two-column layout:

- **Left column (navigation sidebar)**: Fixed width (~240px), dark nav background (`#2c2420`), contains app title, primary navigation links, and settings access.
- **Right column (content area)**: Flexible width, linen background (`#f0ebe4`), renders the active section.

On the dashboard, the content area is subdivided into:
- A full-width greeting and date header
- A two-column grid for the activity summary rows
- A full-width Hebrews chapter tracker
- An optional stats/streak row at the bottom

### 7.5 Interaction Principles

- No modal dialogs for primary actions. All data entry happens inline or in a dedicated section view.
- All text entry auto-saves. No save button is shown for journal or note content.
- Destructive actions (delete, mark as answered, overwrite) require a single confirmation step.
- Navigation transitions are smooth but not animated for speed — instant render, no slide or fade delays that add perceived latency.

---

## 8. Technical Architecture Overview

This section summarizes the agreed technology choices to provide context for implementation. The full Architecture Document (produced by the BMAD Architect) will specify data models, API contracts, folder structure, and component tree.

**Architecture model**: Local client-server. FastAPI runs on the user's machine (`localhost:8000`); the React frontend is served by Vite in dev and by FastAPI's static file serving in production. Because both processes are local, the app is fully offline — no internet is required at any point.

### 8.1 Backend Stack

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| API Framework | FastAPI | Python 3.12+; async; auto-generates OpenAPI docs |
| ASGI Server | Uvicorn | Dev: `--reload`; production: single process |
| Database | SQLite | Local file on user's machine; no server process needed |
| ORM | SQLAlchemy | 2.0 async style with Alembic for migrations |
| Validation | Pydantic v2 | Schema and request/response models |
| AI Integration | Ollama HTTP client | `httpx` async calls to `localhost:11434` |
| Package Manager | uv | Fast Python dependency management |

### 8.2 Frontend Stack

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Framework | React | 18+ with TypeScript (strict mode) |
| Build Tool | Vite | Latest stable |
| Styling | Tailwind CSS | v3+, custom design tokens for Ember and Stone palette |
| Components | shadcn/ui | Radix UI primitives; accessible by default |
| Routing | React Router | v6 |
| API Client | TanStack Query | Server state management + caching against FastAPI REST endpoints |
| Icons | Lucide React | Ships with shadcn/ui |
| Package Manager | pnpm | Fast, efficient |

### 8.3 Data Layer

| Layer | Technology | Notes |
|-------|-----------|-------|
| Database file | SQLite (`.db` file) | Lives in project `data/` directory on user's machine |
| ORM | SQLAlchemy 2.0 | Async sessions; typed models |
| Migrations | Alembic | Version-controlled schema; auto-generates migration scripts |
| Backup | `.sqlite` file download | FastAPI endpoint streams the db file to the browser |

### 8.4 AI Integration

| Layer | Technology | Notes |
|-------|-----------|-------|
| LLM Runtime | Ollama (local) | Runs on user's machine |
| Model | Llama 3.2 3B or Gemma 2B | Small, fast, no GPU required |
| API | FastAPI → `http://localhost:11434/api/generate` | Backend proxies Ollama; frontend never calls Ollama directly |
| Fallback | Empty field returned | FastAPI returns `null` suggestion when Ollama unreachable; frontend displays manual input |

### 8.5 Offline Strategy

Since both FastAPI and the frontend run locally, the app works offline by default. No service worker is required for data access — the database is a local file. A minimal service worker is used only for caching the React build assets so the UI loads instantly from cache.

| Requirement | Implementation |
|-------------|---------------|
| Data offline | SQLite file is on the machine; FastAPI is local — no internet needed |
| Asset offline | Vite PWA plugin (`vite-plugin-pwa`) caches JS/CSS/fonts on first load |
| PWA installable | Manifest + service worker; installable on macOS Chrome |

### 8.6 Key Data Entities (Overview)

The following entities will be fully specified in the Architecture Document:

- `DevotionalRecord` — anchor record per date; links all session types
- `ReadingSession` — book, chapter range, date, notes, linked verses
- `PrayerLog` — date, duration, freeform notes, linked prayer items
- `PrayerItem` — name, category, notes, status, answered fields
- `StandardPrayer` — category name, content, last updated
- `ReflectionEntry` — mode, free text, guided prompt responses, linked verses
- `SavedVerse` — reference (structured), text, date, linked reflection
- `UserSettings` — display name, title, theme preference

---

## 9. Out of Scope — Phase I

The following features are explicitly excluded from Phase I. They are documented here to prevent scope creep and to inform the architecture's extensibility requirements.

| Feature | Rationale for Deferral | Target Phase |
|---------|------------------------|--------------|
| Mobile app (iOS / Android native) | Phase I is personal web app only; React Native consideration for Phase III | Phase III |
| User accounts and authentication | Single user, local only; auth adds infrastructure complexity with no Phase I benefit | Phase II |
| Multi-user sharing and collaboration | Requires auth, cloud backend, and privacy model | Phase II |
| Cloud sync and backup | Supabase integration planned; out of scope until Phase II multi-user | Phase II |
| Push notifications and reminders | User self-initiates; notifications are out of spirit of the app's zero-friction principle | Not planned |
| Bible text API (full in-app Bible) | Adds dependency on external API; verse text is manual entry in Phase I | Phase II |
| Tags and mood tracking for entries | Useful but not essential for the core devotional workflow | Future |
| Audio/video "Listening to the Word" logging | Field is present on the dashboard as a freeform text placeholder only | Post-MVP |
| Advanced LLM features (conversation, brainstorming) | Ollama integration is scoped to verse suggestions and prayer draft assistance only | Post-MVP |
| Import from existing notes, journals, or notebooks | User is starting fresh; historical import is a future consideration | Post-MVP |
| Streak gamification, badges, or scoring | App will show a plain streak count; no badges, points, or leaderboard elements | Not planned |
| Standard prayer content (fully built out) | Section is scaffolded; content is added iteratively by the user | Ongoing |
| Community prayer wall | Requires Phase III multi-user infrastructure | Phase III |
| Reading plans with fixed schedules | The app follows the user's pace; structured plans are contrary to Phase I principles | Future |

---

## 10. Success Metrics

### 10.1 Launch Criteria (Definition of Done for Phase I)

Phase I is complete and ready for daily use when all of the following are true:

| # | Criterion | Verification Method |
|---|-----------|---------------------|
| L1 | Dashboard renders with personalized greeting and current day's summary on cold launch | Manual test: open app, verify greeting and date |
| L2 | Bible reading session can be logged end-to-end and persists after browser close | Manual test: log session, close browser, reopen, verify data |
| L3 | Prayer list: items can be added, edited, marked answered, and archived | Manual test: full CRUD cycle |
| L4 | Daily prayer log: time and notes can be recorded and linked to prayer items | Manual test |
| L5 | Reflection journal: free writing and guided prompts both work; content auto-saves | Manual test: type, close tab abruptly, reopen, verify content |
| L6 | Favorite verse can be saved from reading session and appears in library | Manual test |
| L7 | Standard prayer section displays categories; content is editable | Manual test |
| L8 | Past devotional record is accessible and shows all linked session data | Manual test: navigate to a past date |
| L9 | App functions fully offline (no network connection) | Manual test: disable Wi-Fi, use all core features |
| L10 | Data export produces a valid `.sqlite` file that opens in a SQLite browser | Manual test |
| L11 | Hebrews chapter tracker reflects completed chapters correctly | Manual test: log Hebrews chapters, verify tracker |
| L12 | Settings: name and title update the dashboard greeting | Manual test |

### 10.2 Quality Metrics

| Metric | Target |
|--------|--------|
| Dashboard interactive load time | Under 2 seconds on a modern laptop (MacBook-class hardware) |
| Navigation transition time | Under 300 milliseconds |
| Auto-save latency | Under 2 seconds from last keystroke |
| Data loss on abrupt close | Zero — last auto-save within 2 seconds is recoverable |
| Browser compatibility | Chrome (latest), Firefox (latest) on macOS |

### 10.3 Adoption Metrics (Personal)

These are behavioral indicators that Phase I has achieved its goal:

| Metric | Target |
|--------|--------|
| Consecutive days of use | 5 consecutive devotional days within the first 2 weeks |
| Notebook replacement | User no longer uses a physical notebook or mental tracking for their devotional habit |
| Subjective satisfaction | User reports: "This feels like mine" |
| Data richness | At least 10 linked devotional records (prayer + reading + reflection on the same day) within the first month |

---

## 11. Phased Roadmap

### Phase I — Personal Web App (Current: MVP)

**Timeline**: Immediate build, targeting daily use within the first sprint.

**Scope**: All features described in this PRD.

**Architecture constraints carried into Phase I to enable Phase II**:
- Data model uses stable entity IDs (UUIDs) suitable for future sync conflict resolution
- Drizzle schema is authored with migration support from the first commit
- No hardcoded single-user assumptions in the data layer (user_id fields are present but default to a local constant in Phase I)
- Standard prayer content and prayer items use a category system extensible to shared/group content

---

### Phase II — Family and Friends (6–18 months)

**Trigger**: User decides to share the app with family members or close friends.

**New capabilities**:
- User accounts and authentication (Supabase Auth)
- Cloud database sync (Supabase PostgreSQL, migrated from local OPFS/SQLite)
- Invite system: link-based or email invitation to share specific content
- Selective sharing: user controls which prayer items, reflections, and reading progress are shared vs. private
- Shared prayer lists with per-item visibility settings
- Reading plan sharing ("We are all reading through Matthew together")
- Bible verse text via API (e.g., bible-api.com or ESV API) when online, with cached fallback

**Architecture changes**:
- Introduce a sync layer between local SQLite (still present as the write-ahead log) and Supabase
- Row-Level Security (RLS) policies for all shared tables
- Auth-gated routes and components

---

### Phase III — Church Community (18–36 months)

**Trigger**: The user's church or a community of practice wants to adopt the app collectively.

**New capabilities**:
- Mobile applications (React Native or PWA with full offline) for iOS and Android
- Community reading plans with per-member progress tracking
- Group prayer walls with moderation controls
- Pastor-to-congregation devotional broadcast (post a reading or reflection to all members)
- Role-based access control (pastor, deacon, member, guest)
- Community stats dashboard (aggregated, anonymous: "47 members are reading Matthew this week")
- Notification system (push notifications for new posts, prayer request updates) — opt-in only

**Architecture changes**:
- Dedicated backend services (Supabase Edge Functions or a Node.js API layer)
- Push notification infrastructure (Web Push for PWA; APNs/FCM for native)
- Content moderation tooling for community-submitted prayer requests
- Admin interface for role and content management

---

## 12. Open Questions and Decisions Log

| # | Question | Status | Decision / Notes |
|---|----------|--------|-----------------|
| Q1 | What name and title should be used in the dashboard greeting? | Resolved | User sets display name ("John") and title ("Pastor") in Settings (FR-ST-01). Default state prompts setup on first launch. |
| Q2 | Standard prayer content format — what files will the user import? | Open | Phase I scaffolds the section with editable categories. User imports plain text or markdown files per category via the Settings screen (FR-ST-04). Format of existing files TBD by user. |
| Q3 | Bible verse text source — manual entry or API? | Resolved | Manual entry in Phase I. User types or pastes verse text. Bible API integration deferred to Phase II. |
| Q4 | "Listening to the Word" field — what does it capture? | Partially open | Field is present on the dashboard as a freeform text input (e.g., "Sermon by Pastor X, Acts 2"). Structured logging (audio tracking, timestamps) is out of scope for Phase I. User will define further as needed. |
| Q5 | Ollama availability detection — should the app detect and gracefully degrade? | Resolved | Yes. On load, the app pings `localhost:11434/api/tags`. If no response within 2 seconds, Ollama-dependent features display as manual entry fields with no error state (NFR-OF-04, FR-ST-03). |
| Q6 | Should the Hebrews chapter tracker be the only book-specific tracker on the dashboard, or should it follow the user's current reading position? | Open | Default: Hebrews tracker is hardcoded to Hebrews for Phase I (matching the user's current position). Future enhancement: the tracker follows the current book automatically. Decision needed before implementation. |
| Q7 | What constitutes a "day logged" for the streak counter? | Open | Recommend: a day is counted if any one of (reading session, prayer log, reflection) is recorded. Decision needed before implementation to ensure consistency across the stats row, streak counter, and devotional record list. |
| Q8 | Should the guided prompts in Reflection mode be presented sequentially (one at a time) or all at once on screen? | Open | Recommend: all four prompts visible simultaneously, each with its own text area. Sequential presentation may feel like a wizard and add friction. Decision needed before UI implementation. |

---

*"Your word is a lamp to my feet and a light to my path." — Psalm 119:105*

*This PRD was produced by the BMAD Product Manager agent based on the approved Project Brief (v1.0) and confirmed design and technology decisions from the project owner. All feature decisions, phasing, and acceptance criteria are subject to revision by the project owner prior to development kickoff.*