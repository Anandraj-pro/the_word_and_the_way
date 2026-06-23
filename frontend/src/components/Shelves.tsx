import type { Season } from "../api";
import { Station } from "./Station";

interface ShelvesProps {
  seasons: Season[];
  /** The crossing ritual now lives on the Altar; pass these only where a trigger is wanted. */
  hasOpenSeason?: boolean;
  onBeginRitual?: () => void;
}

/** The Shelves — the Archive. Seasons are the spines; the only calendar the room knows. */
export function Shelves({ seasons, hasOpenSeason, onBeginRitual }: ShelvesProps) {
  return (
    <Station
      label="The Shelves"
      subtitle="Seasons"
      empty={seasons.length === 0}
      emptyWord="No seasons named yet."
    >
      <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
        {seasons.map((s) => (
          <button
            key={s.id}
            className="group flex items-center gap-3 rounded-sm border-l-4 border-terracotta/70 bg-linen-deep/60 px-3 py-2 text-left transition-colors hover:bg-linen-deep"
          >
            <span className="flex-1">
              <span className="block font-display text-base leading-tight text-ink">
                {s.name}
              </span>
              <span className="block text-xs italic text-stone">
                {s.is_open ? "open" : s.epitaph ?? "closed"}
              </span>
            </span>
            {s.opening_scripture && (
              <span className="text-xs uppercase tracking-wider text-terracotta">
                {s.opening_scripture}
              </span>
            )}
          </button>
        ))}
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
