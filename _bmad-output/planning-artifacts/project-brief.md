# Project Brief: The Word and the Way
**A Spiritual Journal and Daily Devotional Tracker**

*Prepared by: BMAD Business Analyst (Mary)*
*Date: 21 June 2026*
*Status: Draft v1.0*

---

## 1. Project Vision and Purpose

### Vision Statement

"The Word and the Way" is a personal spiritual discipline companion — a digital devotional tracker that helps the user faithfully record, reflect on, and grow through daily time with God. It replaces scattered mental notes, physical notebooks, and disconnected apps with a single, warm, and intentional space where Bible reading, prayer, and personal reflection are unified around each devotional moment.

### Purpose

The core problem this app solves: there is no single place where a daily devotional practice — reading Scripture, recording prayers, writing reflections, and tracking spiritual growth — lives together in one coherent, personal, and beautiful experience.

The Word and the Way is built to be that place. It honors the rhythm of a daily devotional life: you open it, you record what God is saying, and over time it becomes a living record of your walk with Him.

### Core Principles

- **Personal first.** The app serves the user's spiritual life before it serves any audience.
- **Everything connected.** A reflection is linked to a verse, which is linked to a reading session, which is linked to a prayer — one devotional moment, fully captured.
- **Offline always.** The app works wherever God calls you — retreats, areas with no signal, quiet corners without Wi-Fi.
- **Zero friction.** Open it, record it, close it. No accounts to create, no subscriptions to manage, no loading screens to wait through.
- **Local-first.** Your spiritual journal belongs to you. Data lives on your device by default.

---

## 2. Target Users and Phased Rollout Plan

### Phased User Expansion

| Phase | Audience | Platform | Goal |
|---|---|---|---|
| Phase I (MVP) | Personal use only | Web app (laptop/desktop) | Replace manual tracking; establish daily habit |
| Phase II | Family and close friends | Web app (shared/invited) | Lightweight sharing of prayer lists and reflections |
| Phase III | Church community | Web + Mobile (iOS/Android) | Community devotional tracking, group reading plans |

### Phase I User: The Developer/Pastor

The primary user in Phase I is a pastor and developer who:
- Has an established daily devotional rhythm (prayer + Bible reading)
- Currently tracks progress mentally or in a notebook
- Is working through the New Testament at their own pace, currently in Hebrews
- Prays for a running list of people, intentions, and kingdom expansion themes
- Opens the app on their own terms — no reminders needed
- Is the developer building this app, so technical depth is appropriate

---

## 3. Core Features by Phase

### Phase I — MVP (Personal Web App)

The MVP is focused entirely on one user using this daily. Every feature below must work offline and feel warm and intentional.

#### 3.1 Daily Dashboard (Home Screen)

The heart of the app. On opening, the user sees a personalized greeting and a summary of their spiritual activity for the day.

**Dashboard layout concept:**

```
Good Evening, Pastor [Name]
Date: Sunday, 19 June 2026

Prayer             1 hr 15 min
Bible Reading      Hebrews 10–13
Listening          —
Reflection         Written
```

- Greeting adapts to time of day (Morning / Afternoon / Evening)
- Each block is a tap/click target to go to that section
- Incomplete sections display a soft prompt (e.g., "No reading logged yet today")
- Day resets at midnight; previous days are accessible in history

#### 3.2 Bible Reading Tracker

- **Log a reading session:** Select book, start chapter, end chapter; mark as complete
- **Track chapters per day:** Cumulative count visible on dashboard
- **Current position:** System remembers where the user left off (e.g., "You finished Hebrews 13 — what's next?")
- **Holy Spirit prompt feature (v1):** After completing a book or section, the app presents a soft reflection prompt: "Ask the Holy Spirit: what should I read next?" with a freeform input to record the answer and a manual selector to set the next reading
- **No fixed reading plan required:** The user reads at their own pace; the app follows them, not the other way around
- **Scripture to meditate on:** After logging a reading session, the app surfaces 1–3 suggested key verses from the chapters read (via local LLM or curated list); the user can select one or write their own

