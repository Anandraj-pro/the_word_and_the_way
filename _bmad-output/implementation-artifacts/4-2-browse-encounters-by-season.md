---
baseline_commit: 05ebd7b65dd5579fed33a8f950162e83ac2603d5
---

# Story 4.2: Browse Encounters by Season — Opening a Spine in the Archive

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the Pastor standing before the Shelves,
I want to open a season's spine and read the words it held — the rhema, reflections, declarations, and promises gathered under that name —
so that my past is reachable as a lived season I can step back into, not a date I have to remember.

## Acceptance Criteria

1. **Given** the Shelves show their season spines (from 4-1), **when** they render, **then** each spine is an interactive, keyboard-accessible control (a real `<button>` with `aria-expanded`), and 4-1's presentation is preserved: the open season is still marked as current, the weight micro-line still shows, and order stays newest-first.
2. **Given** a spine, **when** the Pastor activates it (click or keyboard), **then** that season's Encounters are revealed beneath it — **all** of them regardless of stage — rendered **read-only** via the existing `EncounterCard` (passed **no** `onCarry`, so no carry/edit/remove controls appear). Activating the same spine again collapses it.
3. **Given** one season is open, **when** the Pastor opens another, **then** the first collapses — at most one season is expanded at a time (accordion), keeping the Archive calm.
4. **Given** a season holding zero Encounters, **when** it is opened, **then** a gentle empty line is shown (e.g. `No words gathered here yet.`) in the room's quiet voice — never an empty void, spinner, or error.
5. **Data source — no new fetch.** The Encounters are the ones already loaded in `Room` (`api.encounters()` returns the full set, newest-first); pass them to `Shelves` and filter by `e.season_id === season.id` in-memory. Do **not** add a fetch/loading state. (`GET /api/encounters?season_id=` exists as an alternative but is **not** required and should not be used here.)
6. **The Archive is browsable as an archive.** The Shelves must be reachable to open spines even when no words are currently "on their way" — relax the current `deskActive.length > 0` mount gate so the Shelves renders whenever `seasons.length > 0`. Past/closed seasons can then be opened at any time. (See the Dev Notes "Open decision" — this is the one Room-choreography change; default is to relax the gate.)
7. **No regression.** 4-1's spine weight + current-season marking + newest-first order, the `No seasons named yet.` empty state, the crossing ritual (`SeasonRitual`), the Desk's open-season filtering, and capture `season_id` tagging all continue to work.
8. **Build/quality.** `npm run build` (`tsc -b && vite build`) passes; Ember & Stone `@theme` tokens only; no `import React`; strict-TS clean; **reuse `EncounterCard`** — do not author a new card component.

## Tasks / Subtasks

- [x] **Task 1 — Feed the Shelves and make the Archive reachable** (AC: 5, 6)
  - [x] `Room.tsx` now mounts `<Shelves seasons={seasons} encounters={encounters} />` — the full in-memory list, no new fetch. [frontend/src/Room.tsx]
  - [x] Relaxed the mount gate from `deskActive.length > 0` to `seasons.length > 0`; recast the lead-in from "Where these words are gathering" to "The seasons you have kept" to fit the now always-present Archive. `deskActive` is still used (it feeds `SeasonRitual candidates`), so no unused-var break. [frontend/src/Room.tsx]
- [x] **Task 2 — Interactive spines + read-only browse panel** (AC: 1, 2, 3, 4)
  - [x] Added `encounters: Encounter[]` to `ShelvesProps` (`import type { Encounter, Season } from "../api"`). [frontend/src/components/Shelves.tsx]
  - [x] Added `const [openId, setOpenId] = useState<number | null>(null)` (accordion); activating a spine toggles to its id or back to `null`, so opening one collapses any other. `useState` imported from `react` (no `import React`).
  - [x] Each spine is now a `<button>` with `onClick` + `aria-expanded`, preserving the 4-1 visuals (current-season border/`bg`, name, state line, weight micro-line); added a quiet rotating `›` chevron and a hover tint on closed spines. Keyboard-accessible — also closes the LOW a11y note from 4-1's review.
  - [x] When open, renders `encounters.filter((e) => e.season_id === s.id).map((e) => <EncounterCard key={e.id} e={e} />)` with **no `onCarry`** (read-only); empty seasons show `No words gathered here yet.`
  - [x] All inside the existing `Station` wrapper + scrollable `overflow-y-auto` column; the expanded panel scrolls within it.
- [x] **Task 3 — Verify** (AC: 7, 8)
  - [x] `npm run build` (`tsc -b && vite build`) passes clean — 45 modules, no type/unused-var errors, no `import React`.
  - [x] Confirmed by inspection: weight + open-season marking + newest-first order preserved; `No seasons named yet.` empty state intact; `SeasonRitual`/`onBeginRitual`, Desk open-season filtering, and capture `season_id` tagging untouched; `EncounterCard` reused (no new card); Shelves is mounted in exactly one place, so the new required `encounters` prop breaks no other caller (clean build proves it).

### Review Findings

