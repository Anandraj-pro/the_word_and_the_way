# Deferred Work

## Deferred from: code review of story-3.3-war-room-mode (2026-06-22)

- **`.settle` entrance animation not gated behind `prefers-reduced-motion`** [frontend/src/components/WarRoom.tsx:415]. Pre-existing pattern shared with the Wall unroll modal — the `.settle` class in `index.css` plays a one-shot 700ms entrance regardless of the user's reduced-motion preference. Between-declaration swaps in the War Room are already instant, so AC8's core requirement holds; the fix is a codebase-wide one (gate `.settle` under the existing `@media (prefers-reduced-motion: no-preference)` block).
- **War Room overlay lacks focus management** [frontend/src/components/WarRoom.tsx:385]. Sets `role="dialog"`/`aria-modal="true"` but does not move focus into the dialog on open, trap focus, or mark the underlying Wall inert. The existing unroll modal has the same gap — worth a single broader accessibility pass over both overlays rather than a one-off here.

## Deferred from: code review of story-4.1-seasons-as-spines (2026-06-26)

- **No DB-level one-open-season invariant** [frontend/src/components/Shelves.tsx:31; frontend/src/Room.tsx:110; backend/app/routers/seasons.py]. The "exactly one open season" rule is enforced only at the `open`/`cross` routes via the `_open_season` 409 guard, not at the schema/DB level. If data ever held two `closed_on IS NULL` rows, the Shelves would double-mark "open · this season" and `Room`'s `seasons.find((s) => s.is_open)` would pick an arbitrary one. Pre-existing (4-1 only inherits the assumption). A real fix is a partial-unique constraint or an app-level guard on `close`/`cross`, applied once across the season lifecycle.

## Deferred from: code review of story-5.1-personal-testimonies (2026-07-01)

- **`PATCH /encounters/{id}` has no stage-transition validation** [backend/app/routers/encounters.py#update_encounter]. `update_encounter` applies any `stage` from the payload with no state-machine check, so a client can regress a `witnessed` testimony back to `received`/`reflecting` (it would leave the Window and reappear on the Desk), or set `stage="witnessed"` on any id. Related: witnessing leaves `carry_count` untouched, so a word with `carry_count >= 3` set to `witnessed` would satisfy both the Altar cornerstone query and the testimonies filter (appear on Altar AND Window). Pre-existing (the generic PATCH predates 5-1) and not reachable through the current UI (`deskActive` — the only surface offering Witness — excludes cornerstones; witnessing is idempotent). A real fix is a small server-side stage-transition guard on `update_encounter` (and/or deriving `is_cornerstone` vs `witnessed` consistently), applied once for the whole Encounter lifecycle.
