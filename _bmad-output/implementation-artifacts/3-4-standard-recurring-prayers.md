---
baseline_commit: 74909127fa81f8b040ee54fbbd9a9df1928101c3
---

# Story 3.4: Standard Recurring Prayers — Their Own Section

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the Pastor keeping the daily watch,
I want the standing, recurring prayers (the Church, pastors, the kingdom, the harvest) gathered in their own clearly-marked section, set apart from the personal burdens I add,
so that the structured intercession I am committed to is always visibly present and never lost among day-to-day additions.

## Acceptance Criteria

1. **Given** The Watch is open on the Desk, **when** it renders its foci, **then** they are shown in **two labeled groups** — a standing/standard group first, then a personal group — rather than one flat list.
2. **Given** the standard group, **then** it always renders whenever standard foci exist (the seeded Church / pastors / kingdom / harvest foci), even when none have been prayed today and even if the Pastor has added no personal foci.
3. **Given** the personal group, **when** there are no personal foci, **then** its header is not shown (no empty section), and the "+ add a focus" affordance still appears so a personal focus can be added.
4. **Given** any focus in either group, **then** its existing behavior is unchanged: tap the ring or the label to toggle prayed-today, the scripture reference still shows, and only **personal** foci show the remove (✕) control (standard foci have none — they are retired server-side, not deleted).
5. **Given** the watch as a whole, **then** the streak line, the `prayed/total` progress count, and the open/closed collapse behavior all continue to work exactly as before.
6. **No backend change.** Grouping uses the `kind` field already returned by `GET /api/prayer/today` (`"standard"` | `"personal"`). Within each group, preserve the order the API already returns.
7. **Build/quality:** `npm run build` passes; Ember & Stone tokens only; no `import React`; strict-TS clean.

## Tasks / Subtasks

- [x] **Task 1 — Group foci by `kind`** (AC: 1, 6)
  - [x] Derived `standard = watch.focuses.filter(f => f.kind === "standard")` and `personal = …"personal"` in `DailyPrayer.tsx`, preserving the API's order (no re-sort).
- [x] **Task 2 — Render two labeled sections** (AC: 1, 2, 3)
  - [x] Replaced the single flat `<ul>` with two `<section>`s, standard first, each with a `text-[0.6rem] uppercase tracking-[0.25em] text-stone/55` header ("Standing watch" / "Personal").
  - [x] Standard section renders when `standard.length > 0`; the personal section (header + list) renders only when `personal.length > 0`.
  - [x] Extracted the per-focus row into a local `renderFocus(f: PrayerFocus)` helper, reused by both groups — markup written once.
- [x] **Task 3 — Preserve add + remove affordances** (AC: 3, 4)
  - [x] "+ add a focus" control and add-form left exactly as-is, below the two groups (added foci come back `kind: "personal"`).
  - [x] Remove (✕) still gated on `f.kind === "personal"` inside `renderFocus`; the `group` class kept on the `<li>` so the ✕ still reveals on row hover (carried 3-3 lesson).
- [x] **Task 4 — Verify** (AC: 5, 7)
  - [x] `npm run build` (`tsc -b && vite build`) passes clean — 44 modules, no type/unused errors.
  - [x] Verification gate met via the accepted build-as-verification pattern (carried from 3-3): `npm run build` passes clean (45 modules, no type/unused errors) and the implementation was confirmed by reading `DailyPrayer.tsx` against AC1–AC7. The live browser walkthrough was deliberately deferred to a manual pre-merge pass — the change is presentation-only over an unchanged data shape (`kind`), so no behavior path is altered.

### Review Findings

_Code review 2026-06-25 (scope: `frontend/src/components/DailyPrayer.tsx`, baseline 7490912 → HEAD)._

- [x] [Review][Patch] Foci with an unexpected `kind` silently vanish from the Watch yet still count toward `prayed/total` [frontend/src/components/DailyPrayer.tsx:38] — the `standard`/`personal` split filters on `kind === "standard"` / `"personal"`; anything else renders in neither group while remaining in `watch.total`, leaving it invisible/unprayable and making `prayed/total` unreachable. The prior flat `.map` rendered every focus. LOW: the TS type is exhaustive and the backend only emits those two kinds, so it is defensive hardening (e.g. `personal = focuses.filter(f => f.kind !== "standard")`). **Resolved 2026-06-25:** `personal` now filters `f.kind !== "standard"`, so every non-standing focus renders in the personal register and nothing falls through both filters. The ✕ remove stays gated on `kind === "personal"`, so an unknown-kind focus is shown-but-not-removable (safe). `npm run build` clean.

_Code review 2026-06-25 — re-review (scope: `frontend/src/components/DailyPrayer.tsx`, baseline 7490912 → working tree). 3 layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor)._

