# Deferred Work

## Deferred from: code review of story-3.3-war-room-mode (2026-06-22)

- **`.settle` entrance animation not gated behind `prefers-reduced-motion`** [frontend/src/components/WarRoom.tsx:415]. Pre-existing pattern shared with the Wall unroll modal — the `.settle` class in `index.css` plays a one-shot 700ms entrance regardless of the user's reduced-motion preference. Between-declaration swaps in the War Room are already instant, so AC8's core requirement holds; the fix is a codebase-wide one (gate `.settle` under the existing `@media (prefers-reduced-motion: no-preference)` block).
- **War Room overlay lacks focus management** [frontend/src/components/WarRoom.tsx:385]. Sets `role="dialog"`/`aria-modal="true"` but does not move focus into the dialog on open, trap focus, or mark the underlying Wall inert. The existing unroll modal has the same gap — worth a single broader accessibility pass over both overlays rather than a one-off here.
