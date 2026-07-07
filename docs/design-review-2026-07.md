# UI/UX Design Review — July 2026

**Status: approved — Option B ("Restore the room") chosen and implemented, July 2026.**
Reviewed against [`room-architecture.md`](room-architecture.md) (the north star) by walking
the running app at desktop (1440×900) and phone (390×844) widths, every station, entry,
and tour. Screenshots referenced below were captured from the live app on 2026-07-07.

---

## 1. Verdict in one paragraph

The bones are right and worth keeping: the Ember & Stone palette, the Encounter spine, the
carry mechanic, and the room vocabulary are distinctive and sound. What broke is the **shell
around them** — navigation, entry, and station framing. The room quietly became five hidden
pages behind an invisible tab bar, which is precisely the failure mode the north star names
("do not turn stations into routed pages"). The result: a first-time user can see roughly
one fifth of the app, and a phone user can see one fifth *permanently*. This is fixable
without a rebuild. Recommendation: **Go — Option B (Restore the room), scoped in §5.**

---

## 2. What exists today

- **Entry** — an "Enter the room" hero with an image-accordion of the five stations. You must
  click through it every session.
- **Once entered** — `Room.tsx` renders exactly **one** station at a time (`activeStation`);
  the other four unmount. A sticky bar holds the wordmark, station links, and "Take a walk."
- **The five stations** — Altar (stats + cornerstones + threshold line), Desk (Vine, In the
  Word, Dwelling On, The Watch, Receive a Word, Carrying), Shelves (seasons list), Wall
  (declarations + 76-item corpus), Window (testimony cards).
- **Tour** — a six-step modal walk-through, shown once.

---

## 3. Findings

Severity is about **how much of the app the problem hides or breaks**, not code quality.

### Critical

**C1 — The primary navigation is invisible.**
`RoomThreshold` collapses every non-active station link to `max-w-0 px-0 opacity-0`; they
reappear only while the pointer hovers the nav region
(`interactive-image-accordion.tsx:365`). A user standing at the Desk sees only
"Desk · Devotions" in the bar — nothing indicates four other stations exist. This is not
hypothetical: during this review, Playwright **timed out trying to click "Altar · Home"**
because the element is genuinely not visible. If an automated browser can't find the
navigation, a person won't either. Hover-revealed primary nav also has no touch equivalent.

**C2 — On a phone there is no station navigation at all.**
The nav is `hidden sm:flex` (`interactive-image-accordion.tsx:345`). Below 640 px the bar
holds only the wordmark (which silently means "go to the Altar" — undiscoverable) and
"Take a walk." A phone user who entered at the Desk **cannot reach** the Altar, Shelves,
Wall, or Window. For a daily-devotion app, phone is arguably the primary context.

**C3 — The room became five hidden pages: the exact anti-pattern the north star forbids.**
`Room.tsx:199–284` renders only the active station; the rest unmount. The north star says
stations *"fade in as you have data — but the room is always the room; empty stations are
simply dim, not absent."* Today they are absent. Combined with C1/C2 this is a tabbed
dashboard whose tabs are invisible — the worst of both models. The spatial feeling ("one
room, furniture framing the Altar") cannot survive when the furniture is unmounted.

### Major

**M1 — Two vocabularies compete in every label.**
"Altar · Home", "Desk · Devotions", "Shelves · Seasons", "Wall · Declarations",
"Window · Testimonies." Doubling every name doubles reading cost and quietly concedes that
the metaphor can't stand alone. Pick one primary vocabulary (the room's) and let the
function live as a subtitle *inside* the station header — which the stations already do
well ("The Desk / DAILY DEVOTIONS").

**M2 — The Wall's reading experience defeats the Wall's purpose.**
A full confession is set in **Abril Fatface — a display face — as body copy**, white on
terracotta, in a single ~95-characters-per-line block with no paragraph breaks. Display
faces are drawn for one-line headings; at paragraph length this is genuinely hard to read,
and reading the corpus aloud is the Wall's entire job. The 76-item corpus below it is a
flat, unsectioned list.

**M3 — The Desk is six modules with one visual weight.**
The Vine, In the Word, Dwelling On, The Watch, Receive a Word, and Carrying stack in one
column with near-identical framing. "Receive a Word" — the app's soul, per the build plan —
is two hairline inputs **below the fold** with less visual presence than the prayer
checklist. Nothing tells the Pastor what the Desk wants him to do *first*.

**M4 — The entry hero is a toll gate, and it's broken at the edges.**
Every session starts with "Enter the room." + a click — a cost paid daily that buys
nothing after the first visit. The accordion's vertical titles clip ("The Altar" is cut
off at 1440 px; panels overflow the container), on mobile three of five stations sit
off-screen with no scroll affordance, and the hero floats in a mostly-empty dark viewport.
A returning user should land *inside* the room, facing the Altar — the north star's "you
enter facing the Altar" was about the view, not a door-opening ceremony.

**M5 — Invented vocabulary is never explained where it's used.**
"Carried 4×", "3 more seasons to the Altar", "Plant the day", "the leaves / the roots /
the soil", "Cross into a new season", "0/4 prayed", "✦ KEPT — WITNESSED IN THE WINDOW."
The tour defines some of this once, then it's gone. Liturgical voice is a strength; a
private code is not. Each term needs its meaning carried in place (one quiet clause, a
title attribute is not enough) — or the term should go.

