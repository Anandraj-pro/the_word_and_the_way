---
baseline_commit: 3e995b70f5ea0dffa72b2fd85ed0141e4ac17e3d
---

# Story 4.4: On This Day — a Gentle Remembrance of Words Past

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the Pastor entering the room,
I want to be gently shown the words God gave me on this same calendar day in years past,
so that the room quietly reminds me of His faithfulness across the years — the one place a raw date earns its keep.

## Acceptance Criteria

1. **Given** the room loads, **when** `load()` runs, **then** it also fetches `api.onThisDay()` as a **non-critical** call — a failure must never block or close the room (mirror the `readingToday`/`prayerToday` `.then/.catch` pattern, not the critical `Promise.all`).
2. **Given** there is at least one remembered Encounter (the backend returns prior-year Encounters whose `received_on` month+day equals today), **then** a quiet remembrance element surfaces near the Altar (the home faced on entry). **Given** there are none, **then** nothing renders — no empty box, heading, or placeholder.
3. **Given** a remembered Encounter, **then** it shows: how long ago — "a year ago today" (1) / "N years ago today" (≥2) — its scripture reference, and a gentle single line of its verse text (or its `words` if there is no verse text). It is **read-only** — no carry/edit/delete controls.
4. **Given** multiple matches, **then** they render as a small, quiet list ordered most-recent-first (`received_on` descending) — a strip, not a stack of loud cards.
5. **Given** the remembrance, **then** it is the **only** place `received_on` drives presentation; the Shelves/seasons and their ordering are untouched (season remains the organizing lens).
6. **No backend or api change.** The `GET /api/encounters/on-this-day` endpoint and the `api.onThisDay()` wrapper already exist; no new endpoint, no new dependency.
7. **No regression.** Altar, Desk, Wall, Shelves (4-1/4-2/4-3), Window, and the crossing ritual all behave exactly as before; the new fetch + element are additive and isolated.
8. **Build/quality.** `npm run build` passes; Ember & Stone `@theme` tokens only; no `import React`; strict-TS clean.

## Tasks / Subtasks

- [x] **Task 1 — Fetch the remembrance in Room (non-critical)** (AC: 1, 6)
  - [x] Added `const [onThisDay, setOnThisDay] = useState<Encounter[]>([])`.
  - [x] `load()` now also calls `api.onThisDay().then(setOnThisDay).catch(() => setOnThisDay([]))` next to `readingToday`/`prayerToday` — outside the critical `Promise.all`, so a failure can't close the room.
- [x] **Task 2 — OnThisDay component (new)** (AC: 3, 4)
  - [x] Created `frontend/src/components/OnThisDay.tsx`. Props `{ remembered: Encounter[] }`.
  - [x] Sorts a copy most-recent-first (`received_on.localeCompare`, desc); years-ago from `Number(receivedOn.slice(0,4))` vs `new Date().getFullYear()` (tz-safe, year only).
  - [x] Each row: "a year ago today" / "N years ago today" + reference (`e.scripture`) + one gentle line (`scripture_text ?? words`, `truncate`), both guarded so a missing piece renders nothing. Read-only.
  - [x] Quiet centered strip on the dark room surface (`text-stone/60`, `text-linen`, `text-terracotta/70`), not boxed cards. Returns `null` when empty.
- [x] **Task 3 — Surface it near the Altar** (AC: 2, 5, 7)
  - [x] `Room.tsx` renders `{onThisDay.length > 0 && (<Reveal …><OnThisDay remembered={onThisDay} /></Reveal>)}` directly after the Altar `Reveal`, before the Desk/Wall grid — matching the Shelves/Window conditional-surface pattern. Altar props and season/Shelves ordering untouched.