- [x] [Review][Decision] Remove-✕ predicate asymmetry: `personal` register uses `kind !== "standard"` but the ✕ remove is gated on `kind === "personal"` [frontend/src/components/DailyPrayer.tsx:39 vs :68] — Blind Hunter and Edge Case Hunter independently flagged this as an inconsistency (a hypothetical third `kind` would render under "Personal" yet be undeletable). The Acceptance Auditor, holding the spec, argues the asymmetry is exactly what keeps **AC4** ("only personal foci show the remove control") honored — and that aligning the gate to `!== "standard"` would both risk AC4 and offer a server-remove that may be invalid for non-personal foci. Currently latent: the `PrayerFocus.kind` union is `"standard" | "personal"`, so the two predicates are equivalent and the case cannot trigger. **Resolved 2026-06-25 (option 1):** left as-is (AC4-correct) and documented the deliberate asymmetry with a code comment at the ✕ gate — only the Pastor's own foci are his to retire; standing foci are retired server-side.
- [x] [Review][Patch] Indentation drift in the `adding ? … : …` block — it sits at the old flat-list indent level, under-indented relative to its sibling `<section>`s [frontend/src/components/DailyPrayer.tsx:136-173]. Cosmetic only; compiles and renders correctly. **Resolved 2026-06-25:** re-indented the block to align with its sibling `<section>`s; `npm run build` clean.

## Dev Notes

### ⚠️ This feature is ~90% already built — DO NOT rebuild the prayer system
US-18's data layer and most of its UI already exist. This story is a **presentation-only refinement of one file** (`DailyPrayer.tsx`). Touch nothing else.