### Minor

- **m1 — Altar legibility & dead numbers.** The stats row (2 INSCRIBED / 4 CARRYING /
  ✦1 IN THE WORD / ✦0 ON WATCH) is cryptic, low-contrast stone-on-ink, and inert — the
  numbers go nowhere. The threshold input ("Speak it…") shows no submit affordance and no
  hint of what happens to what you type (it seeds the Desk — invisible mechanic).
- **m2 — The room feels vacant, not contemplative.** Shelves and Window are a small card
  adrift in a dark viewport; at 1440×900 roughly 70 % of those screens is empty ink.
- **m3 — The tour modal floats bottom-right in dead space**, visually disconnected from
  the things it narrates.
- **m4 — Disabled buttons with no reason** ("Plant the day" — why can't I?).
- **m5 — favicon 404** on every load; no tab identity.

### What is working — keep it

- **Ember & Stone** palette + Abril Fatface/Source Serif pairing (used at the right sizes)
  is distinctive and right for the subject. Don't touch the tokens.
- **The Encounter spine** and the carry → cornerstone → Altar mechanic — the data model and
  its emotional arc are exactly right.
- The **bespoke SVG station scenes** (candle, book, spines, courses, arched window).
- The **copy voice** at its best: "What are you bringing to God today?" / "This was my
  Wilderness — and He spoke tenderly there."

---

## 4. Design principles (binding, if we go)

1. **No hover-only affordances.** Anything necessary must be visible at rest and reachable
   by touch. (Kills C1 structurally.)
2. **Empty ≠ absent.** Every station is always present; empty ones are dim. (North star §3.)
3. **One vocabulary.** Room names lead; function is a small-caps subtitle inside the
   station, never a second name in the nav.
4. **Display face sets names, never paragraphs.** Abril Fatface max ~2 lines; all body
   copy is Source Serif at ≤ 70 ch line length.
5. **One dominant action per station.** The Desk's is "Receive a Word." Everything else at
   that station is visually subordinate.
6. **Every visible number must answer "so what."** A count is a door (it goes somewhere)
   or it isn't shown.
7. **Terms carry their meaning in place.** If a liturgical term needs the tour to be
   understood, the term isn't finished.

---

## 5. Options and recommendation

### Option A — Repair only (the "no-go" path) · ~1–2 days
Keep one-station-at-a-time. Fix the breakage: nav links always visible (desktop), a
bottom station bar on mobile, single vocabulary, Wall body typography (serif, 65 ch,
paragraph breaks), returning users skip the hero. Honest, cheap, and the app stops hiding
itself — but the room stays a set of pages, and the north star stays unmet.

### Option B — Restore the room (recommended · "go") · ~1–2 weeks
The north star as written, using what's already built:

- **One continuous page again.** Enter facing the **Altar** (full-height, first). The
  Desk follows, then Wall, Shelves, Window — all mounted, all visible by scroll, empty
  stations rendered dim rather than removed. `Reveal.tsx` already does the staggered
  settle; `Station.tsx` already frames furniture.
- **A quiet, permanent nav**: five station names always visible in the sticky bar
  (desktop) and a five-icon bottom bar (mobile), current station lit by the existing
  IntersectionObserver. Station SVG motifs become the icons.
- **Entry**: first visit gets the hero + walk; returning users land in the room at the
  Altar. The hero becomes the room's "front door" only when there's no data.
- **Desk re-weighted**: Receive a Word becomes the desk's centerpiece (the open page, on
  top, generous); Vine/Reading/Watch become smaller side furniture on the same surface.
- **Wall re-typeset**: corpus body in Source Serif ≤ 70 ch with breaks; War Room mode is
  where large display type belongs (one line at a time, spoken aloud).
- **Altar numbers become doors** (each stat scrolls to its station) and the threshold
  line gets a visible "lay it down →" affordance with a one-line explanation.
- Vocabulary, term-in-place meaning, favicon, disabled-state reasons — per §4.

Nothing here touches the backend or the Encounter model. It is a reshaping of `Room.tsx`,
the threshold bar, and station-level typography/hierarchy.

### Option C — Full spatial reconception · weeks+
A literal navigable room (canvas/3D/parallax). Not recommended: novelty over daily
usability, high cost, and the north star never asked for literal space — it asked for
*one page that feels like one place*.

**Recommendation: Go, with Option B.** If the answer is no-go, Option A's fixes for
C1/C2 (visible nav, mobile nav) should still land — those two are not design opinions,
they are outages.

---

## 6. If "go": first steps

1. Agree on §4 principles (they bind the work).
2. Mock the two load-bearing views first — **the room's single scroll (Altar → Desk)** on
   desktop and phone — before touching code; sync the tokens and station components to the
   Claude Design "Design System" project (via `/design-sync`) so mocks and code share one
   source.
3. Land in the north star's own order: shell/nav first, then Desk hierarchy, then Wall
   typography, then Altar affordances.
4. Re-walk this same review script (every station, both widths) as the acceptance check.