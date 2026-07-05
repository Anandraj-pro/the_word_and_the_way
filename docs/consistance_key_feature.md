# The Vine — a felt rhythm of daily practice

_Design note. The north star remains [`room-architecture.md`](room-architecture.md); this
describes one feature living at the Desk. Grown from a brainstorming session on 2026-07-05
([full session](../_bmad-output/brainstorming/brainstorming-session-2026-07-05-consistency-flow.md))._

## The gap

Today the room lets you read the Word, keep confessions and declarations, and hold prayer
points. What's missing is **consistency** and **flow** — a way to return day after day that
feels like one continuous act of devotion, not a switch between separate features.

## The image

Consistency here is not a streak. It is **a felt rhythm of daily practice** — like tending a
plant each morning. So the feature *is* a plant: **the Vine** (John 15 — _"I am the vine, you
are the branches… abide in me"_). You don't operate it; you **Abide** in it.

- **The Vine** — the living plant at the Desk: the day's status, and (over time) the record.
- **Abide** — the daily act of tending it. You enter the room and go *abide*, not "start a session."

It is **one plant with several parts**, never a garden of separate ones:

| Part | Branch of the Vine |
|---|---|
| Reading the Word | the leaves — what reaches for light |
| Prayer | the roots — unseen, where it drinks |
| Confession / declaration | the soil — turned and cleared |
| Freestyle | new growth — buds |

Because they are parts of one plant, there is nothing to "switch" between. You tend a branch,
not a page.

## How it moves

**At first light.** When the date turns, the Vine is dormant from the night and asks once:
_"What will you tend today?"_ You choose *which* branches — never *how much*. This is a
**compass, not a contract**: tend more than you planned and the Vine welcomes it; tend less
and it simply notes what you'd set out to do. No quota, no failed promise.

**The hearth (the flow).** To abide, the room draws *close*. It dims to candlelight and
today's chosen parts — the reading, the prayer prompt, the confession — surface **around the
Vine** in the pool of light. You never traverse the room; the parts come to you. The other
stations still exist for free wandering — abiding is simply the same room pulling into focus.
Amen widens the light back out.

**The four words** replace Start / Pause / Resume / Complete with the Vine's own voice:

| Word | Meaning |
|---|---|
| **Begin** | draw near; the clock starts |
| **Rest** | pause *today*; no penalty |
| **Return** | come back |
| **Amen** | seal the time — _it is done_ |

(_You_ Rest, within a day. The _Vine_ sleeps — dormant, over days.)

**The clock.** A clock shows H:MM while you abide, but it is **not a countdown or a timer**.
On Begin the number fades — present if you seek it, never ticking at you. Its lasting job is to
**sculpt the Vine**: a long, lingering prayer draws a deeper root; a quick reading opens a
smaller leaf. On Amen it returns briefly to seal ("you abided 0:47"), then settles into the
day's shape. Presence, made into form — never a score.

## The day's story (the status)

The small status you can always see is **the Vine itself** — a living, ink-drawn glyph at the
Desk (a thumbnail in the corner while you wander). The branches you chose this morning begin
bare; as you tend each, it comes to leaf. At a glance: _"the Word and Confession are in leaf;
prayer's branch is still bare"_ — the day's progress, told without a single number.

It shows not only *whether* each branch is tended but the **arc of the morning** — the order
you reached for things and where you lingered — so a day has a shape you can read back.

## Consistency without guilt

The Vine is **honest** — it shows its true condition — but neglect reads as **rest, not
death**. Miss days and it goes dormant (muted, waiting), never withered or scarred; any
morning's watering begins the wake-up. Over time (see v2) tending grows it visibly fuller, so
the felt rhythm becomes something you can *see* accumulate — accountability through beauty, not
a number.

## Shape of the build

**Architecture — a meta-layer over the day.** The Encounter spine
(Receive → Reflect → Declare → Carry → Witness) is **not** touched. A new lightweight record
frames the day; the Vine is a *projection* of that history, not a parallel spine. Validate
against `room-architecture.md` before writing code.

```
AbidingDay (new — one per calendar day you show up)
  date
  planned_branches: [Word, Prayer, ...]        # the morning compass
  tended: [ { branch, seconds, order_index, first_touched_at, tended: bool } ]
  # the day's arc renders directly from this

Vine long-state (DERIVED, not stored)
  fullness  = decay-weighted sum over recent AbidingDays   # v2
  dormancy  = days since last tending                      # v2
  # no streak integer anywhere — the rhythm is computed, never counted
```

**Ship order:**

- **v1 — the full daily loop:** morning plan · Begin / Rest / Return / Amen · the fading clock
  that sculpts each branch · the day's arc · the living Vine glyph at the Desk.
- **v2 — the honest plant over time:** accumulating fullness (a month you can see) · dormancy
  and revival across days.
- **v3 (optional) — deeper weaving:** link tended branches to the actual Encounters touched
  that morning, so the Vine's leaves map to real objects on the spine.
