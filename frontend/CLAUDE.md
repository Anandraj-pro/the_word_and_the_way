# frontend — React · TypeScript · Tailwind v4 · Vite

The one room, rendered. See the repo-root [`CLAUDE.md`](../CLAUDE.md) for the "one room"
model — this is the single most important constraint: **stations are furniture, not pages.**

## Run

```bash
npm install
npm run dev      # http://localhost:5173, proxies /api → http://127.0.0.1:8000
npm run build    # tsc -b && vite build  (run this to typecheck)
```

## Stack specifics (non-obvious)

- **Tailwind v4, CSS-first.** There is **no `tailwind.config.js`** — design tokens are
  declared in `src/index.css` under `@theme` (the `@tailwindcss/vite` plugin). Add colors/
  fonts there, then use them as utilities (`text-terracotta`, `bg-ink`, `font-display`).
- **shadcn-style.** `@/` aliases `src/` (set in `tsconfig.json` + `vite.config.ts`);
  `components.json` configures the CLI; reusable primitives go in `src/components/ui/`.
  Hand-authored station components stay in `src/components/`.
- **TS is strict** (`noUnusedLocals`/`noUnusedParameters`) — `npm run build` will fail on
  unused imports; don't `import React` under the new JSX transform.

## Architecture

- **`Room.tsx`** is the whole page. It fetches via `api.ts` and sorts each Encounter to its
  station by lifecycle stage. Stations: `Altar`, `Desk`, `Shelves`, `Wall`, `Window`,
  wrapped by `Station.tsx` (the shared "furniture" surface).
- **Entrance → room.** `RoomAccordion` (hero) collapses into `RoomThreshold` (sticky bar)
  via Room's `entered` state. Stations have `#station-*` anchors with `scroll-mt-*`; an
  `IntersectionObserver` in `Room.tsx` drives the bar's active highlight.
- **Motion.** `Reveal.tsx` staggers stations into view on scroll. The `.reveal` CSS in
  `index.css` is gated on `@media (prefers-reduced-motion: no-preference)` — honor that;
  content must never depend on the animation.

## Conventions

- **Ember & Stone**: terracotta / terracotta-deep / stone / linen / linen-deep / ink;
  `font-display` = Abril Fatface, `font-serif` = Source Serif 4. Use the `@theme` tokens in
  components, not raw hex (raw hex is fine inside SVG scenes).
- Comments are sparse and in the room's contemplative voice — match the surrounding code.
- The room is **dark** (`bg-ink`); stations are lit linen surfaces. Keep them as equal-height
  furniture on one baseline, not floating cards of mismatched height.
