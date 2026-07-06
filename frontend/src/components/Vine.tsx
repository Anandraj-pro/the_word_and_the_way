import { useCallback, useEffect, useRef, useState } from "react";
import { api, type AbidingBranch, type AbidingToday } from "../api";

/**
 * The Vine — a felt rhythm of daily practice, kept at the Desk.
 *
 * Each morning you choose which branches of the one plant to tend (Word · Prayer · Confession ·
 * Freestyle), then abide with them. A clock shows while you abide but fades once you Begin — it
 * does not count down; its lasting work is to sculpt each branch into the day's shape. Neglect
 * is never shamed; presence is simply kept. This is a hearth at the Desk, not a new station.
 */

type BranchKey = AbidingBranch["branch"];

const BRANCHES: { key: BranchKey; label: string; part: string }[] = [
  { key: "word", label: "Word", part: "the leaves" },
  { key: "prayer", label: "Prayer", part: "the roots" },
  { key: "confession", label: "Confession", part: "the soil" },
  { key: "freestyle", label: "Freestyle", part: "new growth" },
];

const LABEL: Record<BranchKey, string> = {
  word: "Word",
  prayer: "Prayer",
  confession: "Confession",
  freestyle: "Freestyle",
};

// The clock shows in H:MM — presence, not a stopwatch. Sub-minute reads 0:00 by design.
function hmm(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}

