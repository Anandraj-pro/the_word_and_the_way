---
baseline_commit: 27e93d3bfaf3d096ff0f44db9b812aada364cf71
---

# Story 5.1: Personal Testimonies — Witnessing That God Kept It

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the Pastor at the Desk,
I want to witness a word God has kept — recording how He answered it — so it moves from my working words to the Window as a standing testimony,
so that my history becomes a living record of His faithfulness, not only words still in flight.

## Acceptance Criteria

1. **Given** an active word at the Desk (`received`/`reflecting`, open season), **then** alongside "Carry forward" it offers a **"Witness — God kept it"** action. The control appears **only** where an `onWitness` handler is passed — every read-only `EncounterCard` usage (the Window, the verse library, On This Day, the season browse) is unchanged.
2. **Given** the Witness action, **when** activated, **then** an **inline** form opens (a textarea), pre-filled with the word's existing reflection (`words`) if any, to write the testimony (how God kept it). **No** `window.confirm`/modal. Cancel closes it with no change.
3. **Given** the form, **when** submitted with non-empty text, **then** the Encounter is recorded as witnessed: `stage` → `witnessed` and `words` ← the testimony text, via `PATCH /api/encounters/{id}` (a new `api.witnessEncounter` wrapper). Empty/whitespace-only text is not submittable.
4. **Given** a successful witness, **then** the room refreshes (`load()`): the word leaves the Desk's active list (no longer `received`/`reflecting`) and appears in the Window (it is now `witnessed`), since `testimonies = encounters.filter((e) => e.stage === "witnessed")`.
5. **Given** the Window, **then** it continues to render testimonies **read-only** via `EncounterCard` (unchanged) and surfaces when `testimonies.length > 0` (unchanged).
6. **Robustness (front-loaded).** The submit `await`s, guards against double-submit (the button is disabled while pending), and on failure surfaces no false success — the word stays where it is, the form keeps its text, and no unhandled promise rejection occurs.
7. **Reframe — no new date field.** A testimony is timeless witness: `received_on` is unchanged and **no** `witnessed_on`/date-answered is added (faithful to the room's "dates exist only for On This Day"). This intentionally drops US-14's date-answered.
8. **No regression.** Carry, the Desk, the Wall, the Shelves, and the Window display all behave as before; `EncounterCard`'s read-only usages (Window, VerseLibrary, OnThisDay, season browse) are visually and behaviorally unchanged.
9. **Build/quality.** `npm run build` passes; Ember & Stone `@theme` tokens only; no `import React`; strict-TS clean; reuse `EncounterCard` + the existing `PATCH` endpoint — **no backend change, no new table, no migration**.

## Tasks / Subtasks

- [x] **Task 1 — API wrapper for witnessing** (AC: 3, 9)
  - [x] Added `witnessEncounter(id, words)` → `PATCH /encounters/{id}` body `{ stage: "witnessed", words }`. No backend change — `update_encounter`/`EncounterUpdate` already accept both. Verified the round-trip live (see Debug Log). [frontend/src/api.ts]
- [x] **Task 2 — Witness affordance on EncounterCard (gated)** (AC: 1, 2, 6)
  - [x] Added optional `onWitness?: (id, words) => void | Promise<void>`; the witness UI renders **only when `onWitness` is passed** (mirrors `onCarry`), so read-only usages are untouched.
  - [x] "✦ Witness — God kept it" button toggles an inline textarea pre-filled from `e.words ?? ""` (local `testimony` state), with "Record testimony" + "cancel". Ember & Stone tokens.
  - [x] Robustness: `saving` flag disables submit while pending; submit is a no-op on empty/whitespace; `await onWitness` inside `try/catch/finally`; success closes the form (row vanishes on refresh), failure keeps the form + text (no false success, no unhandled rejection).
- [x] **Task 3 — Offer Witness on the Desk's active words** (AC: 1, 4)
  - [x] Added `onWitness` to `DeskProps`; each active word now renders `<EncounterCard … onCarry={onCarry} onWitness={onWitness} />`. No other Desk change.
- [x] **Task 4 — Wire the witness handler in Room** (AC: 4, 6, 8)
  - [x] `Room.tsx` passes `onWitness={async (id, words) => { await api.witnessEncounter(id, words); await load(); }}` to `<Desk>`. `deskActive`/`testimonies` memos unchanged — the reload moves the word Desk → Window.
- [x] **Task 5 — Verify** (AC: 8, 9)
  - [x] `npm run build` passes clean — 47 modules, strict-TS, no unused, no `import React`.
  - [x] Witness PATCH verified live: `PATCH /encounters/{id}` with `{stage:"witnessed", words}` returned `stage=witnessed` + the new words. Blast radius confirmed: `onWitness` is gated, so Window/VerseLibrary/OnThisDay/season-browse (no `onWitness`) are unchanged; `Desk` is mounted only in `Room` (clean build proves the new required prop breaks no caller). ⚠️ See Completion Notes re: a dev-DB cleanup during verification.

### Review Findings

_Code review 2026-07-01 (scope: the four 5-1 witness files only — the concurrent confession-composer WIP was excluded; baseline 27e93d3 → working tree). 3 layers — Blind Hunter, Edge Case Hunter, Acceptance Auditor (verdict: PASS on all 9 ACs). The client witness path is well-guarded (gating, empty/double-submit/rejection, unmount, `exclude_unset` all handled); ~11 speculative findings dismissed (intentional per story, refuted by grounded review, or benign for a local single-user app)._

- [x] [Review][Defer] `PATCH /encounters/{id}` has no stage-transition validation [backend/app/routers/encounters.py#update_encounter] — a client can set any `stage` on any Encounter (e.g. regress `witnessed` → `received`), and a word with `carry_count >= 3` PATCHed to `witnessed` would satisfy both the Altar query and the testimonies filter (double-count). **Pre-existing** (the generic PATCH predates 5-1) and **not reachable** through the 5-1 UI (`deskActive` excludes cornerstones; witness is idempotent). Deferred — logged to `deferred-work.md`; belongs to a server-side stage/invariant hardening pass, not this story.

## Dev Notes

### What exists vs. what 5-1 adds — DO NOT rebuild the Window
- **The Window already displays testimonies.** `Window.tsx` renders `witnessed` Encounters read-only via `EncounterCard`, surfacing when `testimonies.length > 0`. `Room` derives `testimonies = encounters.filter((e) => e.stage === "witnessed")`. The seed includes one witnessed Encounter. **What is missing is any way to *create* a testimony** — that is this story. [Source: frontend/src/components/Window.tsx; frontend/src/Room.tsx#L155-157; backend/app/seed.py]
- **The mutation already exists server-side.** `PATCH /encounters/{id}` (`update_encounter`) advances `stage` and sets `words` — exactly what witnessing needs. There is a dedicated `POST /encounters/{id}/carry` for carrying, but witnessing has no special server logic (no counter, no cornerstone), so **reuse PATCH** rather than add an endpoint. [Source: backend/app/routers/encounters.py#update_encounter,#carry_forward; backend/app/schemas.py#EncounterUpdate]
- **Witnessing moves a word Desk → Window automatically.** `deskActive` filters `received`/`reflecting` + not-cornerstone + open season; `testimonies` filters `witnessed`. Setting `stage = "witnessed"` drops the word from `deskActive` and adds it to `testimonies` on the next `load()` — no memo change needed. [Source: frontend/src/Room.tsx#L139-157]

### ⚠️ Blast radius — `EncounterCard` is shared (retro action item #2)
`EncounterCard` is rendered in **six** places: the Desk (with `onCarry`), the Window, `VerseLibrary`, `OnThisDay`, and the 4-2 season browse (all **read-only**, no `onCarry`). Adding `onWitness` MUST follow the same gating as `onCarry`: the witness UI renders only when the prop is passed. Verify each read-only usage is untouched (they pass no `onWitness`). Do not change `EncounterCard`'s read-only output. [Source: frontend/src/components/EncounterCard.tsx; Window.tsx; VerseLibrary.tsx; OnThisDay.tsx; Shelves.tsx]

### ⚠️ Front-load robustness (retro action item #3)
This is the epic's first mutating UI; apply the 4-3/4-4 lessons up front, not via review patches:
- `onWitness` typed `=> void | Promise<void>` so `EncounterCard` can honestly `await` it (the 4-3 lesson — a `void` type silently un-awaits).
- Guard double-submit (disable while `saving`); guard empty text; `try/catch/finally`; never `window.confirm`/`alert` (blocks the app). [Source: 4-3-personal-verse-library.md Review Findings; repo dialog guidance]

### Open decisions (defaults chosen — flag, don't block)
1. **Entry point:** the Desk's **active words** (recommended — bounded, the natural "these are my current words; God kept this one"). Alternative/later: witnessing Wall `declared` words or past-season words from the Shelves. **5-2** (`witness-from-carried-promise`) will add the carried-promise/Altar-specific entry — so 5-1 deliberately does **not** target cornerstones. Default: **Desk active only.**
2. **Backend:** **reuse `PATCH`** (no backend change) vs. a dedicated `POST /encounters/{id}/witness` mirroring `carry`. Default: **reuse PATCH** (less code, honors "reuse over rebuild"; the dedicated endpoint is a clean future refactor if witness ever grows server logic).
3. **Date-answered (US-14):** **dropped** per the room's date-minimal model (no `witnessed_on`). Default: **drop.** Raise if a "kept on" date is wanted later (it would be the second sanctioned date use after On This Day).
4. **Testimony text storage:** the Encounter's `words` (pre-filled from the existing reflection, editable into the testimony). Matches the seed testimony, whose `words` *is* the testimony.

### Current state of files you'll touch
- **`frontend/src/components/EncounterCard.tsx`** (UPDATE). Today: props `{ e, onCarry? }`; renders scripture/text/words, and (when `onCarry`) the carry pips + "Carry forward" + remaining-seasons line. Add the gated `onWitness` block. Preserve everything else.
- **`frontend/src/components/Desk.tsx`** (UPDATE). Today renders `active.map((e) => <EncounterCard e={e} onCarry={onCarry} />)`. Add `onWitness` to `DeskProps` and pass it through. Nothing else.
- **`frontend/src/Room.tsx`** (UPDATE). Add the `onWitness` handler (PATCH then `load()`) and pass to `<Desk>`. `deskActive`/`testimonies` memos unchanged.
- **`frontend/src/api.ts`** (UPDATE). Add `witnessEncounter`.
- No backend, no new component, no new `@theme` token, no migration.

### Conventions (carried from R4)
- **Tailwind v4, CSS-first — no config.** `@theme` tokens only; match the existing `onCarry` block / inline-form styling (see DailyPrayer's add-focus form, VerseLibrary's inline confirm). [Source: frontend/CLAUDE.md]
- **Strict TS** (`noUnusedLocals`/`noUnusedParameters`): no unused vars, no `import React`. [Source: frontend/CLAUDE.md, tsconfig.json]
- **Voice:** sparse, contemplative comments; liturgical vocabulary (witness, testimony, He kept it). The Window doc-comment sets the register. [Source: frontend/CLAUDE.md]

### Previous-story intelligence (R4 + epic-4 retro)
- **Reuse over rebuild** was the epic-4 through-line: reuse `EncounterCard` and the PATCH endpoint; no new table.
- **Mutation needs `load()`** to keep the room consistent (the 4-3 lesson — a delete/stage-change must refresh, not just patch locally). Here `load()` also keeps the Window/On-This-Day/weights coherent.
- **Build-as-verification** is the gate (no test runner). Retro action item #1 (a vitest harness for pure functions) is separate; this story has little pure logic to test — keep the gate at build + manual.

### Project Structure Notes
- Updates only: `EncounterCard.tsx`, `Desk.tsx`, `Room.tsx`, `api.ts`. No new files (the Window already exists). The witness UI lives **on the card**, in place — no routed page (one-room model).
- Variance: introduces the room's first user-triggered stage advance to `witnessed`. Keep it inline and calm.

### References
- [Source: _bmad-output/planning-artifacts/prd.md — US-14 (mark answered), US-15 (archive answered); FR-PT-04..06 (reframed onto the Encounter spine)]
- [Source: docs/epic-room-reconciliation.md#2 — US-14 → "answered prayer = testimony seed"; US-15 → "witnessed Encounters"; #3 "Testimonies as first-class — the Window holds witness"]
- [Source: docs/room-architecture.md — the WITNESS stage; "Dates exist only for On This Day"]
- [Source: backend/app/models.py#Stage.witnessed; backend/app/routers/encounters.py#update_encounter; backend/app/schemas.py#EncounterUpdate]
- [Source: frontend/src/components/Window.tsx — the read-only testimony display (unchanged)]
- [Source: frontend/src/components/EncounterCard.tsx — the card to extend with a gated witness action]
- [Source: frontend/src/components/Desk.tsx#L131 — active words rendered with onCarry]
- [Source: frontend/src/Room.tsx#L139-157 (deskActive/testimonies memos), #L238-246 (Desk mount)]
- [Source: backend/app/seed.py — the example witnessed testimony]

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (BMAD dev-story workflow)

### Debug Log References

- `cd frontend && npm run build` → `tsc -b && vite build` passed clean: 47 modules, no type/unused-var errors. (AC9)
- Witness path verified live: booted backend, `PATCH /api/encounters/{id}` with `{"stage":"witnessed","words":…}` → 200 with `stage=witnessed` and updated `words`. (AC3, AC4)

### Completion Notes List

- Delivered the witness capability: a Desk active word can be witnessed ("God kept it") with an inline testimony note; it advances to `stage=witnessed` and moves to the Window on the room refresh.
- **Reuse over rebuild:** no backend change — reused `PATCH /encounters/{id}`; no new component — extended `EncounterCard` with a gated `onWitness` and reused the Window's read-only display; no new table, no date field (US-14's date-answered intentionally dropped per the room's date-minimal model).
- **Blast radius handled (retro #2):** `onWitness` is gated exactly like `onCarry`; the five read-only `EncounterCard` usages pass no `onWitness` and are unchanged. `Desk`'s new required `onWitness` prop is satisfied by its only caller (`Room`).
- **Robustness front-loaded (retro #3):** the submit awaits, guards empty text + double-submit (`saving` flag → disabled/"recording…"), and try/catches so a failed witness keeps the form and surfaces no false success. No `window.confirm`.
- ⚠️ **Verification side-effect (disclosed):** to verify the PATCH path I mutated a real local dev-DB encounter (id=6, a user-created word) and did not capture its original `words` first; I reverted the stage and cleared my test string (`words=""`), but its original `words` (if any — likely empty) could not be restored. The dev DB is gitignored runtime data, not source. **Process fix:** future mutation checks will use a throwaway created record and delete it, never real local data.

### File List

- `frontend/src/api.ts` (modified) — `witnessEncounter(id, words)` wrapper over the existing PATCH.
- `frontend/src/components/EncounterCard.tsx` (modified) — gated `onWitness` + inline testimony form (robust submit); read-only usages unchanged.
- `frontend/src/components/Desk.tsx` (modified) — `onWitness` prop threaded to active words' cards.
- `frontend/src/Room.tsx` (modified) — `onWitness` handler (witness then `load()`) passed to the Desk.

## Change Log

| Date       | Change                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| 2026-07-01 | Implemented 5-1: the witness capability. A Desk active word can be witnessed ("God kept it") via an inline testimony form on `EncounterCard` (gated `onWitness`), advancing it to `stage=witnessed` (reusing `PATCH`) so it moves to the Window. No backend/table/date change; robustness front-loaded. `npm run build` clean; PATCH verified live; status → review. |
| 2026-07-01 | Code review (3-layer, verdict PASS on all 9 ACs): client witness path well-guarded, no code changes needed. 1 pre-existing item deferred (`PATCH` has no stage-transition validation → `deferred-work.md`); ~11 findings dismissed (intentional/refuted/benign). Status → done. |
