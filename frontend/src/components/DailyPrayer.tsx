import { useCallback, useEffect, useState } from "react";
import { api, type PrayerToday } from "../api";

/**
 * The Watch — the daily prayer tracker at the Desk. Check off each focus as you pray it;
 * consecutive days build the streak. Standard foci (church, pastors, kingdom) are seeded;
 * personal ones the Pastor adds.
 */
export function DailyPrayer() {
  const [watch, setWatch] = useState<PrayerToday | null>(null);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [scripture, setScripture] = useState("");
  const [manualOpen, setManualOpen] = useState<boolean | null>(null); // null = follow default

  const load = useCallback(async () => {
    try {
      setWatch(await api.prayerToday());
    } catch {
      setWatch(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!watch) return null;

  // Open while there's still praying to do; settle closed once the watch is kept.
  const open = manualOpen ?? watch.prayed_today < watch.total;

  const toggle = async (id: number) => setWatch(await api.togglePrayer(id));
  const remove = async (id: number) => setWatch(await api.removePrayerFocus(id));

  const submitFocus = async () => {
    if (!label.trim()) return;
    setWatch(await api.addPrayerFocus(label.trim(), scripture.trim() || undefined));
    setLabel("");
    setScripture("");
    setAdding(false);
  };

  return (
    <div className="py-2.5">
      <button
        onClick={() => setManualOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-baseline gap-2">
          <span className="text-[0.65rem] uppercase tracking-[0.25em] text-stone/70">The Watch</span>
          {watch.streak > 0 && (
            <span className="text-xs text-terracotta">
              ✦ {watch.streak} {watch.streak === 1 ? "day" : "days"} on watch
            </span>
          )}
        </span>
        <span className="flex items-center gap-2 text-xs italic text-stone/70">
          {watch.prayed_today}/{watch.total} prayed
          <span
            aria-hidden
            className={`text-stone/60 transition-transform duration-300 ${open ? "rotate-90" : ""}`}
          >
            ›
          </span>
        </span>
      </button>

      {open && (
        <>
          <ul className="mt-2 flex flex-col">
        {watch.focuses.map((f) => (
          <li key={f.id} className="group flex items-center gap-2.5 py-1">
            <button
              onClick={() => toggle(f.id)}
              aria-label={f.prayed_today ? "Prayed" : "Mark prayed"}
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors ${
                f.prayed_today
                  ? "border-terracotta bg-terracotta text-linen"
                  : "border-stone/50 hover:border-terracotta"
              }`}
            >
              {f.prayed_today ? "✓" : ""}
            </button>
            <button
              onClick={() => toggle(f.id)}
              className="flex-1 text-left"
            >
              <span
                className={`font-serif text-sm leading-tight ${
                  f.prayed_today ? "italic text-stone" : "text-ink"
                }`}
              >
                {f.label}
              </span>
              {f.scripture && (
                <span className="ml-2 text-xs uppercase tracking-wider text-terracotta/70">
                  {f.scripture}
                </span>
              )}
            </button>
            {f.kind === "personal" && (
              <button
                onClick={() => remove(f.id)}
                aria-label="Remove focus"
                className="shrink-0 text-xs text-stone/40 opacity-0 transition-opacity hover:text-terracotta-deep group-hover:opacity-100"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="mt-2 flex flex-col gap-1.5">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="A person or burden to carry…"
            autoFocus
            className="border-b border-stone/30 bg-transparent pb-1 font-serif text-sm text-ink placeholder:text-stone/55 focus:border-terracotta focus:outline-none"
          />
          <input
            value={scripture}
            onChange={(e) => setScripture(e.target.value)}
            placeholder="A verse to pray over it, optional…"
            className="border-b border-stone/30 bg-transparent pb-1 font-serif text-xs text-stone placeholder:text-stone/45 focus:border-terracotta focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={submitFocus}
              className="self-start rounded-sm bg-terracotta px-3 py-1 font-serif text-xs text-linen hover:bg-terracotta-deep"
            >
              Add to the watch
            </button>
            <button
              onClick={() => setAdding(false)}
              className="text-xs italic text-stone/60 hover:text-terracotta-deep"
            >
              cancel
            </button>
          </div>
        </div>
      ) : (
            <button
              onClick={() => setAdding(true)}
              className="mt-1.5 text-xs italic text-stone/60 transition-colors hover:text-terracotta-deep"
            >
              + add a focus
            </button>
          )}
        </>
      )}
    </div>
  );
}
