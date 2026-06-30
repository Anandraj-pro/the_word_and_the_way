---
baseline_commit: 3e995b70f5ea0dffa72b2fd85ed0141e4ac17e3d
---

# Story 4.3: Personal Verse Library — the Rhema Archive on the Shelves

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the Pastor at the Shelves,
I want every verse I have kept gathered into one personal library I can browse and return to — each showing its reference, the words it became, and when I kept it —
so that the rhema God has given me over time is one reachable archive, not scattered across seasons.

## Acceptance Criteria

1. **Given** the Shelves, **when** they render, **then** they offer two facets via a quiet segmented toggle at the top — **Seasons** (the existing spine accordion from 4-1/4-2) and **Kept verses** (the verse library) — defaulting to **Seasons**, so 4-1/4-2 behavior is unchanged until the Pastor switches.
2. **Given** the **Kept verses** facet, **then** it lists every **saved verse** — Encounters whose `scripture` is verse-level (contains `:`, e.g. `John 3:16`) — across all seasons, newest-first (by `received_on`), each row showing the **reference**, a **truncated** verse text, and the **date saved** (FR-VL-03, US-26).
3. **Given** a verse row, **when** the Pastor opens it, **then** the full context is shown: the full verse text, the linked reflection (the Encounter's `words`), and the date saved (FR-VL-04, US-26). Opening another collapses the first (accordion, consistent with 4-2).
4. **Given** an open verse, **then** a **delete** affordance is offered with an **inline two-step confirmation** (e.g. "Remove" → "Remove this verse? · confirm / cancel") — **not** a browser `confirm()` dialog. Confirming calls the delete endpoint and the room refreshes so the verse disappears and any affected season weight (4-1) updates (FR-VL-06).
5. **Given** no saved verses, **then** the Kept-verses facet shows a gentle empty line (e.g. `No verses kept yet.`), never an empty void or error.
6. **Data source — no new list endpoint.** The verses are derived from the Encounters already loaded in `Room` (`api.encounters()` → full set), filtered to verse-level `scripture`. Delete uses the **existing** `DELETE /api/encounters/{id}` via a **new** `api.deleteEncounter(id)` wrapper, then `Room` reloads (refreshing encounters **and** seasons so weights stay consistent).
7. **No regression.** The 4-1/4-2 Shelves (spines, weight, current-season marking, in-place browse), the `No seasons named yet.` empty state, the crossing ritual, the Desk's "keep a verse"/dwelling flow, and capture tagging all continue to work.
8. **Build/quality.** `npm run build` passes; Ember & Stone `@theme` tokens only; no `import React`; strict-TS clean; reuse `EncounterCard` for the verse body (read-only); routers stay thin (no backend change needed).

## Tasks / Subtasks

- [x] **Task 1 — Wire delete in the API layer** (AC: 6)
  - [x] Added `deleteEncounter: (id) => http<void>(\`/encounters/${id}\`, { method: "DELETE" })` to `api.ts` (mirrors the DELETE shape; `http` already returns `undefined` for 204). [frontend/src/api.ts]
- [x] **Task 2 — VerseLibrary component (new)** (AC: 2, 3, 4, 5)
  - [x] Created `frontend/src/components/VerseLibrary.tsx`. Props `{ verses: Encounter[]; onDelete }`.
  - [x] Newest-first preserved (no re-sort). Collapsed row: reference (`v.scripture`), **truncated** `v.scripture_text` (`truncate`), and date saved via a tz-safe `keptOn()` ("6 Jan 2026").
  - [x] Accordion (`openId`); opening reveals full context via `EncounterCard` (no `onCarry`) + a "Kept {date}" line.
  - [x] Delete: inline two-step confirm via `confirmingId` ("Remove this verse? · remove / cancel"), **not** `window.confirm`; confirm calls `onDelete(v.id)` and collapses.
  - [x] Empty: `verses.length === 0` → `No verses kept yet.`
- [x] **Task 3 — Add the Kept-verses facet to the Shelves** (AC: 1, 7)
  - [x] Added `view` state (`"seasons" | "verses"`, default `"seasons"`) + a quiet segmented toggle (Seasons | Kept verses) in the small-caps register.
  - [x] Derived `verses = encounters.filter((e) => (e.scripture ?? "").includes(":"))` (the backend's verse-level convention).
  - [x] `view === "seasons"` renders the unchanged spine accordion; `view === "verses"` renders `<VerseLibrary verses={verses} onDelete={onDeleteEncounter} />`. Subtitle recast "Seasons" → "Archive".
  - [x] Added `onDeleteEncounter` to `ShelvesProps`; `Station` wrapper + `empty`/`emptyWord` preserved (the no-verses empty state lives in VerseLibrary).
- [x] **Task 4 — Wire the delete handler in Room** (AC: 4, 6, 7)
  - [x] `Room.tsx` passes `onDeleteEncounter={async (id) => { await api.deleteEncounter(id); await load(); }}` — reusing `load()` so encounters **and** seasons refresh (4-1 weights stay correct). No other Room change.
- [x] **Task 5 — Verify** (AC: 7, 8)
  - [x] `npm run build` passes clean — 46 modules (+1 VerseLibrary), strict-TS, no unused, no `import React`.
  - [x] Confirmed by inspection: verses filtered + newest-first; reference/truncated-text/date; open → EncounterCard + date; inline delete-confirm → `onDelete` → `api.deleteEncounter` + `load()`; empty line; Seasons facet (4-1/4-2) unchanged; `Shelves` mounted only in Room so the new required prop breaks no caller; Desk keep-a-verse/dwelling untouched.

### Review Findings

_Code review 2026-06-29 (scope: 4 files, baseline 3e995b7 → working tree). 3 layers — Blind Hunter, Edge Case Hunter, Acceptance Auditor (verdict: PASS on all 8 ACs)._

- [x] [Review][Patch] Delete is fire-and-forget [frontend/src/components/VerseLibrary.tsx (remove button); frontend/src/Room.tsx (onDeleteEncounter)] — `onDelete(v.id)` is not awaited and the row collapses (`setOpenId(null)`) immediately; a rejected delete becomes an unhandled promise rejection with the UI already showing success, and double-clicking "remove" fires two DELETEs (the 2nd hits a now-missing id → 404). Flagged by Blind + Edge. **Resolved 2026-06-29:** the remove button now guards on a `removing` flag (disabled + "removing…" while pending), `await`s `onDelete` inside a `try/catch/finally`, and only collapses the row on success (on failure it keeps the verse and drops just the prompt). `onDelete`/`onDeleteEncounter` widened to `=> void | Promise<void>` so the await is honest; the caught rejection means no unhandled rejection. `npm run build` clean.
- [x] [Review][Patch] Verse filter too loose [frontend/src/components/Shelves.tsx:26] — `(e.scripture ?? "").includes(":")` matches a colon anywhere, so a free-form Desk scripture containing a stray `:` (a typed note/cross-ref) would surface in the Kept-verses facet and become deletable there. Edge confirmed no genuine kept verse is *excluded* (real verse refs are always `chapter:verse`; chapter-only reading refs have no colon) — only stray *inclusion*. **Resolved 2026-06-29:** filter now requires a `digit:digit` shape — `/\d+:\d+/.test(e.scripture ?? "")`. `npm run build` clean.

## Dev Notes

### What a "saved verse" already is — DO NOT invent a new model
A saved/favorite verse is **already** an Encounter whose `scripture` is verse-level (contains `:`). The "keep a verse" flow (US-24, shipped) creates exactly this: `POST /api/encounters/keep` → a `received` Encounter joined to the open season, with `scripture`, `scripture_text`, and optional `words` (the reflection). This story does **not** add a `SavedVerse` table — it presents the verses already on the Encounter spine. [Source: backend/app/routers/encounters.py#keep_verse, #dwelling, #kept_verses; backend/app/models.py#Encounter]

- **Fields map directly to US-26:** reference = `scripture`; verse text = `scripture_text`; linked reflection = `words`; date saved = `received_on` (all on `EncounterRead`/the `Encounter` TS type). [Source: backend/app/schemas.py#EncounterRead#L74-83; frontend/src/api.ts#Encounter#L13-25]
- **Verse-level detection convention:** `scripture` containing `:` is a verse (`John 3:16`); a chapter ref (`John 3`) has none. The backend already uses this in `/dwelling` (`scripture.like("%:%")`) and `kept_verses`. Reuse the same rule client-side. [Source: backend/app/routers/encounters.py#dwelling#L96-107]
- **The "Dwelling on" strip at the Desk is a *subset*, not the library.** `/dwelling` returns only verse-level, `received`/`reflecting`, `carry_count < 3` Encounters (what's actively meditated). The library (this story) is the **full** archive of kept verses across all stages/seasons — so derive it from the full `encounters` list, not `/dwelling`. [Source: backend/app/routers/encounters.py#dwelling]

### Reuse, don't rebuild
- **`EncounterCard`** already renders scripture / scripture_text / words read-only when `onCarry` is omitted — use it for the expanded verse body (as 4-2 did for the season browse). Add only the date-saved line and the delete control around it; don't duplicate the verse markup. [Source: frontend/src/components/EncounterCard.tsx]
- **Delete is already on the backend** (`DELETE /api/encounters/{id}` → 204). Only the `api.ts` wrapper is missing; mirror `removePrayerFocus`. [Source: backend/app/routers/encounters.py#L160-166; frontend/src/api.ts#removePrayerFocus]
- **`Room` already loads the full encounter list** and passes it to the Shelves (4-2). Filter it for verses; do not fetch. [Source: frontend/src/Room.tsx#L53-64, #L262]

### Confirmation must be inline — never `window.confirm`
FR-VL-06 needs a confirmation step. Use an **inline two-step** control (local `confirmingId` state), NOT `window.confirm`/`alert` — browser modal dialogs block the app (and the harness). This matches the room's calm, in-place interaction model. [Source: repo browser/dialog guidance; one-room model]

### Current state of files you'll touch
- **`frontend/src/components/Shelves.tsx`** (UPDATE). Today: `{ seasons, encounters, hasOpenSeason?, onBeginRitual? }`; renders the season-spine accordion (4-1 weight + current marking, 4-2 in-place `EncounterCard` browse) inside a `Station`. Add: `view` toggle state, the verse derivation, the `onDeleteEncounter` prop, and the `VerseLibrary` render for the verses facet. **Preserve** the seasons facet exactly.
- **`frontend/src/Room.tsx`** (UPDATE, minimal). Today mounts `<Shelves seasons={seasons} encounters={encounters} />` gated on `seasons.length > 0`. Add the `onDeleteEncounter` handler that calls `api.deleteEncounter` then `load()`. Touch nothing else.
- **`frontend/src/api.ts`** (UPDATE). Add `deleteEncounter`.
- **`frontend/src/components/VerseLibrary.tsx`** (NEW). The library list + per-verse detail + inline delete-confirm.

### Open decisions (flagged, not blocking — defaults chosen)
1. **Placement:** a segmented **Seasons | Kept verses** toggle on the Shelves (recommended — the Shelves is the Archive with two facets, per room-architecture "Named Seasons" + "Rhema Archive"). Alternative: append a second "Kept verses" section below the spines (busier). Default: **toggle**.
2. **Scope:** this story delivers **browse + detail + delete**. Deferred (call out for a future story, not built here): **edit** of verse text/reflection (FR-VL-05 — no Encounter-edit UI exists yet; the PATCH endpoint does), **search** (US-25 — FR-VL-03 only requires a sorted list), **editable date saved** (FR-VL-01), and **standalone add from the library** (FR-VL-02 — verses are kept from the Desk/reading today). Confirm this scope or widen it.

### Conventions (carried from 4-1 / 4-2)
- **Tailwind v4, CSS-first — no config.** `@theme` tokens only (`text-stone`, `text-ink`, `text-terracotta`, `bg-linen-deep`, `font-display`, `font-serif`); use `truncate`/`line-clamp-1` for the truncated text. Match the existing small-caps header style for the toggle. [Source: frontend/CLAUDE.md]
- **Strict TS** (`noUnusedLocals`/`noUnusedParameters`): no unused vars, no `import React`. [Source: frontend/CLAUDE.md, tsconfig.json]
- **Voice:** sparse contemplative comments; liturgical vocabulary (kept verse, rhema, gathered). [Source: frontend/CLAUDE.md]
- Hand-authored station components live in `src/components/` — `VerseLibrary.tsx` belongs there. [Source: frontend/CLAUDE.md]

### Previous-story intelligence (4-2 / 4-1)
- 4-2 established the accordion + read-only `EncounterCard` (no `onCarry`) + filter-Room's-in-memory-list pattern — follow it for the verse facet.
- **4-2 review lesson:** when a change alters what's shown, keep derived/dependent state consistent. Here: deleting a verse changes a season's `encounter_count` (the 4-1 spine weight) and the 4-2 browse list — so the delete handler must `load()` (refresh encounters **and** seasons), not just drop the row locally.
- **Build-as-verification** (no test runner): gate is `npm run build` + manual pass. [Source: 4-2/4-1 testing standards]

### Testing standards
No automated test framework. Gate: `npm run build` passes + manual confirmation of AC1–AC8 via `npm run dev` (toggle, list, open, delete-with-confirm, empty, no-regression to seasons/Desk).

### Project Structure Notes
- New: `frontend/src/components/VerseLibrary.tsx`. Updates: `Shelves.tsx`, `Room.tsx`, `api.ts`. No backend change (delete endpoint exists), no new table, no migration.
- Variance: introduces a view toggle on the Shelves (the flagged placement decision). Keep the Archive in-place — no routed page (one-room model).

### References
- [Source: _bmad-output/planning-artifacts/prd.md#5.5 — FR-VL-01..06; US-24/25/26]
- [Source: docs/epic-room-reconciliation.md#2 — US-25 → R4 Shelves (personal library), US-26 → R1/R4 (verse detail)]
- [Source: docs/room-architecture.md#2 — Shelves content: "Rhema Archive, Season Wall, Named Seasons"]
- [Source: backend/app/routers/encounters.py — keep_verse, dwelling, kept_verses, delete_encounter]
- [Source: backend/app/models.py#Encounter — scripture/scripture_text/words/received_on]
- [Source: backend/app/schemas.py#EncounterRead — exposed fields incl. received_on]
- [Source: frontend/src/api.ts#Encounter, #removePrayerFocus — type + DELETE wrapper to mirror]
- [Source: frontend/src/components/EncounterCard.tsx — read-only verse body]
- [Source: frontend/src/components/Shelves.tsx — the Archive to extend with a second facet]
- [Source: frontend/src/Room.tsx#L53-64,#L262 — encounter load + Shelves mount]
- [Source: 4-2-browse-encounters-by-season.md — accordion + reuse patterns]

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (BMAD dev-story workflow)

### Debug Log References

- `cd frontend && npm run build` → `tsc -b && vite build` passed clean: 46 modules (+1 `VerseLibrary`), no type/unused-var errors. (AC8)

### Completion Notes List

- Delivered the Rhema Archive as the Shelves' second facet (toggle default = Seasons), per the chosen scope (browse + detail + delete). No new table — saved verses are the verse-level Encounters already on the spine.
- **VerseLibrary (new):** lists verse-level Encounters newest-first (reference + truncated text + tz-safe date); opens in place to the full context via `EncounterCard` (read-only) + a "Kept {date}" line; deletes with an **inline two-step confirm** (no `window.confirm`).
- **Shelves:** added the Seasons | Kept verses toggle and the `verses` derivation (`scripture` contains `:`); the seasons facet (4-1 weight/marking, 4-2 in-place browse) is untouched. Subtitle recast to "Archive".
- **Delete path:** new `api.deleteEncounter` (uses the existing `DELETE /api/encounters/{id}`, 204-safe) wired through `Room` → `api.deleteEncounter` then `load()`, so a deletion refreshes encounters **and** seasons and the 4-1 spine weight stays correct (the lesson carried from 4-2's review).
- **Deferred per the story (not built):** edit (FR-VL-05), search (US-25), editable date (FR-VL-01), standalone-add-from-library (FR-VL-02).
- **No regression:** seasons facet, crossing ritual, Desk keep-a-verse/dwelling, and the empty states all intact. No backend change.

### File List

- `frontend/src/components/VerseLibrary.tsx` (new) — the Rhema Archive: verse list, in-place detail via `EncounterCard`, inline delete-confirm.
- `frontend/src/components/Shelves.tsx` (modified) — Seasons | Kept verses toggle; `verses` derivation; `onDeleteEncounter` prop; subtitle "Archive". Seasons facet unchanged.
- `frontend/src/Room.tsx` (modified) — pass `onDeleteEncounter` (delete then `load()`).
- `frontend/src/api.ts` (modified) — `deleteEncounter(id)` wrapper.

(Review patches 2026-06-29: `Shelves.tsx` verse filter tightened to `/\d+:\d+/` + `onDeleteEncounter` type widened; `VerseLibrary.tsx` remove button hardened with a `removing` guard + `await`/`try-catch`.)

## Change Log

| Date       | Change                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| 2026-06-29 | Implemented 4-3: added the Rhema Archive (personal verse library) as the Shelves' second facet via a Seasons \| Kept verses toggle — verse-level Encounters listed newest-first (reference + truncated text + date), opening in place to full context (reusing `EncounterCard`), with inline-confirm delete wired through a new `api.deleteEncounter` + `Room.load()`. `npm run build` clean; status → review. |
| 2026-06-29 | Code review (3-layer, verdict PASS on all 8 ACs): applied 2 patches — hardened the verse delete (busy-guard + await + try/catch, no fire-and-forget) and tightened the verse filter to `/\d+:\d+/`; ~6 findings dismissed as verified-handled. `npm run build` clean; status → done. |