_Code review 2026-06-27 (scope: `Shelves.tsx`, `Room.tsx`; baseline 05ebd7b → working tree). 3 layers — Blind Hunter, Edge Case Hunter, Acceptance Auditor (verdict: PASS on all 8 ACs)._

- [x] [Review][Patch] RoomTour drift: after relaxing the Shelves mount to `seasons.length > 0` (AC6), the tour still gated its Shelves step on `hasShelves={deskActive.length > 0}` [frontend/src/Room.tsx:~290] and described it in carry-context terms ("The words you are carrying gather here") [frontend/src/components/RoomTour.tsx:~62-63]. The tour skipped the Shelves step in the new archive-only case and its copy no longer matched the archive framing. Flagged independently by Edge Case Hunter + Acceptance Auditor. **Resolved 2026-06-27:** `hasShelves={seasons.length > 0}` now matches the Shelves mount; the tour step copy and the `hasShelves` doc-comment were softened to the archive framing ("Open a season's spine to read what it held…"). `npm run build` clean.

## Dev Notes

### What this story is — the spine finally opens
4-1 made the spines a weighted, current-marked **index** and deliberately left them non-interactive (`<button>`→`<div>`), noting *"reading into a season waits for the next story."* This **is** that story. 4-2 re-introduces interactivity — now with real behavior — and turns each spine into an accordion that reveals the season's words. Make the spine a real `<button>` with `aria-expanded` (this also closes the LOW a11y note raised in 4-1's review: a focusable control is now justified because it has an action).

### Reuse, don't rebuild
- **`EncounterCard` already renders one Encounter** (scripture / scripture_text / words; an optional carry control gated on an `onCarry` prop). For the Archive view, render it **without** `onCarry` → read-only, no carry pips/button. Do **not** write a new card. [Source: frontend/src/components/EncounterCard.tsx]
- **The data is already in memory.** `Room.load()` calls `api.encounters()` (no filter) → the backend `list_encounters` returns **every** Encounter, newest-first (`received_on desc`). `Room` holds this in `encounters`. Pass it down and filter by `season_id`; a per-season fetch is unnecessary and would add a loading state the room doesn't need. [Source: frontend/src/Room.tsx#L53-64; backend/app/routers/encounters.py#L15-26]
- **The filter param exists but is not for here.** `api.encounters({ season_id })` and the backend `season_id` query both work — they're the documented 4-1→4-2 seam — but with the full list already loaded, client-side filtering is simpler and offline-instant. [Source: frontend/src/api.ts#encounters]

### Current state of the files you'll touch
- **`frontend/src/components/Shelves.tsx`** (UPDATE). Currently: props `{ seasons, hasOpenSeason?, onBeginRitual? }`; maps seasons to non-interactive `<div>` spines with the 4-1 weight line + open-season marking; `Station` wrapper with `empty`/`emptyWord="No seasons named yet."`; an optional `onBeginRitual` button (not passed in the in-room mount). **Preserve** all of that; add the `encounters` prop, accordion state, the `<button>` spine, and the expanded read-only panel.
- **`frontend/src/Room.tsx`** (UPDATE, minimal). Currently mounts `<Shelves seasons={seasons} />` inside `{deskActive.length > 0 && ( … )}` under the heading "Where these words are gathering". Change to pass `encounters` and relax the gate to `seasons.length > 0`. Don't touch the `SeasonRitual` wiring, the Desk slice, or capture tagging. [Source: frontend/src/Room.tsx#L256-264]

