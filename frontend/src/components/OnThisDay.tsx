import type { Encounter } from "../api";

interface OnThisDayProps {
  /** Encounters received on this calendar day in years past (from the backend). */
  remembered: Encounter[];
}

/**
 * On This Day — the words God gave on this same date in years past. The one place a raw
 * `received_on` is surfaced: a gentle remembrance on entering, never the archive's ordering.
 */
export function OnThisDay({ remembered }: OnThisDayProps) {
  // Only words worth remembering — skip any encounter with nothing to show.
  const visible = remembered.filter((e) => e.scripture || e.scripture_text || e.words);
  if (visible.length === 0) return null;

  const thisYear = new Date().getFullYear();
  // The endpoint returns these unordered; show the most recent remembrance first.
  const ordered = [...visible].sort((a, b) =>
    b.received_on.localeCompare(a.received_on),
  );

  const yearsAgo = (receivedOn: string) => {
    const n = thisYear - Number(receivedOn.slice(0, 4)); // year only — tz-safe
    return n === 1 ? "a year ago today" : `${n} years ago today`;
  };

  return (
    <div className="mx-auto w-full max-w-2xl text-center">
      <p className="mb-2 text-[0.65rem] uppercase tracking-[0.3em] text-stone/60">
        On this day
      </p>
      <ul className="flex flex-col gap-3">
        {ordered.map((e) => {
          const line = e.scripture_text ?? e.words;
          return (
            <li key={e.id}>
              <span className="text-[0.7rem] uppercase tracking-[0.15em] text-terracotta/70">
                {yearsAgo(e.received_on)}
              </span>
              {e.scripture && (
                <span className="mt-0.5 block font-display text-base leading-tight text-linen">
                  {e.scripture}
                </span>
              )}
              {line && (
                <span className="mt-0.5 block truncate font-serif text-sm italic text-stone/80">
                  {line}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