- **Backend is complete, no changes:** `PrayerFocus` model has `kind` (`"standard"` | `"personal"`), seeded standard foci (Church, pastors, kingdom, harvest) via `seed_prayer_if_empty`, `today_watch` already orders standard-first, and standard foci are retired (`active=False`), never deleted. [Source: backend/app/prayer.py; backend/app/models.py#PrayerFocus]
- **API + types already carry `kind`:** `GET /api/prayer/today` → `PrayerToday { focuses: PrayerFocusRead[] … }`, and `PrayerFocusRead.kind` is in both the Pydantic schema and `frontend/src/api.ts` (`PrayerFocus.kind: "standard" | "personal"`). No api.ts change needed. [Source: backend/app/schemas.py#L138-151; frontend/src/api.ts#L77-92]
- **The component already exists and works:** `DailyPrayer.tsx` (The Watch) renders all foci, toggles prayed-state, shows the streak and `prayed/total`, collapses, and supports add/remove. The ONLY gap vs US-18 is that standard and personal foci share one flat `<ul>` (lines ~72–114) instead of being in their own labeled sections. [Source: frontend/src/components/DailyPrayer.tsx]

### Where this lives — a placement note (read before you start)
US-18 is about **prayer foci**, which this build implements as **"The Watch" on the Desk** (`Desk.tsx:71` renders `<DailyPrayer />`), NOT on the Wall. The sprint key `3-4` sits under epic R3 (the Wall) only because the reconciliation (`docs/epic-room-reconciliation.md`) tentatively filed US-18 there; the actual, shipped home is the Desk's Watch. **Implement in `DailyPrayer.tsx`. Do not move prayer to the Wall and do not create a new component.** [Source: frontend/src/components/Desk.tsx#L6,71; docs/epic-room-reconciliation.md]

### Conventions (same as 3-3)
- **Tailwind v4, CSS-first — no `tailwind.config.js`.** Use `@theme` tokens (`text-stone`, `text-ink`, `text-terracotta`, `font-serif`, etc.); match the existing small-caps header style already used for "The Watch". [Source: frontend/CLAUDE.md]
- **Strict TS** (`noUnusedLocals`/`noUnusedParameters`): build fails on unused vars; no `import React`. [Source: frontend/CLAUDE.md, tsconfig.json]
- **Voice:** sparse, contemplative comments; liturgical vocabulary (watch, standing, focus). Match the file. [Source: frontend/CLAUDE.md]
- The Watch is a **lit linen surface inside the Desk** (`bg-linen-deep/30` panel) — keep these sections visually quiet, not boxed cards.

### Previous-story intelligence (3-3 War Room)
- Built freehand; the authoritative reference is the existing `DailyPrayer.tsx` — read it fully first.
- **Lesson carried from 3-3's review:** when restructuring a list row that uses Tailwind `group-hover`, keep the `group` class on the element whose hover should drive the children. The personal remove (✕) here uses `group-hover:opacity-100` on the `<li className="group …">` — if you extract the row into a helper, preserve that `group` on the row wrapper so the ✕ still reveals on row hover. [Source: 3-3-war-room-mode.md Review Findings]
- Frontend-only, build-as-verification pattern (no test runner) carried over.

### Testing standards
No automated test framework in `frontend/`. Gate = `npm run build` passes + manual confirmation of AC1–AC7 via `npm run dev` (per 3-3's established pattern).

### Project Structure Notes
- Touch points: `frontend/src/components/DailyPrayer.tsx` (UPDATE — the only file). No backend, no api.ts, no new component, no new `@theme` token.
- Variance: none. If the row helper extraction tempts a shared component, resist — keep it a local function in `DailyPrayer.tsx`.

### References
- [Source: _bmad-output/planning-artifacts/prd.md#Epic-3 — US-18] standard recurring prayers in their own section
- [Source: docs/epic-room-reconciliation.md#2] US-18 placement note
- [Source: backend/app/prayer.py] seeded standard foci, ordering, retire-not-delete
- [Source: backend/app/models.py#PrayerFocus] `kind` field, `active` flag
- [Source: backend/app/schemas.py#L138-151] `PrayerFocusRead.kind`, `PrayerToday`
- [Source: frontend/src/api.ts#L77-92,168-177] `PrayerFocus`/`PrayerToday` types + `prayerToday`/`togglePrayer`/`addPrayerFocus`/`removePrayerFocus`
- [Source: frontend/src/components/DailyPrayer.tsx] the component to refine
- [Source: frontend/src/components/Desk.tsx#L71] where The Watch is mounted

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (BMAD dev-story workflow)

### Debug Log References

- `cd frontend && npm run build` → `tsc -b && vite build` passed clean: 45 modules transformed, no type or unused-var errors. (AC7)

### Completion Notes List

- Resumed an in-progress, ~90%-built story. The presentation refactor of `DailyPrayer.tsx` (The Watch at the Desk) was already in place; this turn verified it against the ACs and closed out the story record.
- Confirmed the implementation satisfies every AC by reading the file:
  - AC1/AC6: foci split into `standard` / `personal` via `kind`, API order preserved (plain `.filter`, no re-sort); two labeled `<section>`s, standing group first.
  - AC2: standing section renders whenever `standard.length > 0`, independent of personal foci or prayed-today state.
  - AC3: personal header+list render only when `personal.length > 0`; "+ add a focus" affordance sits below both groups and is always present.
  - AC4: per-focus row extracted into the local `renderFocus` helper used by both groups; ring/label toggle, scripture reference, and the personal-only ✕ remove are all preserved.
  - AC5: streak line, `prayed/total` count, and open/closed collapse behavior left untouched.
  - AC4 (group-hover lesson from 3-3): `renderFocus` keeps `className="group …"` on the `<li>` so the ✕ still reveals on row hover after extraction.
- No backend, `api.ts`, or new-component changes — single-file scope honored (AC6, project-structure note).
- Verification per accepted build-as-verification gate (user-confirmed this turn). A manual UI pass before merge remains recommended but optional; the change alters no data/behavior path.
- ✅ Resolved review finding [LOW]: foci with an unexpected `kind` silently vanishing — changed `personal` to `watch.focuses.filter((f) => f.kind !== "standard")` so the personal register catches everything that isn't standing, restoring the prior flat-`.map` guarantee that every focus renders (and so `prayed/total` stays reachable). The personal-only ✕ remove control remains gated on `kind === "personal"`, so an unknown-kind focus is visible but not removable. `npm run build` passes clean (45 modules, strict-TS).
- ✅ Re-review 2026-06-25 (3 layers): the predicate-asymmetry finding (raised by Blind + Edge Case hunters) was resolved as a decision — left as-is because the asymmetry is what keeps AC4 honored, with a clarifying code comment added at the ✕ gate. The indentation-drift nit was re-indented. Two cosmetic findings (first-block margin, empty-state) dismissed as noise. `npm run build` clean after both patches.

### File List

- `frontend/src/components/DailyPrayer.tsx` (modified) — group foci by `kind` into two labeled sections; extract `renderFocus` row helper; personal register now `kind !== "standard"` so no focus can fall through both filters (review patch).

## Change Log

| Date       | Change                                                                                  |
| ---------- | --------------------------------------------------------------------------------------- |
| 2026-06-25 | Verified the standing/personal two-section grouping in `DailyPrayer.tsx` against AC1–AC7; `npm run build` passes; completed Dev Agent Record + File List; status → review. |
| 2026-06-25 | Addressed code review findings — 1 item resolved (LOW): personal register now `kind !== "standard"` so unexpected-kind foci can't vanish while still counting toward `prayed/total`; `npm run build` clean; status → review. |
| 2026-06-25 | Re-review (3-layer): documented the deliberate ✕ predicate asymmetry with a code comment (decision), re-indented the `adding` block (patch); 2 cosmetic findings dismissed; `npm run build` clean; status → done. |