#### 3.3 Prayer Tracker

Two modes, both active simultaneously:

**Running Prayer List (Intercessory)**
- Add people, groups, or intentions as prayer items
- Each item has: name/label, category (personal, family, church, kingdom), notes, date added
- Mark prayer items as "answered" with an optional note and date
- Answered prayers are archived and reviewable (a record of God's faithfulness)

**Daily Prayer Log (Time + Content)**
- Log each day: time spent in prayer (manual entry, e.g., "1 hr 15 min")
- Optional: freeform notes on what was prayed (themes, specific petitions, what was heard)
- Links to the running prayer list (e.g., "Prayed for [Person X] today")

#### 3.4 Reflection Journal

- **Free writing mode:** Open text editor for personal journaling
- **Guided prompts mode:** A set of structured prompts per reading session:
  - What stood out to me?
  - What is God saying to me through this?
  - What will I do differently?
  - What do I want to remember?
- User can switch between free writing and prompted mode per entry
- **Scripture linking:** Each journal entry can be linked to one or more specific Bible verses
- **Session linking:** Each entry is automatically associated with the day's reading session and prayer log

#### 3.5 Favorite Verse Capture

- After a reading session, the user can mark a verse as a "favorite" or "verse to meditate on"
- Favorites are stored in a searchable personal library
- Each saved verse displays: reference, text (user-entered or from a Bible API if online), date saved, linked reflection

#### 3.6 Standard / Recurring Prayers

- A dedicated section for recurring prayer categories: church, pastors, kingdom expansion, missions, etc.
- Content is seeded from the user's existing images and text files (imported at setup)
- Managed locally; user can edit, add to, or reorganize categories
- In a later iteration: local LLM assistance to help compose or expand prayer content

#### 3.7 Unified Devotional Record

Every day's activity — reading session, prayer log, reflection, favorite verse — is stored as a single linked "devotional record" for that date. The user can open any past day and see the complete picture of what happened in that devotional moment.

---

### Phase II — Family and Friends (Future)

- Invite system (link-based or email)
- Shared prayer lists (opt-in)
- Reading plan sharing ("We're all reading through Matthew together")
- Basic privacy controls (what to share vs. keep private)

### Phase III — Church Community (Future)

- Mobile apps (React Native or PWA with full offline)
- Community reading plans with progress tracking
- Group prayer walls
- Pastor-to-congregation devotional broadcasts
- Role-based access (pastor, deacon, member)

---

## 4. Daily Dashboard Concept (Detailed)

The dashboard is the first thing the user sees every time they open the app. It answers one question: "How has today's time with God gone?"

### Layout Specification

```
┌─────────────────────────────────────────────────┐
│  Good Evening, Pastor                           │
│  Sunday, 19 June 2026                           │
├─────────────────────────────────────────────────┤
│  PRAYER                          1 hr 15 min    │
│  Prayed for: John, Church Board, Missions       │
├─────────────────────────────────────────────────┤
│  BIBLE READING                   Hebrews 10–13  │
│  4 chapters · Verse: Heb 10:23                  │
├─────────────────────────────────────────────────┤
│  LISTENING TO THE WORD           —              │
├─────────────────────────────────────────────────┤
│  REFLECTION                      Written        │
│  "He who promised is faithful..."               │
└─────────────────────────────────────────────────┘
```

### Dashboard Behaviors

- Each row is clickable — tapping "PRAYER" opens today's prayer log
- Incomplete rows show a subtle "+" or "Add" affordance
- The greeting adapts: Morning / Afternoon / Evening based on system time
- A soft color or icon distinguishes "logged" vs. "not yet logged" items
- The dashboard is read-only by default; edits happen inside each section

### Weekly / Monthly Streaks (optional, Phase I)

A small section at the bottom of the dashboard can show:
- "Streak: 7 days of reading"
- "This month: 18/30 days logged"

This is motivational, not prescriptive — it reflects faithfulness, not performance.

---

## 5. Tech Stack Recommendation

### Frontend

| Technology | Choice | Rationale |
|---|---|---|
| Framework | React 18+ with TypeScript | User-confirmed via shared component code |
| UI Components | shadcn/ui | User-confirmed; Radix UI primitives, highly accessible |
| Styling | Tailwind CSS | User-confirmed; utility-first, consistent design tokens |
| Routing | React Router v6 or TanStack Router | SPA routing, no server needed for Phase I |
| Icons | Lucide React | Ships with shadcn/ui ecosystem |
| Build Tool | Vite | Fast local dev, zero config, ideal for solo developer |

### Data Storage (Local-First Architecture)

Given: zero budget, offline requirement, personal use in Phase I.

**Recommended: SQLite via Origin Private File System (OPFS) + Drizzle ORM**

- `@sqlite.org/sqlite-wasm` — SQLite compiled to WebAssembly; runs entirely in the browser
- `Drizzle ORM` — TypeScript-native ORM with full SQLite support; type-safe queries
- Data lives in the browser's OPFS (persistent, sandboxed, no server needed)
- Full offline support with zero infrastructure cost
- Export to `.sqlite` file for backup

**Alternative if OPFS proves complex: PouchDB + IndexedDB**

- `PouchDB` — mature, well-tested browser-native database
- Syncs with CouchDB or Cloudant if cloud backup is added later
- Slightly simpler setup than WASM SQLite

**Future cloud sync (Phase II/III): Supabase Free Tier**

- PostgreSQL backend, Auth, Row-Level Security
- Free tier is generous for personal/small community use
- PouchDB → CouchDB sync or Drizzle migration path available

### AI / LLM Features (Local, Zero Cost)

For the "Holy Spirit prompt" feature and standard prayer management:

- **Ollama** (local LLM runner) + a small model (e.g., Llama 3.2 3B or Gemma 2B)
- Runs entirely on the user's machine; no API costs, no data leaves the device
- Used for: suggesting key verses, generating prayer content drafts, guided reflection prompts
- Integrated via a simple REST call to `localhost:11434`
- Gracefully degrades if Ollama is not running (features become manual)

### Development Environment

| Tool | Choice |
|---|---|
| Package Manager | pnpm (fast, efficient) |
| Language | TypeScript (strict mode) |
| Linting | ESLint + Prettier |
| Testing | Vitest + Testing Library |
| Version Control | Git (existing repo) |

### Deployment (Phase I)

- **Local only:** Run with `pnpm dev` or build with `pnpm build` and serve locally
- **Optional free hosting:** Vercel or Netlify free tier for web access from multiple devices
- No backend server required for Phase I

---

## 6. Design Principles

### Aesthetic

- **Warm and contemplative.** The app should feel like opening a leather-bound journal, not launching a productivity SaaS tool.
- **Clean and uncluttered.** Minimal chrome. Content — Scripture, prayers, reflections — is the focus.
- **Component-driven consistency.** shadcn/ui ensures accessible, cohesive UI without custom design system overhead.

### Color Palette Direction

- Warm neutrals as the base (cream, warm gray, soft white)
- Accent colors: deep teal or midnight blue (faithful, contemplative) or warm amber (light, warmth)
- Avoid cold blues, neon accents, or gamification-heavy visual cues

### Typography

- Readable serif font for Scripture and journal content (e.g., Lora, Playfair Display, or EB Garamond)
- Clean sans-serif for UI labels and navigation (e.g., Inter, already common in shadcn setups)

### Interaction Principles

- No popups. No modals for primary actions. Inline editing where possible.
- Every save is automatic — the user should never worry about losing a reflection mid-sentence.
- Dark mode supported from the start (shadcn/ui has native dark mode support via Tailwind)

---

## 7. Success Criteria for v1

Version 1 is complete when the user replaces their current manual tracking system (notebook/mental notes) with this app for their daily devotional practice.

### Functional Criteria

- [ ] User can open the app and see today's dashboard on first load
- [ ] User can log a Bible reading session (book, chapters, date)
- [ ] User can add and update prayer items (running list + daily log with time)
- [ ] User can write a journal reflection and link it to a Scripture passage
- [ ] User can save a favorite verse from a reading session
- [ ] All data persists between sessions (app close and reopen)
- [ ] App works fully offline (tested without network connection)
- [ ] Past devotional days are accessible and browsable

### Quality Criteria

- [ ] The dashboard feels personal and warm — not like a generic app
- [ ] Loading the app takes under 2 seconds on a standard laptop
- [ ] No data is ever lost due to accidental navigation or browser refresh
- [ ] The UI is responsive enough to use on a laptop browser at standard zoom

### Personal Adoption Criteria

- [ ] The user opens the app on at least 5 consecutive devotional days
- [ ] The user no longer needs a physical notebook or mental tracking for their devotional habit
- [ ] The user says: "This feels like mine."

---

## 8. Out of Scope for Phase I

The following are explicitly deferred to Phase II or Phase III, or are future considerations:

| Feature | Deferred To |
|---|---|
| Mobile app (iOS/Android) | Phase III |
| User accounts / authentication | Phase II |
| Multi-user sharing or collaboration | Phase II |
| Cloud sync / backup | Phase II (Supabase integration) |
| Push notifications / reminders | Not planned (user self-initiates) |
| Bible text API integration (full Bible in-app) | Phase II (online) |
| Community prayer wall | Phase III |
| Tags and categories for entries | Future consideration |
| Audio/video "Listening to the Word" logging | Post-MVP (field placeholder only) |
| Advanced LLM brainstorming features | Post-MVP |
| Import from existing notes/journals | Post-MVP |
| Streak gamification / badges | Optional Phase I enhancement |
| Recurring standard prayers (fully built out) | Scaffolded in Phase I, content added iteratively |

---

## 9. Open Questions and Assumptions

### Open Questions

1. **Standard prayer content:** User will share image files and text files containing their existing standard prayers (church, pastors, kingdom expansion). These will be imported during initial setup. Format TBD.
2. **Bible text source:** For verse display and suggestion features — will the user manually type verses, or should the app integrate a free Bible API (e.g., bible-api.com) when online? Recommend: manual entry in Phase I, API in Phase II.
3. **"Listening to the Word" field:** Placeholder on dashboard. User indicated this will be defined later. For Phase I, this field is present but accepts freeform text only.
4. **Local LLM availability:** Ollama-based features assume the user has Ollama installed and running. Should the app detect Ollama availability and gracefully disable AI features if not running?
5. **Name/title in greeting:** Dashboard says "Good Evening, Pastor [Name]." What name should be used? Recommend: a simple settings screen where the user sets their display name and title.

### Assumptions Made

- The user is the sole developer and will implement this themselves using the tech stack they confirmed.
- No external APIs requiring payment or accounts are used in Phase I.
- "New Testament, starting at Hebrews" is the current reading position, not a hard constraint on the reading tracker's data model — the tracker should support any book/chapter in the full Bible.
- The app is a Progressive Web App (PWA) target — no Electron or native wrapper needed for Phase I offline support via OPFS.
- Automatic saving (no explicit save button) is the preferred UX pattern.

---

## 10. Recommended Next Steps

With this project brief approved, the recommended BMAD workflow continues:

1. **Architecture Document** — Have the Architect agent define the full technical architecture: data models, component tree, offline storage schema, LLM integration pattern, and folder structure.
2. **Product Requirements Document (PRD)** — Have the PM agent expand Phase I features into detailed user stories and acceptance criteria.
3. **UI/UX Design Spec** — Define the dashboard layout, color tokens, typography scale, and component usage patterns using shadcn/ui.
4. **Story Map** — Break Phase I into a sequenced backlog of implementable stories, ordered by dependency and value.
5. **Build Kickoff** — Developer (the user) begins with the daily dashboard and core data model, validated against the first real devotional session.

---

*"Your word is a lamp to my feet and a light to my path." — Psalm 119:105*

*This brief was produced by the BMAD Business Analyst agent based on structured discovery with the project owner. It reflects the owner's stated intentions and inferred priorities. All phasing decisions, feature priorities, and technology choices are subject to revision by the project owner.*