### Open decision (the one judgment call — flagged, not blocking)
The Shelves today surfaces **only when `deskActive.length > 0`** ("where these words are gathering") — it is framed as the staging area for words being carried, not a standalone archive. US-28 ("browse history by season") needs the Archive reachable **anytime**. AC6 resolves this by relaxing the gate to `seasons.length > 0` (recommended — an archive you can't open is pointless). The alternative is to keep the gate and accept that the Archive is only visible while words are actively on their way. If the Pastor prefers to preserve the stricter "surfaces only in carry-context" choreography, this AC can be dropped and 4-2 ships browse-only within the existing gate. Default: **relax the gate.**

### Conventions (carried from 3-4 / 4-1)
- **Tailwind v4, CSS-first — no `tailwind.config.js`.** `@theme` tokens only (`text-stone`, `text-ink`, `text-terracotta`, `bg-linen-deep`, `font-display`, `font-serif`). Match the existing spine + `EncounterCard` styling; keep the expanded panel quiet (indented under the spine, not a loud nested card). [Source: frontend/CLAUDE.md]
- **Strict TS** (`noUnusedLocals`/`noUnusedParameters`): build fails on unused vars; no `import React` under the JSX transform. [Source: frontend/CLAUDE.md, tsconfig.json]
- **Voice:** sparse, contemplative comments; liturgical vocabulary (season, spine, words, gather). [Source: frontend/CLAUDE.md]
- **The room is dark; stations are lit linen surfaces.** The expanded list lives inside the Shelves' linen surface. [Source: frontend/CLAUDE.md]

### Previous-story intelligence (4-1 Seasons as Spines)
- 4-1 shipped the spine index; its review (PASS) **accepted the `encounter_count` N+1 at personal scale** and **deferred** the "no DB one-open-season invariant" item to `deferred-work.md` — neither affects 4-2; don't re-open them.
- **Build-as-verification pattern** (no test runner, frontend or backend): the gate is `npm run build` + a manual pass. [Source: 4-1-seasons-as-spines.md; 3-4 testing standards]
- 4-1 explicitly named this story as the consumer of the browse seam — implement it here and nowhere else.

### Testing standards
No automated test framework. Gate: `npm run build` passes + manual confirmation of AC1–AC8 via `npm run dev` (open/collapse seasons, empty season, no-seasons state, no regression to ritual/Desk).

### Project Structure Notes
- Touch points: `frontend/src/components/Shelves.tsx` (UPDATE — interactivity + browse panel) and `frontend/src/Room.tsx` (UPDATE — pass `encounters`, relax mount gate). No backend change, no `api.ts` change, no new component, no new `@theme` token.
- Variance: AC6 changes one Room mount condition (the flagged decision). Everything else is additive within `Shelves`. Resist building a season-detail route/page — the Archive opens **in place** (accordion), consistent with the one-room model (stations are furniture, not pages).

### References
- [Source: _bmad-output/planning-artifacts/prd.md — US-28 (browse history, reframed to season)]
- [Source: docs/epic-room-reconciliation.md#2 — US-28 → browse by **season**, date only for "On This Day"]
- [Source: docs/room-architecture.md#2,#4 — "The Shelves | Archive | Past Encounters, spines = named seasons"; build step 4 "browse past Encounters by season"]
- [Source: backend/app/routers/encounters.py#L15-26 — `list_encounters` with `season_id` filter; full list when unfiltered]
- [Source: frontend/src/api.ts#encounters,#Encounter — `season_id` on the Encounter type; the optional `season_id` query param]
- [Source: frontend/src/components/EncounterCard.tsx — read-only when `onCarry` omitted]
- [Source: frontend/src/components/Shelves.tsx — the 4-1 spine index to extend]
- [Source: frontend/src/Room.tsx#L53-64,#L256-264 — encounters load + Shelves mount/gate]
- [Source: 4-1-seasons-as-spines.md — the index this story opens]

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (BMAD dev-story workflow)

### Debug Log References

- `cd frontend && npm run build` → `tsc -b && vite build` passed clean: 45 modules, no type/unused-var errors. (AC8)

### Completion Notes List

- 4-2 opens the spine 4-1 deliberately left closed. `Shelves.tsx` became an accordion: each spine is a keyboard-accessible `<button aria-expanded>` that toggles a single `openId`; opening one collapses any other (AC1, AC3).
- The open season's words are revealed **in place** beneath its spine — `encounters.filter((e) => e.season_id === s.id)` rendered read-only via the existing `EncounterCard` (no `onCarry`, so no carry/edit/remove controls); empty seasons show `No words gathered here yet.` (AC2, AC4).
- **No new fetch / no new endpoint:** consumed `Room`'s already-loaded full `encounters` list (passed down) and filtered client-side; the `GET /api/encounters?season_id=` path was intentionally left unused per the story (AC5).
- **Archive made reachable:** relaxed the Shelves mount gate from `deskActive.length > 0` to `seasons.length > 0` (the flagged decision — default taken) and recast the heading to "The seasons you have kept" (AC6).
- **a11y:** the spine is a real button with `aria-expanded` now that it has an action — resolving the LOW a11y note carried from 4-1's review.
- **No regression:** 4-1's weight + current-season marking + newest-first order preserved; `No seasons named yet.` empty state intact; ritual, Desk filtering, and capture tagging untouched. No backend, `api.ts`, or new-component change.

### File List

- `frontend/src/components/Shelves.tsx` (modified) — accordion spines (`<button aria-expanded>`), in-place read-only `EncounterCard` panel per season, `encounters` prop; weight + open-season marking preserved.
- `frontend/src/Room.tsx` (modified) — pass `encounters` to `<Shelves>`; relax mount gate to `seasons.length > 0`; archive heading copy; align `RoomTour` `hasShelves` to `seasons.length > 0` (review patch).
- `frontend/src/components/RoomTour.tsx` (modified, review patch) — Shelves tour step copy + `hasShelves` doc-comment recast to the archive framing.

## Change Log

| Date       | Change                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| 2026-06-26 | Implemented 4-2: turned the Shelves spines into a keyboard-accessible accordion that opens a season's Encounters in place (read-only, reusing `EncounterCard`); fed by `Room`'s in-memory list filtered by `season_id` (no new fetch); relaxed the Shelves mount gate so the Archive is browsable anytime. `npm run build` clean; status → review. |
| 2026-06-27 | Code review (3-layer, verdict PASS on all 8 ACs): applied 1 patch — aligned `RoomTour` `hasShelves` to `seasons.length > 0` and recast the Shelves tour copy to the archive framing (the gate change had left the tour behind); 6 findings dismissed as noise/refuted. `npm run build` clean; status → done. |