- [x] **Task 4 — Verify** (AC: 7, 8)
  - [x] `npm run build` passes clean — 47 modules (+1 `OnThisDay`), strict-TS, no unused, no `import React`; `Reveal` accepts the no-`id` usage.
  - [x] Booted backend + `curl /api/encounters/on-this-day` → `200 []` today (no seeded June-29 prior-year match) — the expected empty path: the strip renders nothing and the room is unchanged. Populated path verified by reasoning against the data shape (sort desc → years-ago → render); no throwaway data committed (per the story's caveat). No regression to other stations.

### Review Findings

_Code review 2026-06-29 (scope: `OnThisDay.tsx` + the 4-4 `Room.tsx` hunks, baseline 3e995b7 → working tree). 3 layers — Blind Hunter, Edge Case Hunter, Acceptance Auditor (verdict: PASS on all 8 ACs)._

- [x] [Review][Patch] Content-less remembrance row [frontend/src/components/OnThisDay.tsx] — an Encounter with `scripture`, `scripture_text`, and `words` all null (a pure-prayer kept on this date in a prior year) renders only the "N years ago today" label with no body. Flagged by Blind + Edge (cosmetic/LOW). **Resolved 2026-06-29:** `remembered` is now filtered to items with at least one of scripture/scripture_text/words before sort/render; returns `null` if none remain. `npm run build` clean.
- [x] [Review][Patch] Redundant width wrappers [frontend/src/Room.tsx (OnThisDay `Reveal`); frontend/src/components/OnThisDay.tsx (root)] — the Room wraps `<OnThisDay>` in `Reveal className="… max-w-3xl"` while the component root is `max-w-2xl`; the inner constraint always wins, leaving the outer `max-w-3xl` dead/misleading. Blind (LOW). **Resolved 2026-06-29:** dropped `max-w-3xl` from the Room wrapper (`mx-auto w-full`); the component's `max-w-2xl` governs. `npm run build` clean.

## Dev Notes

### This is a surfacing-only story — the data path already exists
- **Backend, done:** `GET /api/encounters/on-this-day` returns Encounters whose `received_on` month+day equals today, from **prior years** (it filters `received_on < today - 1 day` then matches month/day, so a same-year/today match is impossible → "years ago" is always ≥ 1). It returns `EncounterRead[]` and does **not** order them. [Source: backend/app/routers/encounters.py#on_this_day]
- **API wrapper, done:** `api.onThisDay()` already exists and is currently **unused** anywhere in the frontend — this story is its first consumer. [Source: frontend/src/api.ts#onThisDay]
- **Architecture mandate:** `received_on` is "surfaced for On This Day, never used to sort the archive"; "Dates exist only for On This Day." This story is the single sanctioned place a raw date drives the UI — keep it out of the Shelves/season ordering. [Source: docs/room-architecture.md#L41,#L98; docs/epic-room-reconciliation.md#L68]

### Current state of files you'll touch
- **`frontend/src/Room.tsx`** (UPDATE). `load()` (L53-72) fetches the critical four via `Promise.all` and two non-critical extras (`readingToday`, `prayerToday`) via `.then/.catch`. Add `onThisDay` the same non-critical way + a state field. Render a new conditional sibling right after the Altar `Reveal` (L222-234), matching the Shelves (`seasons.length > 0`) / Window (`testimonies.length > 0`) surface pattern. Touch nothing else.
- **`frontend/src/components/OnThisDay.tsx`** (NEW). The remembrance strip.
- No `api.ts` change, no backend change, no new `@theme` token.

### Reuse / consistency
- You **may** reuse `EncounterCard` (read-only, omit `onCarry`) for each remembered item if it reads well, but a **compact custom row** is preferred here — the distinctive element is the "N years ago today" label, and the remembrance should stay a slim, quiet strip rather than a stack of full cards. Either way, do not add carry/edit/delete affordances. [Source: frontend/src/components/EncounterCard.tsx]
- For the "years ago" math and a date helper, the `keptOn`-style by-parts parsing in `VerseLibrary.tsx` is a good reference (avoid `new Date("YYYY-MM-DD")` tz drift — use the year substring). [Source: frontend/src/components/VerseLibrary.tsx#keptOn]

### Conventions (carried from 4-1 / 4-2 / 4-3)
- **Tailwind v4, CSS-first — no config.** `@theme` tokens only (`text-stone`, `text-ink`, `text-terracotta`, `font-display`, `font-serif`); the room is dark (`bg-ink`) so the strip should read as quiet light on dark, consistent with other top-level room text. [Source: frontend/CLAUDE.md]
- **Strict TS** (`noUnusedLocals`/`noUnusedParameters`): no unused vars, no `import React`. [Source: frontend/CLAUDE.md, tsconfig.json]
- **Voice:** sparse, contemplative comments; liturgical vocabulary (remembrance, on this day, He said). [Source: frontend/CLAUDE.md]
- Hand-authored components live in `src/components/`. [Source: frontend/CLAUDE.md]

### Testing standards
No automated test framework. Gate: `npm run build` passes + manual confirmation. **Honest caveat:** "On This Day" only renders when seeded/real data has a `received_on` matching today's month+day in a prior year, so the *populated* path usually can't be seen on an arbitrary day. Verify: (a) the empty path renders nothing and the room is unchanged; (b) the populated path by reasoning against the data shape, optionally by temporarily inserting an Encounter dated to this month/day last year (e.g. via the API/`keepVerse` then editing `received_on`, or a throwaway DB row) — do not leave test data committed. [Source: 4-3/4-2 build-as-verification pattern]

### Previous-story intelligence (4-1 / 4-2 / 4-3)
- The room surfaces stations/elements conditionally on data presence (Shelves on seasons, Window on testimonies) — follow that exact pattern so an empty result is simply absent.
- Non-critical fetches use `.then/.catch` and never enter the critical `Promise.all` (so the room still opens if they fail) — `onThisDay` is non-critical.
- **4-3 review lesson:** keep derived presentation honest about its data — here, the only subtlety is sorting (the endpoint is unordered, so sort in the component) and the tz-safe year parse. No delete/mutation in this story, so no refresh-consistency concern.

### Project Structure Notes
- New: `frontend/src/components/OnThisDay.tsx`. Update: `frontend/src/Room.tsx` (fetch + state + one conditional render). No backend, no api.ts, no new token.
- Variance: none. Keep it ambient — it is **not** one of the five stations (no `Station` wrapper, no `#station-*` anchor); it's a gentle remembrance, so a plain conditional `Reveal` strip is right.
- This is the **last R4 story**; once it passes review, epic-4 (the Shelves/Archive) is complete.

### References
- [Source: docs/room-architecture.md#L41,#L98 — `received_on` surfaced only for "On This Day"; "Dates exist only for On This Day"]
- [Source: docs/epic-room-reconciliation.md#L68,#L99 — date demoted to "On This Day" only]
- [Source: backend/app/routers/encounters.py#on_this_day — the endpoint (prior-year month/day matches, unordered)]
- [Source: frontend/src/api.ts#onThisDay — existing wrapper, currently unused]
- [Source: frontend/src/Room.tsx#L53-72 (load pattern), #L222-276 (conditional surface pattern)]
- [Source: frontend/src/components/EncounterCard.tsx — optional read-only reuse]
- [Source: frontend/src/components/VerseLibrary.tsx#keptOn — tz-safe date parsing reference]

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (BMAD dev-story workflow)

### Debug Log References

- `cd frontend && npm run build` → `tsc -b && vite build` passed clean: 47 modules (+1 `OnThisDay`), no type/unused-var errors. (AC8)
- Booted backend on :8012; `curl /api/encounters/on-this-day` → `200 []` for today (06-29) — endpoint healthy, empty path confirmed. (AC1, AC2)

### Completion Notes List

- Surfacing-only story: wired the already-existing `api.onThisDay()` (its first consumer) into `Room` as a **non-critical** fetch (`.then/.catch`, never the critical `Promise.all`), so a failure can't close the room.
- New `OnThisDay.tsx` renders a quiet, centered remembrance strip — per item: "a year ago today" / "N years ago today", the scripture reference, and one gentle truncated line (`scripture_text ?? words`). Read-only; sorts most-recent-first (the endpoint is unordered); tz-safe year math; returns `null` when empty.
- Surfaced as a conditional sibling directly after the Altar `Reveal` (`onThisDay.length > 0`), matching the Shelves/Window "surface only when present" pattern. `received_on` drives only this strip — the seasons/Shelves ordering is untouched (AC5).
- No backend, `api.ts`, or new-token change; the `/on-this-day` endpoint and `onThisDay` wrapper pre-existed.
- **Verification honesty:** the empty path (the common case) is confirmed end-to-end (endpoint `[]` → nothing renders, room unchanged); the populated path is verified by reasoning against the data shape, with no throwaway data committed.

### File List

- `frontend/src/components/OnThisDay.tsx` (new) — the "On This Day" remembrance strip.
- `frontend/src/Room.tsx` (modified) — `onThisDay` state + non-critical fetch in `load()`; conditional render after the Altar; `OnThisDay` import. (Review patch: dropped redundant `max-w-3xl` from the wrapper.)

## Change Log

| Date       | Change                                                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| 2026-06-29 | Implemented 4-4: surfaced "On This Day" — a gentle remembrance of words received on this calendar day in years past. New `OnThisDay.tsx` strip fed by a non-critical `api.onThisDay()` fetch in `Room`, rendered conditionally after the Altar (the one sanctioned raw-date use). `npm run build` clean; endpoint `200 []` confirmed; status → review. |
| 2026-06-29 | Code review (3-layer, verdict PASS on all 8 ACs): applied 2 patches — filter out content-less remembrance rows, and drop a redundant width wrapper; ~7 findings dismissed (refuted/unreachable/intended). `npm run build` clean; status → done. |
