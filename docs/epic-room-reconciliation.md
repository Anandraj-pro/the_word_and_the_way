# Epic Reconciliation — PRD Features vs. The One Room

**Date:** 2026-06-22
**Purpose:** Reconcile the PRD's 7 feature-epics against the north-star `room-architecture.md`
(one room, one Encounter, five stations), so sprint tracking reflects the product actually
being built rather than the superseded dashboard framing.

> The room doc states it *supersedes* the PRD's feature-list framing. This document does not
> discard the PRD — it folds each PRD story into the station/stage where it actually lives, and
> surfaces what the room needs that the PRD never specified.

---

## 1. The reconciled epic set (room-native)

The build is already following `room-architecture.md §4`. These 7 epics map 1:1 to that build
plan, so sprint status can track reality.

| New epic | Station / Stage | Build step | Status |
|---|---|---|---|
| **R1 — Room Shell + Encounter Model** | whole room · spine | 1 | done |
| **R2 — The Desk → Altar Loop** | Desk (Receive+Reflect) → Altar (Carry) | 2 | done |
| **R3 — The Wall** | Declare · War Room · confessions corpus | 3 | in-progress |
| **R4 — The Shelves** | Archive · seasons as spines | 4 | backlog |
| **R5 — The Window** | Witness · testimonies | 5 | backlog |
| **R6 — Lighting** | Three-Watch + Seasonal Skin + Altar greeting | 6 | backlog |
| **R7 — Settings & Ollama** | cross-cutting plumbing | — | backlog |

---

## 2. Where every PRD story lands

| PRD story | Lands in | Verdict |
|---|---|---|
| **Epic 1 — Daily Dashboard** | | **Epic dissolves** — room kills the dashboard |
| US-01 personalized greeting | R6 Lighting / Altar entry | reframe → prophetic greeting on the Altar |
| US-02 activity summary | R1 / R6 | dissolve → dim/lit stations (Progressive Revelation) |
| US-03 clickable sections | — | drop → spatial room, no section routing |
| US-04 incomplete-section prompts | R1 / R6 | reframe → empty stations are *dim*, not prompted |
| US-05 Hebrews chapter tracker | R2 Desk (reading facet) | keep, as a Desk facet (⚠ metric tension) |
| **Epic 2 — Bible Reading Tracker** | | **Folds into R2 (Desk / Receive)** |
| US-06 log reading session | R2 Desk | keep |
| US-07 remember position | R2 Desk | keep |
| US-08 chapters today/total | R2 Desk | keep (⚠ metric tension — soften) |
| US-09 spirit-led next reading | R2 Desk | keep — fits "listen before reading" |
| US-10 verse suggestions (Ollama) | R2 Desk + R7 | keep |
| US-11 reflection from reading | R2 Desk (Reflect) | keep |
| **Epic 3 — Prayer Tracker** | | **Epic splits across 3 stations** |
| US-12 running prayer list | R3 Wall (War Room) | ⚠ no native station — closest is active intercession |
| US-13 prayer categories | R7 / Ollama | reframe → Ollama-inferred themes, not hand-tagged |
| US-14 mark answered | R5 Window | reframe → answered prayer = testimony seed |
| US-15 archive answered | R5 Window + R4 Shelves | reframe → witnessed Encounters |
| US-16 prayer session + time | R1 Altar threshold | ⚠ metric tension — soften duration tracking |
| US-17 associate prayer w/ items | R1 Encounter linking | keep as spine relation |
| US-18 standard recurring prayers | R3 Wall | keep — confessions corpus already does this |
| **Epic 4 — Reflection Journal** | | **Folds into R2 (Desk / Reflect)** |
| US-19 freeform reflection | R2 Desk | keep |
| US-20 guided prompts | R2 Desk (Dialogue Journal) | keep |
| US-21 auto-associate | R1 Encounter spine | keep |
| US-22 link to verses | R1/R2 scripture facet | keep |
| US-23 auto-save | R2 (cross-cutting) | keep |
| **Epic 5 — Favorite Verse Library** | | **Splits R2 (capture) + R4 (browse)** |
| US-24 save verse from reading | R2 Desk → Encounter | keep |
| US-25 personal library | R4 Shelves | keep |
| US-26 verse detail context | R1 Encounter / R4 | keep |
| **Epic 6 — Unified Devotional Record** | | **IS the Encounter spine (R1) + R4** |
| US-27 single linked record | R1 Encounter model | already the spine — done |
| US-28 browse history by date | R4 Shelves | reframe → browse by **season**, date only for "On This Day" |
| **Epic 7 — Settings** | | **Folds into R7** |
| US-29 name/title | R7 → feeds R6 greeting | keep |
| US-30 export .sqlite | R7 | keep |
| US-31 Ollama detection | R7 | keep |

---

## 3. What the room needs that the PRD never specified (net-new)

These are first-class to the room but have **no PRD story** — they must be added as work:

- **Carry mechanic** — `carry_count`, carrying an Encounter across seasons, `carry_count >= 3`
  promoting a promise to a **Cornerstone inscribed on the Altar**. (R2/Altar) — the *soul of the app*.
- **Seasons** — `season_id` as the primary organizing lens; named seasons as Shelf spines. (R4)
- **Testimonies as first-class** — the Window holds witness, not just archived answered prayers. (R5)
- **War Room mode** on the Wall — focused declaration/intercession. (R3)
- **Lighting** — Three-Watch palette + Seasonal Skin shifts by hour/season. (R6)
- **Promise Surfacer** — Ollama surfaces a carried promise at the right moment. (R7/Altar)

---

## 4. Tensions to resolve (decisions for the Pastor)

These are genuine philosophy conflicts, not relabels:

1. **Metrics vs. "never technological."** PRD tracks prayer-time duration (US-16) and chapter
   counts (US-08). Room vocabulary is liturgical and anti-metric. → Keep quantified tracking, or
   soften to qualitative?
2. **Hand-tagged categories (US-13) vs. Ollama-inferred themes.** Room says themes are inferred,
   never hand-tagged. → Drop manual prayer categories?
3. **Date-based history (US-28) vs. season-as-lens.** → Demote date to "On This Day" only?
4. **The Dashboard (Epic 1).** Room explicitly kills it. → Confirm Epic 1 dissolves into the
   Altar entry + Progressive-Revelation lighting?
5. **Prayer Tracker (Epic 3).** A productivity-list feature with no native station. → Confirm it
   splits: active intercession → Wall, answered → Window, threshold prayer → Altar?
