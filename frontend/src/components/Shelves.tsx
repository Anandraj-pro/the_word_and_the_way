import { useState } from "react";
import type { Encounter, Season } from "../api";
import { EncounterCard } from "./EncounterCard";
import { Station } from "./Station";

interface ShelvesProps {
  seasons: Season[];
  /** Every Encounter the room holds; each spine opens to the ones it gathered. */
  encounters: Encounter[];
  /** The crossing ritual now lives on the Altar; pass these only where a trigger is wanted. */
  hasOpenSeason?: boolean;
  onBeginRitual?: () => void;
}

/** The Shelves — the Archive. Seasons are the spines; the only calendar the room knows. */
export function Shelves({ seasons, encounters, hasOpenSeason, onBeginRitual }: ShelvesProps) {
  // One spine stands open at a time — the season the Pastor has stepped back into.
  const [openId, setOpenId] = useState<number | null>(null);

  // The weight a spine carries — how many words the season held.
  const weight = (n: number) =>
    n === 0 ? "no words yet" : `${n} ${n === 1 ? "word" : "words"}`;

  return (
    <Station
      label="The Shelves"
      subtitle="Seasons"
      empty={seasons.length === 0}
      emptyWord="No seasons named yet."
    >
      <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
        {seasons.map((s) => {
          const open = openId === s.id;
          // The words gathered under this season's name — read here, carried at the Desk.
          const gathered = encounters.filter((e) => e.season_id === s.id);
          return (
            <div key={s.id}>
              <button
                onClick={() => setOpenId(open ? null : s.id)}
                aria-expanded={open}
                className={`flex w-full items-center gap-3 rounded-sm border-l-4 px-3 py-2 text-left transition-colors ${
                  s.is_open
                    ? "border-terracotta bg-linen-deep"
                    : "border-terracotta/40 bg-linen-deep/50 hover:bg-linen-deep/70"
                }`}
              >
                <span className="flex-1">
                  <span className="block font-display text-base leading-tight text-ink">
                    {s.name}
                  </span>
                  <span className="block text-xs italic text-stone">
                    {s.is_open ? "open · this season" : s.epitaph ?? "closed"}
                  </span>
                  <span className="mt-0.5 block text-[0.7rem] uppercase tracking-[0.15em] text-stone/55">
                    {weight(s.encounter_count)}
                  </span>
                </span>
                {s.opening_scripture && (
                  <span className="self-start text-xs uppercase tracking-wider text-terracotta">
                    {s.opening_scripture}
                  </span>
                )}
                <span
                  aria-hidden
                  className={`self-start text-stone/60 transition-transform duration-300 ${
                    open ? "rotate-90" : ""
                  }`}
                >
                  ›
                </span>
              </button>

              {/* The season opens in place — the words it gathered, read-only. */}
              {open && (
                <div className="flex flex-col gap-3 px-3 py-3">
                  {gathered.length === 0 ? (
                    <p className="font-serif text-sm italic text-stone/60">
                      No words gathered here yet.
                    </p>
                  ) : (
                    gathered.map((e) => <EncounterCard key={e.id} e={e} />)
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {onBeginRitual && (
        <button
          onClick={onBeginRitual}
          className="mt-auto w-full rounded-sm border border-dashed border-terracotta/50 py-2.5 font-serif text-sm text-terracotta transition-colors hover:border-terracotta hover:bg-terracotta/5"
        >
          {hasOpenSeason ? "✦ Cross into a new season" : "✦ Open the first season"}
        </button>
      )}
    </Station>
  );
}