export function Vine() {
  const [today, setToday] = useState<AbidingToday | null>(null);
  const [picking, setPicking] = useState<Set<BranchKey>>(new Set());
  const [saving, setSaving] = useState(false);

  // The abiding in progress (client-owned clock; the server stores only committed seconds).
  const [active, setActive] = useState<BranchKey | null>(null);
  const [resting, setResting] = useState(false);
  const [elapsed, setElapsed] = useState(0); // display seconds on the current, uncommitted stretch
  const [sealed, setSealed] = useState<number | null>(null); // "you abided H:MM", shown briefly
  const [busy, setBusy] = useState(false); // a commit is in flight — hold the controls
  const elapsedRef = useRef(0); // uncommitted seconds on the active branch
  const sessionRef = useRef(0); // total abided this sitting, for the Amen seal
  const busyRef = useRef(false); // guards re-entrancy on a double-click, ahead of the state update
  const tick = useRef<ReturnType<typeof setInterval>>(undefined);

  const load = useCallback(async () => {
    try {
      setToday(await api.abidingToday());
    } catch {
      setToday(null); // non-critical — the Vine stays quiet, the room stays open
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The clock runs only while abiding and not resting; it clears on unmount.
  useEffect(() => {
    if (active && !resting) {
      tick.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
      }, 1000);
    }
    return () => clearInterval(tick.current);
  }, [active, resting]);

  if (!today) return null;

  // Commit the current stretch's linger to its branch, then clear the stretch. The clock is
  // stopped first so seconds spent waiting on the network don't bleed into the next branch.
  const commit = async (branch: BranchKey) => {
    clearInterval(tick.current);
    const seconds = elapsedRef.current;
    elapsedRef.current = 0;
    setElapsed(0);
    if (seconds > 0) {
      try {
        setToday(await api.tendBranch(branch, seconds));
      } catch {
        /* presence is gentle — a lost commit is not worth breaking the room */
      }
    }
  };

  const plant = async () => {
    if (picking.size === 0 || saving) return;
    setSaving(true);
    try {
      const order: BranchKey[] = BRANCHES.filter((b) => picking.has(b.key)).map((b) => b.key);
      setToday(await api.setAbidingPlan(order));
    } finally {
      setSaving(false);
    }
  };

  const begin = () => {
    const first = today.planned_branches[0] ?? "word";
    elapsedRef.current = 0;
    sessionRef.current = 0;
    setElapsed(0);
    setResting(false);
    setActive(first);
  };

  const switchTo = async (branch: BranchKey) => {
    if (branch === active || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      sessionRef.current += elapsedRef.current;
      if (active) await commit(active);
      setResting(false);
      setActive(branch);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const amen = async () => {
    if (!active || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      sessionRef.current += elapsedRef.current;
      await commit(active);
      clearInterval(tick.current);
      setActive(null);
      setResting(false);
      setSealed(sessionRef.current);
      setTimeout(() => setSealed(null), 6000);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const togglePick = (key: BranchKey) =>
    setPicking((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // ── The morning ask — first light, before a plan is named. ──
  if (!today.has_plan) {
    return (
      <section className="mb-5 rounded-sm border border-stone/15 bg-linen-deep/30 px-4 py-4">
        <p className="mb-1 text-[0.65rem] uppercase tracking-[0.3em] text-stone/60">The Vine</p>
        <p className="mb-3 font-display text-lg text-terracotta-deep">What will you tend today?</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {BRANCHES.map((b) => (
            <button
              key={b.key}
              onClick={() => togglePick(b.key)}
              className={`rounded-full border px-3 py-1 font-serif text-sm transition-colors ${
                picking.has(b.key)
                  ? "border-terracotta bg-terracotta text-linen"
                  : "border-stone/40 text-ink hover:border-terracotta"
              }`}
            >
              {b.label}
              <span className="ml-1.5 text-xs italic opacity-70">{b.part}</span>
            </button>
          ))}
        </div>
        <button
          onClick={plant}
          disabled={picking.size === 0 || saving}
          className="rounded-sm bg-terracotta px-4 py-1.5 font-serif text-sm text-linen transition-colors hover:bg-terracotta-deep disabled:opacity-40"
        >
          {saving ? "planting…" : "Plant the day"}
        </button>
      </section>
    );
  }

  // The day's tending, keyed by branch, for the glyph and the arc.
  const byBranch = new Map(today.branches.map((b) => [b.branch, b]));
  // The arc of the morning — branches in the order they were reached for.
  const arc = [...today.branches].sort((a, b) => a.order_index - b.order_index);

  return (
    <section className="mb-5 rounded-sm border border-stone/15 bg-linen-deep/30 px-4 py-4">
      <div className="flex items-start gap-4">
        <VineGlyph
          byBranch={byBranch}
          planned={today.planned_branches}
          active={active}
          fullness={today.fullness}
          daysDormant={today.days_dormant}
        />

        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[0.65rem] uppercase tracking-[0.3em] text-stone/60">The Vine</p>

          {/* The arc — the day's story, told as a sequence, never a number. */}
          {arc.length > 0 ? (
            <p className="mb-2 font-serif text-sm italic leading-snug text-stone">
              {arc.map((b) => LABEL[b.branch]).join(" · ")} in leaf
            </p>
          ) : (
            <p className="mb-2 font-serif text-sm italic text-stone/70">
              The branches wait, bare. Begin to abide.
            </p>
          )}

          {/* The long season, told as the plant's condition — never a count. */}
          {today.days_dormant !== null && today.days_dormant >= 3 ? (
            <p className="mb-2 font-serif text-xs italic text-stone/60">
              The Vine has been resting — tend a branch to wake it.
            </p>
          ) : today.fullness >= 0.5 ? (
            <p className="mb-2 font-serif text-xs italic text-stone/60">Grown full this season.</p>
          ) : null}

          {sealed !== null && (
            <p className="settle mb-2 font-serif text-sm text-terracotta">
              ✦ You abided {hmm(sealed)}. Amen.
            </p>
          )}

          {active === null ? (
            <button
              onClick={begin}
              className="rounded-sm bg-terracotta px-4 py-1.5 font-serif text-sm text-linen transition-colors hover:bg-terracotta-deep"
            >
              Begin
            </button>
          ) : (
            <div className="flex flex-col gap-2.5">
              {/* Which part you are tending — planned branches are pre-lit; extra is welcomed. */}
              <div className="flex flex-wrap gap-1.5">
                {BRANCHES.map((b) => {
                  const planned = today.planned_branches.includes(b.key);
                  const isActive = b.key === active;
                  return (
                    <button
                      key={b.key}
                      onClick={() => switchTo(b.key)}
                      disabled={busy}
                      className={`rounded-full border px-2.5 py-0.5 font-serif text-xs transition-colors disabled:opacity-50 ${
                        isActive
                          ? "border-terracotta bg-terracotta text-linen"
                          : planned
                            ? "border-terracotta/50 text-terracotta-deep hover:border-terracotta"
                            : "border-stone/30 text-stone hover:border-terracotta"
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                {/* The clock — faded once Begun, present only if the eye seeks it. */}
                <span
                  className={`font-serif text-sm tabular-nums transition-opacity ${
                    resting ? "text-stone/50 italic" : "text-stone/40"
                  }`}
                  aria-label="time abided"
                >
                  {resting ? "resting" : hmm(elapsed)}
                </span>
                {resting ? (
                  <button
                    onClick={() => setResting(false)}
                    className="font-serif text-sm text-terracotta-deep hover:text-terracotta"
                  >
                    Return
                  </button>
                ) : (
                  <button
                    onClick={() => setResting(true)}
                    className="font-serif text-sm text-stone/70 hover:text-terracotta-deep"
                  >
                    Rest
                  </button>
                )}
                <button
                  onClick={amen}
                  disabled={busy}
                  className="ml-auto rounded-sm border border-terracotta/50 px-3 py-1 font-serif text-sm text-terracotta-deep transition-colors hover:bg-terracotta hover:text-linen disabled:opacity-50"
                >
                  Amen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * The living glyph — an ink-drawn vine whose branches come to leaf as they are tended, each
 * leaf sized by its linger. Over days it carries a longer memory: `fullness` makes the whole
 * plant read more established (taller, thicker, lusher), and long neglect (`daysDormant`) lets
 * it settle into sleep — muted, waiting — never withered or dead. Raw hex is used here, inside
 * the SVG scene, as the room's conventions allow.
 */
function VineGlyph({
  byBranch,
  planned,
  active,
  fullness,
  daysDormant,
}: {
  byBranch: Map<BranchKey, AbidingBranch>;
  planned: BranchKey[];
  active: BranchKey | null;
  fullness: number; // 0..1 — the plant's long stature
  daysDormant: number | null; // days since last tending; high → sleep
}) {
  // Growth from today's linger — a gentle, bounded curve so a long prayer reads as a fuller leaf.
  const grow = (key: BranchKey) => {
    const b = byBranch.get(key);
    if (!b || !b.tended) return 0;
    return Math.min(1, 0.35 + b.seconds / 1200); // ~20 min approaches full
  };
  const shown = (key: BranchKey) => byBranch.get(key)?.tended || planned.includes(key);

  // The long season: fullness lends the whole plant vigour and height; days away let it sleep.
  const vigor = 0.82 + 0.18 * fullness; // lushness multiplier — today's leaf always reads, fullness adds to it
  const stemW = 2 + fullness * 1.8; // a faithful Vine has a thicker trunk
  const crownY = 40 - fullness * 8; // …and reaches higher
  const sleep = daysDormant == null ? 0 : Math.min(1, Math.max(0, (daysDormant - 2) / 5)); // awake ≤2d, asleep ~7d
  const wake = 1 - 0.5 * sleep; // a sleeping Vine is muted, waiting — never gone
  const droop = sleep * 5; // and settles gently downward

  const ink = "#2c2420";
  const terracotta = "#c4643d";
  const stone = "#8b6b5a";
  const leafColor = (key: BranchKey) =>
    byBranch.get(key)?.tended ? terracotta : stone;
  const halo = (key: BranchKey) => (key === active ? 1 : 0.75); // the branch abided now reads brightest

  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24 shrink-0" role="img" aria-label="the day's Vine">
      <g opacity={wake} transform={`translate(0 ${droop})`}>
        {/* Soil — the Confession branch: the ground darkens as it is turned. */}
        {shown("confession") && (
          <line
            x1="24"
            y1="104"
            x2="96"
            y2="104"
            stroke={leafColor("confession")}
            strokeWidth={2 + grow("confession") * 4 * vigor}
            strokeLinecap="round"
            opacity={byBranch.get("confession")?.tended ? 0.85 : 0.3}
          />
        )}
        {/* Roots — the Prayer branch: drinking deeper the longer it is tended. */}
        {shown("prayer") && (
          <g
            stroke={leafColor("prayer")}
            strokeWidth="1.5"
            fill="none"
            opacity={byBranch.get("prayer")?.tended ? 0.85 : 0.3}
            strokeLinecap="round"
          >
            <path d={`M60 104 C 52 ${108 + grow("prayer") * 8 * vigor}, 44 ${110 + grow("prayer") * 6 * vigor}, 40 ${112 + grow("prayer") * 8 * vigor}`} />
            <path d={`M60 104 C 68 ${108 + grow("prayer") * 8 * vigor}, 76 ${110 + grow("prayer") * 6 * vigor}, 80 ${112 + grow("prayer") * 8 * vigor}`} />
          </g>
        )}

        {/* The stem — always there, the one plant; taller and thicker as the Vine grows full. */}
        <path d={`M60 104 C 58 84, 62 66, 60 ${crownY}`} stroke={ink} strokeWidth={stemW} fill="none" strokeLinecap="round" />

        {/* Word — the leaves, reaching for the light (upper left). */}
        {shown("word") && (
          <g opacity={halo("word")}>
            <path d="M60 62 C 52 60, 44 56, 40 50" stroke={ink} strokeWidth="1.3" fill="none" />
            <ellipse
              cx="37"
              cy="48"
              rx={4 + grow("word") * 9 * vigor}
              ry={2.5 + grow("word") * 5 * vigor}
              transform="rotate(-32 37 48)"
              fill={leafColor("word")}
              opacity={byBranch.get("word")?.tended ? 0.9 : 0.3}
            />
          </g>
        )}

        {/* Freestyle — new growth, a bud at the crown (upper right). */}
        {shown("freestyle") && (
          <g opacity={halo("freestyle")}>
            <path d="M60 52 C 68 50, 76 46, 80 40" stroke={ink} strokeWidth="1.3" fill="none" />
            <circle
              cx="82"
              cy="38"
              r={3 + grow("freestyle") * 7 * vigor}
              fill={leafColor("freestyle")}
              opacity={byBranch.get("freestyle")?.tended ? 0.9 : 0.3}
            />
          </g>
        )}
      </g>
    </svg>
  );
}
