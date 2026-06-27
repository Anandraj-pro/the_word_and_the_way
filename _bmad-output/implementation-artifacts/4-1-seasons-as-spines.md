---
baseline_commit: 05ebd7b65dd5579fed33a8f950162e83ac2603d5
---

# Story 4.1: Seasons as Spines — the Shelves as a Weighted Archive Index

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the Pastor standing before the Shelves,
I want my named seasons to stand as the spines of the Archive — each one carrying the weight of what it held, with the season I am living in marked as the lens the room currently looks through,
so that my past reads as a life told in seasons, not a list of dates, and I can feel which season holds what before I ever open one.

## Acceptance Criteria

1. **Given** the Shelves are shown, **when** they render, **then** there is one spine per season — name, state (open vs. its epitaph/“closed”), and `opening_scripture` when present — preserving the current spine look (`border-l-4` terracotta, `font-display` name). Ordering stays newest-first (`opened_on` desc), so the open season naturally sits at the top.
2. **Given** any spine, **then** it shows the **weight** of its season: the count of Encounters that season holds, in the room's voice (e.g. `7 words` / `1 word`). A season with zero Encounters reads gracefully (e.g. `no words yet`), never a bare `0` or a broken line.
3. **Given** the season that is currently open (the room's active lens), **then** its spine is visually marked as *current* — distinct from closed seasons (e.g. a stronger spine/marker or a “current” affordance) — so the Pastor can tell at a glance which season the room is looking through. Closed seasons remain visually quieter.
4. **No new table, no migration.** The weight in AC2 comes from a new **computed** `encounter_count` on `SeasonRead`, derived from the existing `Season ↔ Encounter` relationship. `GET /api/seasons` returns `encounter_count` for every season. No column is added to any table (so the `create_all`-won't-ALTER gotcha does not apply).
5. **Scope boundary — index only.** Spines are an index in this story. Clicking a spine does **not** open the season's Encounters or navigate anywhere — that is story **4-2 (browse-encounters-by-season, US-28)**. Do not build a detail/browse view here. The spine may keep or drop its existing hover styling, but it must not gain real navigation behavior.
6. **No regression.** The crossing ritual (`SeasonRitual` on the Altar), the Desk's filtering to the open season, new-capture tagging with `season_id`, the cornerstone/carry flow, and the empty state (`No seasons named yet.`) all continue to work exactly as before.
7. **Build/quality.** Backend boots and `GET /api/seasons` includes `encounter_count`; `npm run build` (`tsc -b && vite build`) passes; Ember & Stone `@theme` tokens only; no `import React`; strict-TS clean; Python matches the surrounding style (type-annotated, sparse contemplative comments).

## Tasks / Subtasks

- [x] **Task 1 — Expose each season's weight from the backend** (AC: 2, 4)
  - [x] Added `@property encounter_count(self) -> int` returning `len(self.encounters)` on the `Season` model. [backend/app/models.py#Season]
  - [x] Added `encounter_count: int` to `SeasonRead`; `from_attributes=True` picks up the property automatically. [backend/app/schemas.py#SeasonRead]
  - [x] Confirmed `GET /api/seasons` returns `encounter_count` per season — no router change needed. Verified live: Season of Rebuilding (open) = 5, Wilderness 2024 (closed) = 1.
  - [x] Kept the simple `len(self.encounters)` property (N+1 acceptable at personal scale); no stored column, so the `create_all`-won't-ALTER gotcha is sidestepped.
- [x] **Task 2 — Carry the weight into the frontend type** (AC: 2)
  - [x] Added `encounter_count: number;` to the `Season` interface. [frontend/src/api.ts#Season]
- [x] **Task 3 — Render spines as a weighted, marked index** (AC: 1, 2, 3)
  - [x] Added a quiet weight micro-line per spine via a `weight(n)` helper — `5 words` / `1 word` / `no words yet`. [frontend/src/components/Shelves.tsx]
  - [x] Marked the open season's spine as current: full `border-terracotta` + `bg-linen-deep` and an `open · this season` state line; closed spines quieter (`border-terracotta/40` + `bg-linen-deep/50`). [frontend/src/components/Shelves.tsx]
  - [x] Preserved structure: `Station` wrapper, `empty`/`emptyWord`, newest-first order, name + state + `opening_scripture`.
- [x] **Task 4 — Hold the 4-2 boundary** (AC: 5)
  - [x] Changed the spine from a `<button>` (dead `onClick`-less click target with hover affordance) to a non-interactive `<div>`; removed `hover:`/`transition`/`group`. Reads as an index entry. Browse-into left for 4-2.
- [x] **Task 5 — Verify** (AC: 6, 7)
  - [x] Backend booted; `curl /api/seasons` returns `encounter_count` for every season (5 and 1).
  - [x] `npm run build` passes clean (45 modules, strict-TS, no unused, no `import React`).
  - [x] No-regression confirmed by inspection: ritual (`SeasonRitual`/`onBeginRitual`), Desk open-season filtering, capture `season_id` tagging, and the `No seasons named yet.` empty state are all untouched; the `Season` type change is additive and seasons are only ever sourced from `api.seasons()` (no literal construction — clean strict-TS build proves it).

### Review Findings

_Code review 2026-06-26 (scope: 4 files, baseline 05ebd7b → working tree). 3 layers — Blind Hunter, Edge Case Hunter, Acceptance Auditor (verdict: PASS on all 7 ACs)._

- [x] [Review][Decision] `encounter_count` uses `len(self.encounters)` → N+1 (one SELECT per season) and materializes every Encounter row just to count it, in `list_seasons` [backend/app/models.py:68; backend/app/routers/seasons.py:26]. Blind + Edge hunters both flagged it. The spec (Task 1) consciously accepted this "at personal scale" and offered `func.count`/`selectinload` "only if you prefer." Verified safe — no DetachedInstanceError (serialization runs inside the open session). **Resolved 2026-06-26 (option 1):** kept the spec-accepted simple property as-is — correct amount of code for a personal, offline, single-user app with a handful of seasons. `selectinload`/`func.count` remain trivial to add later if the season count ever grows materially.
- [x] [Review][Defer] No DB-level one-open-season invariant — two `closed_on IS NULL` rows would double-mark "open · this season" and make `Room`'s `seasons.find((s) => s.is_open)` pick an arbitrary row [frontend/src/components/Shelves.tsx:31; frontend/src/Room.tsx:110] — deferred, pre-existing. The single-open-season rule is enforced only at the `open`/`cross` routes (the `_open_season` 409 guard), not at the schema level; 4-1 only inherits that assumption and is not its cause.

## Dev Notes

### ⚠️ The season spine and lens already exist — DO NOT rebuild seasons
The `season_id`-as-organizing-lens mechanic and the season lifecycle are **already fully built** (freehand, ahead of this story — same pattern as 3-4). This story is a **thin, additive refinement**: surface each season's *weight* and mark the *current* season on the existing Shelves spines, plus one computed backend field. Do not re-create the model, the router, the ritual, or the lens wiring.

**Already built — leave intact:**
- **Backend.** `Season` model (name, opening_scripture, opening_declaration, epitaph, opened_on, closed_on, `is_open` property, `encounters` relationship); `Encounter.season_id` FK (indexed) — *"Season is the organizing lens. The date exists only for On This Day."*; `routers/seasons.py` full lifecycle (`list`, `open`, `cross`, `{id}/close`) with carry-count + cornerstone-inscription logic; schemas `SeasonBase/Create/Read/Cross`, `CrossResult`. [Source: backend/app/models.py#Season,#Encounter; backend/app/routers/seasons.py; backend/app/schemas.py#L10-32,#L207-212]
- **Lens, already applied room-wide.** `Room.tsx` computes `openSeason`/`openSeasonId`, routes the Desk to the open season's Encounters, and tags new captures with `season_id: openSeasonId`. [Source: frontend/src/Room.tsx#L110-111,#L135-145,#L170]
- **Spines already render.** `Shelves.tsx` maps `seasons` to spine buttons (name, `is_open ? "open" : epitaph ?? "closed"`, `opening_scripture`), with the `Station` empty state `No seasons named yet.` What it is missing is the **weight** and a **current-season marker** — that is this story. [Source: frontend/src/components/Shelves.tsx]
- **Crossing ritual.** Lives on the Altar via `SeasonRitual`; the Shelves' `onBeginRitual` trigger is optional and currently not passed. Don't move or duplicate it. [Source: frontend/src/Room.tsx#L262,#L278-281; frontend/src/components/SeasonRitual.tsx]

### The 4-1 / 4-2 boundary (read before you start)
- **4-1 (this story):** seasons as **spines** — the Archive *index*. Weight + current-season marker. Spines do not open.
- **4-2 (next, US-28):** **browse Encounters by season** — clicking a spine reveals that season's Encounters. The data path for it already exists: `GET /api/encounters?season_id=<id>` (the `season_id` query param is already built in `api.ts` `encounters({ season_id })`). Do **not** consume it here. [Source: frontend/src/api.ts#L175-178; docs/epic-room-reconciliation.md#L68]

### Where this lives — touch points
- `backend/app/models.py` (UPDATE — add `encounter_count` property to `Season`)
- `backend/app/schemas.py` (UPDATE — add `encounter_count: int` to `SeasonRead`)
- `frontend/src/api.ts` (UPDATE — add `encounter_count: number` to `Season`)
- `frontend/src/components/Shelves.tsx` (UPDATE — weight line + current-season marker)
- No new files, no new table, no router change beyond the schema field, no migration.

### Conventions (carried from 3-3 / 3-4)
- **Tailwind v4, CSS-first — no `tailwind.config.js`.** Use `@theme` tokens (`text-stone`, `text-ink`, `text-terracotta`, `font-display`, `font-serif`); match the existing spine styling. [Source: frontend/CLAUDE.md]
- **Strict TS** (`noUnusedLocals`/`noUnusedParameters`): build fails on unused vars; no `import React`. [Source: frontend/CLAUDE.md, tsconfig.json]
- **Voice:** sparse, contemplative comments; liturgical vocabulary (season, spine, weight, lens). The Shelves doc-comment already sets the register. [Source: frontend/CLAUDE.md, repo CLAUDE.md]
- **The Shelves is a lit linen surface** inside the dark room — keep spines as quiet furniture on one baseline, not loud cards. [Source: frontend/CLAUDE.md]
- **Backend migration gotcha — relevant if you stray.** `create_all` never ALTERs an existing table; a new *column* needs a hand migration in `main.py` lifespan (see `_migrate_reading_goal`). This story deliberately uses a **computed** field to avoid that entirely — keep it that way. [Source: backend/CLAUDE.md]

### Previous-story intelligence (3-4 Standard Recurring Prayers)
- Built freehand; the authoritative reference is the existing code — read `Shelves.tsx`, `models.py`, `schemas.py` fully before editing.
- **Build-as-verification pattern:** frontend has no test runner; the gate is `npm run build` passing + manual confirmation of ACs. Backend has no test suite wired either — verify via boot + a `curl` of the endpoint. [Source: 3-4-standard-recurring-prayers.md#Testing standards]
- **Code-review lesson (3-4):** when a refactor introduces a partition/derived value, keep derived predicates consistent and avoid silently dropping data. Here: make sure the weight reflects *all* a season's Encounters (don't filter by stage), so the count never undercounts what the season holds.

### Testing standards
No automated test framework (frontend or backend). Gates: backend boots and `GET /api/seasons` returns `encounter_count`; `npm run build` passes; manual glance per AC6/AC7.

### Project Structure Notes
- Single additive backend field (computed) + one frontend field + one component's presentation. No new modules, no new endpoints, no schema-breaking change (additive field only).
- Variance: none expected. If tempted to add click-to-open, **stop** — that is 4-2. If tempted to add a stored `encounter_count` column, **stop** — use the computed property.

### References
- [Source: docs/room-architecture.md#2 — "The Shelves | Archive | Past Encounters, **spines = named seasons**"; #4 build step 4 "seasons as spines; browse past Encounters by season"; "One calendar. Season is the organizing lens. Dates exist only for On This Day."]
- [Source: docs/epic-room-reconciliation.md#1 (R4 — The Shelves · Archive · seasons as spines); #2 US-28 → browse by **season**; #3 net-new "Seasons — season_id as the primary organizing lens; named seasons as Shelf spines"]
- [Source: _bmad-output/planning-artifacts/prd.md — US-28 (browse history, reframed to season)]
- [Source: backend/app/models.py#Season,#Encounter.season_id]
- [Source: backend/app/routers/seasons.py#list_seasons]
- [Source: backend/app/schemas.py#SeasonRead]
- [Source: frontend/src/api.ts#Season,#encounters(season_id)]
- [Source: frontend/src/components/Shelves.tsx]
- [Source: frontend/src/Room.tsx#L110-145,#L256-262]

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (BMAD dev-story workflow)

### Debug Log References

- Booted backend on :8011 (`.venv/bin/uvicorn app.main:app`); `curl /api/seasons` → both seeded seasons returned with `encounter_count` (5, 1). (AC2, AC4)
- `cd frontend && npm run build` → `tsc -b && vite build` passed clean: 45 modules, no type/unused-var errors. (AC7)

### Completion Notes List

- Story scoped (and confirmed) as the **weighted, marked index** refinement — the season spine + `season_id` lens were already built freehand; this story added only the missing *weight* and *current-season* signal plus one computed backend field. No rebuild of the season model, router, ritual, or lens.
- **Backend (additive, computed):** `Season.encounter_count` property (`len(self.encounters)`) + `SeasonRead.encounter_count: int`. No table/column/migration — deliberately computed to avoid the `create_all`-won't-ALTER gotcha. `GET /api/seasons` now carries the weight.
- **Frontend:** `Season.encounter_count: number` added to the type; `Shelves.tsx` renders a quiet weight micro-line (`weight()` helper: `5 words` / `1 word` / `no words yet`) and marks the open season's spine as current (fuller terracotta border + `bg-linen-deep` + `open · this season`); closed spines are quieter.
- **4-2 boundary held:** spine changed from a click-less `<button>` to a non-interactive `<div>`; no navigation/detail. Browsing into a season's Encounters is left for 4-2 (the `GET /api/encounters?season_id=` path already exists, intentionally not consumed here).
- **No regression:** ritual, Desk open-season filtering, capture `season_id` tagging, and the empty state are untouched; the type change is additive and seasons are only sourced from the API.

### File List

- `backend/app/models.py` (modified) — `Season.encounter_count` computed property.
- `backend/app/schemas.py` (modified) — `SeasonRead.encounter_count: int`.
- `frontend/src/api.ts` (modified) — `Season.encounter_count: number`.
- `frontend/src/components/Shelves.tsx` (modified) — weight micro-line + open-season "current" marking; spine is now a non-interactive index entry.

## Change Log

| Date       | Change                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| 2026-06-26 | Implemented 4-1: added computed `encounter_count` to Season/`SeasonRead` and the `Season` TS type; reworked `Shelves.tsx` spines into a weighted, current-season-marked Archive index; held the 4-2 browse boundary (spine no longer a dead button). Backend `curl` + `npm run build` verified; status → review. |
| 2026-06-26 | Code review (3-layer, verdict PASS on all 7 ACs): N+1 `encounter_count` finding resolved as decision — kept the spec-accepted simple property (option 1); one pre-existing item (no DB one-open-season invariant) deferred to `deferred-work.md`; 5 findings dismissed as noise. No code changes required; status → done. |
