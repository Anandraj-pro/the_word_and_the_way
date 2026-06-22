import { CORNERSTONE_THRESHOLD, type Encounter } from "../api";

interface EncounterCardProps {
  e: Encounter;
  /** When provided, shows the carry control — the word's journey toward the Altar. */
  onCarry?: (id: number) => void;
}

/** One Encounter, rendered the same wherever it sits — only the stage context changes. */
export function EncounterCard({ e, onCarry }: EncounterCardProps) {
  const remaining = CORNERSTONE_THRESHOLD - e.carry_count;

  return (
    <article className="border-l-2 border-terracotta/60 pl-3">
      {e.scripture && (
        <p className="font-display text-lg leading-tight text-terracotta-deep">
          {e.scripture}
        </p>
      )}
      {e.scripture_text && (
        <p className="mt-1 font-serif text-[0.95rem] italic leading-snug text-ink/90">
          “{e.scripture_text}”
        </p>
      )}
      {e.words && (
        <p className="mt-1.5 font-serif text-sm leading-snug text-stone">{e.words}</p>
      )}

      {onCarry && (
        <div className="mt-2.5 flex items-center gap-3">
          {/* Pips fill as the word is carried season to season. */}
          <span className="flex items-center gap-1" aria-hidden>
            {Array.from({ length: CORNERSTONE_THRESHOLD }).map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i < e.carry_count ? "bg-terracotta" : "border border-stone/50"
                }`}
              />
            ))}
          </span>
          <button
            onClick={() => onCarry(e.id)}
            className="text-xs font-medium uppercase tracking-[0.15em] text-terracotta transition-colors hover:text-terracotta-deep"
          >
            Carry forward
          </button>
          <span className="text-xs italic text-stone">
            {remaining === 1
              ? "one more season to the Altar"
              : `${remaining} more seasons to the Altar`}
          </span>
        </div>
      )}
    </article>
  );
}
