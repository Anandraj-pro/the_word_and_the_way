# docs — design north star & corpus

Reference material, not code. One file here is binding; the rest is context.

- **`room-architecture.md`** — the **north star**. Read it before changing UX, the station
  model, or the Encounter lifecycle. If code and this doc disagree, surface it rather than
  quietly diverging.
- `project-discovery-questions.md`, `epic-room-reconciliation.md` — discovery and planning
  notes (background, not contracts).
- `ui-concepts.html` — early visual explorations (the chosen direction is "Ember & Stone").
- `cascade-demo.html` + `cascade.gif` — standalone demo and recording of the staggered
  station reveal (mirrors `frontend/src/components/Reveal.tsx`). Regenerate the GIF from the
  demo with headless-Chrome frames + `gifski` if the motion changes.
- `confessions_md/` — the Wall corpus, **synced into the DB on every backend boot**
  (`backend/app/confessions_loader.py`). Edit confessions here, not in the database.
- `confessions_raw/` — binary originals; **gitignored** (large, not source).

When updating docs, keep `room-architecture.md` authoritative and concise; let the other
files be supporting context.
