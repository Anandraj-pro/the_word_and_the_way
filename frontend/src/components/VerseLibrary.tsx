import { useState } from "react";
import type { Encounter } from "../api";
import { EncounterCard } from "./EncounterCard";

interface VerseLibraryProps {
  /** Verse-level Encounters, newest-first — the verses the Pastor has kept. */
  verses: Encounter[];
  onDelete: (id: number) => void | Promise<void>;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Format an ISO "YYYY-MM-DD" gently as "6 Jan 2026" — parsed by parts to avoid tz drift. */
function keptOn(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return y && m && d ? `${d} ${MONTHS[m - 1]} ${y}` : iso;
}

/** The Rhema Archive — every verse the Pastor has kept, gathered to return to. */
export function VerseLibrary({ verses, onDelete }: VerseLibraryProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  // Guards the removal so a double-click can't fire a second DELETE at a gone verse.
  const [removing, setRemoving] = useState(false);

  if (verses.length === 0) {
    return (
      <p className="px-3 py-2 font-serif text-sm italic text-stone/60">
        No verses kept yet.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
      {verses.map((v) => {
        const open = openId === v.id;
        return (
          <div key={v.id}>
            <button
              onClick={() => {
                setOpenId(open ? null : v.id);
                setConfirmingId(null);
              }}
              aria-expanded={open}
              className="flex w-full items-center gap-3 rounded-sm border-l-4 border-terracotta/40 bg-linen-deep/50 px-3 py-2 text-left transition-colors hover:bg-linen-deep/70"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-display text-base leading-tight text-terracotta-deep">
                  {v.scripture}
                </span>
                {v.scripture_text && (
                  <span className="block truncate font-serif text-xs italic text-stone">
                    {v.scripture_text}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-[0.7rem] uppercase tracking-[0.15em] text-stone/55">
                {keptOn(v.received_on)}
              </span>
            </button>

            {/* The verse opens to its full context — text, reflection, and when it was kept. */}
            {open && (
              <div className="flex flex-col gap-2 px-3 py-3">
                <EncounterCard e={v} />
                <p className="text-[0.7rem] uppercase tracking-[0.15em] text-stone/55">
                  Kept {keptOn(v.received_on)}
                </p>
                {confirmingId === v.id ? (
                  <p className="flex items-center gap-3 font-serif text-xs italic text-stone">
                    Remove this verse?
                    <button
                      disabled={removing}
                      onClick={async () => {
                        if (removing) return;
                        setRemoving(true);
                        try {
                          await onDelete(v.id);
                          // The room refresh drops this row; reset for whatever remains.
                          setConfirmingId(null);
                          setOpenId(null);
                        } catch {
                          // The verse was not removed — keep it, just close the prompt.
                          setConfirmingId(null);
                        } finally {
                          setRemoving(false);
                        }
                      }}
                      className="font-medium uppercase tracking-[0.15em] text-terracotta-deep transition-colors hover:text-terracotta disabled:opacity-50"
                    >
                      {removing ? "removing…" : "remove"}
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="text-stone/60 transition-colors hover:text-ink"
                    >
                      cancel
                    </button>
                  </p>
                ) : (
                  <button
                    onClick={() => setConfirmingId(v.id)}
                    className="self-start font-serif text-xs italic text-stone/50 transition-colors hover:text-terracotta-deep"
                  >
                    Remove from the library
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
