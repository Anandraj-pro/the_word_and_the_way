import { useCallback, useEffect, useState } from "react";
import { api, type ReadingToday } from "../api";
import { BibleReader } from "./BibleReader";

/**
 * Today's reading — a compact entry at the Desk. The passage itself opens in the book
 * reader (so it doesn't crowd the Desk); your response there becomes today's Encounter.
 */
export function DailyReading({ onComplete }: { onComplete: () => void }) {
  const [today, setToday] = useState<ReadingToday | null>(null);
  const [reading, setReading] = useState(false);
  const [browsing, setBrowsing] = useState(false); // opened straight into the picker

  const load = useCallback(async () => {
    try {
      setToday(await api.readingToday());
    } catch {
      setToday(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onReaderComplete = () => {
    load(); // refresh the panel (streak, done state)
    onComplete(); // refresh the room (the new Encounter)
  };

  if (!today) return null;

  if (today.status === "plan_complete" || today.reference === null) {
    return (
      <div className="py-2.5">
        <p className="text-[0.65rem] uppercase tracking-[0.25em] text-stone/70">In the Word</p>
        <p className="mt-0.5 font-serif text-sm italic text-stone">
          You have read the whole plan. Well done, good and faithful servant.
        </p>
      </div>
    );
  }

  const done = today.status === "done_today";

  return (
    <>
      <div className="py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.65rem] uppercase tracking-[0.25em] text-stone/70">In the Word</p>
            <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 leading-tight">
              <span className="font-display text-base text-terracotta-deep">{today.reference}</span>
              <span className="text-xs italic text-stone/70">
                Day {today.day_index}/{today.total}
              </span>
              {today.streak > 0 && (
                <span className="text-xs not-italic text-terracotta">✦ {today.streak}</span>
              )}
            </p>
          </div>
          <button
            onClick={() => setReading(true)}
            className="shrink-0 rounded-sm bg-terracotta px-3.5 py-1.5 font-serif text-xs text-linen transition-colors hover:bg-terracotta-deep"
          >
            {done ? "Read again" : "Open the book →"}
          </button>
        </div>

        <div className="mt-1 flex items-center justify-between gap-3">
          {done ? (
            <p className="font-serif text-xs italic text-stone">
              ✓ Read today.{today.next_reference && ` Tomorrow: ${today.next_reference}.`}
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
      </div>

      {(reading || browsing) && (
        <BibleReader
          initialReference={today.reference}
          todayReference={today.reference}
          alreadyReadToday={done}
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
