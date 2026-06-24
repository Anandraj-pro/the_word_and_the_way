import { useCallback, useEffect, useState } from "react";
import { api, type ReadingGoal, type ReadingHistory, type ReadingToday } from "../api";
import { ALL_BOOKS } from "../bibleBooks";
import { BibleReader } from "./BibleReader";

/** "Jun 23" — a quiet day label for the look-back, no year. */
function dayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * In the Word — the reading goal at the Desk. A book (or range) read at a chosen pace; the
 * passage itself opens in the book reader. Shows the next chapter, this period's pace, the
 * streak of periods kept, and a fold-away look-back over the week.
 */
export function DailyReading({ onComplete }: { onComplete: () => void }) {
  const [today, setToday] = useState<ReadingToday | null>(null);
  const [goal, setGoal] = useState<ReadingGoal | null>(null);
  const [reading, setReading] = useState(false);
  const [browsing, setBrowsing] = useState(false); // opened straight into the picker
  const [history, setHistory] = useState<ReadingHistory | null>(null);
  const [looking, setLooking] = useState(false); // the look-back is open
  const [editing, setEditing] = useState(false); // the goal form is open
  const [failed, setFailed] = useState(false); // today's reading couldn't be reached
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false); // setting the goal didn't take

  // Goal form fields.
  const [book, setBook] = useState("John");
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(21);
  const [paceCount, setPaceCount] = useState(1);
  const [paceUnit, setPaceUnit] = useState<"day" | "week">("day");

  const load = useCallback(async () => {
    // Today's reading gates the block; the goal is secondary, so its failure never hides it.
    try {
      setToday(await api.readingToday());
      setFailed(false);
    } catch {
      setFailed(true);
      return;
    }
    try {
      setGoal(await api.readingGoal());
    } catch {
      setGoal(null);
    }
  }, []);

  // The look-back is loaded lazily the first time it's opened, and refreshed on each read.
  const loadHistory = useCallback(async () => {
    try {
      setHistory(await api.readingHistory(7));
    } catch {
      setHistory(null);
    }
  }, []);

  const toggleLookBack = () => {
    const next = !looking;
    setLooking(next);
    if (next) loadHistory();
  };

  useEffect(() => {
    load();
  }, [load]);

  const onReaderComplete = () => {
    load(); // refresh the panel (progress, pace, streak)
    if (looking) loadHistory(); // keep the look-back current if it's open
    onComplete(); // refresh the room (the new Encounter)
  };

  const maxChapters = ALL_BOOKS.find((b) => b.name === book)?.chapters ?? 1;

  const onBook = (name: string) => {
    const chapters = ALL_BOOKS.find((b) => b.name === name)?.chapters ?? 1;
    setBook(name);
    setStart(1);
    setEnd(chapters); // a new book defaults to its whole span
  };

  const openGoalForm = () => {
    if (goal) {
      setBook(goal.book);
      setStart(goal.start_chapter);
      setEnd(goal.end_chapter);
      setPaceCount(goal.pace_count);
      setPaceUnit(goal.pace_unit);
    }
    setEditing(true);
  };

  const saveGoal = async () => {
    setSaving(true);
    setSaveError(false);
    try {
      await api.setReadingGoal({
        book,
        start_chapter: start,
        end_chapter: Math.max(start, end),
        pace_count: Math.max(1, paceCount),
        pace_unit: paceUnit,
      });
      setEditing(false);
      await load();
      if (looking) loadHistory();
    } catch {
      setSaveError(true); // route missing or backend down — keep the form open and say so
    } finally {
      setSaving(false);
    }
  };

  if (!today) {
    if (!failed) return null; // still loading — stay quiet
    return (
      <div className="py-2.5">
        <p className="text-[0.65rem] uppercase tracking-[0.25em] text-stone/70">In the Word</p>
        <p className="mt-0.5 font-serif text-sm italic text-stone">
          Couldn't reach today's reading.{" "}
          <button onClick={load} className="not-italic text-terracotta hover:text-terracotta-deep">
            try again
          </button>
        </p>
      </div>
    );
  }

  const goalComplete = today.status === "plan_complete";
  const periodWord = today.pace_unit === "week" ? "this week" : "today";

  return (
    <>
      <div className="py-2.5">
        {/* Heading — the station name, with the goal it's set toward and a way to change it. */}
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[0.65rem] uppercase tracking-[0.25em] text-stone/70">In the Word</p>
          <button
            onClick={() => (editing ? setEditing(false) : openGoalForm())}
            className="shrink-0 font-serif text-xs italic text-stone/60 transition-colors hover:text-terracotta-deep"
          >
            {goal ? `${goal.label} · ${today.pace_count}/${today.pace_unit}` : "set a goal"} ✎
          </button>
        </div>

        {editing ? (
          /* Set a reading goal — a book or chapter range, at a pace of so many per day/week. */
          <div className="mt-2 flex flex-col gap-2 rounded-sm bg-linen-deep/50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 font-serif text-sm text-ink">
              <span className="text-stone/70">Read</span>
              <select
                value={book}
                onChange={(e) => onBook(e.target.value)}
                className="rounded-sm border border-stone/30 bg-linen px-1.5 py-0.5 text-ink focus:border-terracotta focus:outline-none"
              >
                {ALL_BOOKS.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
              <span className="text-stone/70">ch</span>
              <select
                value={start}
                onChange={(e) => setStart(Number(e.target.value))}
                className="rounded-sm border border-stone/30 bg-linen px-1.5 py-0.5 text-ink focus:border-terracotta focus:outline-none"
              >
                {Array.from({ length: maxChapters }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-stone/70">to</span>
              <select
                value={Math.max(start, end)}
                onChange={(e) => setEnd(Number(e.target.value))}
                className="rounded-sm border border-stone/30 bg-linen px-1.5 py-0.5 text-ink focus:border-terracotta focus:outline-none"
              >
                {Array.from({ length: maxChapters }, (_, i) => i + 1)
                  .filter((n) => n >= start)
                  .map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 font-serif text-sm text-ink">
              <span className="text-stone/70">at</span>
              <input
                type="number"
                min={1}
                value={paceCount}
                onChange={(e) => setPaceCount(Number(e.target.value))}
                className="w-14 rounded-sm border border-stone/30 bg-linen px-1.5 py-0.5 text-ink focus:border-terracotta focus:outline-none"
              />
              <span className="text-stone/70">chapter{paceCount === 1 ? "" : "s"} per</span>
              <select
                value={paceUnit}
                onChange={(e) => setPaceUnit(e.target.value as "day" | "week")}
                className="rounded-sm border border-stone/30 bg-linen px-1.5 py-0.5 text-ink focus:border-terracotta focus:outline-none"
              >
                <option value="day">day</option>
                <option value="week">week</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveGoal}
                disabled={saving}
                className="self-start rounded-sm bg-terracotta px-3 py-1 font-serif text-xs text-linen hover:bg-terracotta-deep disabled:opacity-50"
              >
                {saving ? "Setting…" : "Set the goal"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-xs italic text-stone/60 hover:text-terracotta-deep"
              >
                cancel
              </button>
            </div>
            {saveError && (
              <p className="font-serif text-xs italic text-terracotta-deep">
                Couldn't set the goal — is the backend running the latest code?
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="mt-0.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-baseline gap-x-2 leading-tight">
                  <span className="font-display text-base text-terracotta-deep">
                    {today.reference}
                  </span>
                  {today.streak > 0 && (
                    <span className="text-xs not-italic text-terracotta">
                      ✦ {today.streak} {today.pace_unit === "week" ? "wk" : "d"}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs italic text-stone/70">
                  {today.completed}/{today.total} chapters · {today.read_this_period}/
                  {today.pace_count} {periodWord}
                </p>
              </div>
              <button
                onClick={() => setReading(true)}
                className="shrink-0 rounded-sm bg-terracotta px-3.5 py-1.5 font-serif text-xs text-linen transition-colors hover:bg-terracotta-deep"
              >
                {goalComplete ? "Read again" : "Open the book →"}
              </button>
            </div>

            <div className="mt-1 flex items-center justify-between gap-3">
              {goalComplete ? (
                <p className="font-serif text-xs italic text-stone">
                  ✓ You have read all of {today.goal_label}. Well done.
                </p>
              ) : today.pace_met ? (
                <p className="font-serif text-xs italic text-stone">
                  ✓ Pace kept {periodWord}.
                  {today.next_reference && ` Read on with ${today.next_reference}, or rest.`}
                </p>
              ) : (
                <span />
              )}
              <button
                onClick={() => setBrowsing(true)}
                className="shrink-0 font-serif text-xs italic text-stone/60 transition-colors hover:text-terracotta-deep"
              >
                or read freely →
              </button>
            </div>
          </>
        )}

        {/* The look-back — what was covered over the past week, quietly folded away. */}
        <button
          onClick={toggleLookBack}
          aria-expanded={looking}
          className="mt-2 flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-stone/55 transition-colors hover:text-terracotta-deep"
        >
          <span
            aria-hidden
            className={`transition-transform duration-300 ${looking ? "rotate-90" : ""}`}
          >
            ›
          </span>
          Recently read
        </button>

        {looking && (
          <div className="mt-1.5 border-l border-stone/20 pl-3">
            {history === null ? (
              <p className="font-serif text-xs italic text-stone/60">Looking back…</p>
            ) : history.entries.length === 0 ? (
              <p className="font-serif text-xs italic text-stone/60">
                Nothing kept in the last 7 days yet.
              </p>
            ) : (
              <>
                <ul className="flex flex-col gap-0.5">
                  {history.entries.map((e, i) => (
                    <li key={i} className="flex items-baseline gap-2.5 text-sm">
                      <span className="w-12 shrink-0 text-xs tabular-nums text-stone/55">
                        {dayLabel(e.completed_on)}
                      </span>
                      <span className="font-serif text-ink">{e.reference}</span>
                      {!e.on_plan && (
                        <span className="text-[0.6rem] uppercase tracking-wider text-stone/45">
                          free
                        </span>
                      )}
                      {e.became_encounter && (
                        <span className="text-xs text-terracotta/70" title="became an Encounter">
                          ✦
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 font-serif text-xs italic text-stone/55">
                  {history.days_read} {history.days_read === 1 ? "day" : "days"} ·{" "}
                  {history.chapters} {history.chapters === 1 ? "chapter" : "chapters"} this week
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {(reading || browsing) && today.reference && (
        <BibleReader
          initialReference={today.reference}
          todayReference={today.reference}
          readTodayRefs={today.read_today_refs}
          startPicking={browsing}
          onComplete={onReaderComplete}
          onClose={() => {
            setReading(false);
            setBrowsing(false);
          }}
        />
      )}
    </>
  );
}
