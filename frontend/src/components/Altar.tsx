import { useState, type ReactNode } from "react";
import type { Encounter, Season } from "../api";
import { WitnessForm } from "./WitnessForm";

interface AltarProps {
  cornerstones: Encounter[];
  onThreshold: (bringing: string) => void;
  /** Progress shown on the home dashboard. */
  wordsInFlight: number;
  season?: Season;
  hasOpenSeason: boolean;
  onBeginRitual: () => void;
  reading?: { streak: number };
  watch?: { streak: number };
  /** When provided, a carried promise can be witnessed — "God kept it." */
  onWitness?: (id: number, words: string) => void | Promise<void>;
  /** Walk to the Desk — where the counted things actually live. */
  onGoToDesk?: () => void;
}

/** One figure on the dashboard — a number, what it counts, and where it leads. */
function Stat({
  value,
  label,
  hint,
  onGo,
}: {
  value: ReactNode;
  label: string;
  /** One plain clause carrying the term's meaning, shown under the figure. */
  hint: string;
  onGo?: () => void;
}) {
  const figure = (
    <>
      <div className="font-display text-2xl leading-none text-linen">{value}</div>
      <div className="mt-1.5 text-[0.6rem] uppercase tracking-[0.25em] text-stone">{label}</div>
      <div className="mt-1 font-serif text-[0.68rem] italic leading-snug text-stone/70">{hint}</div>
    </>
  );
  if (!onGo) return <div className="w-32 text-center">{figure}</div>;
  return (
    <button
      type="button"
      onClick={onGo}
      className="group w-32 rounded-sm px-1 py-1 text-center transition-colors hover:bg-linen/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
    >
      {figure}
      <span className="mt-0.5 block text-[0.6rem] uppercase tracking-[0.2em] text-terracotta opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        to the Desk ↓
      </span>
    </button>
  );
}

/**
 * The Altar of Remembrance — home, and the wall the Pastor faces on entry.
 * A quiet dashboard of progress sits above the cornerstones (words carried through
 * three seasons, inscribed in stone). The threshold line lives here too.
 */
export function Altar({
  cornerstones,
  onThreshold,
  wordsInFlight,
  season,
  hasOpenSeason,
  onBeginRitual,
  reading,
  watch,
  onWitness,
  onGoToDesk,
}: AltarProps) {
  const [bringing, setBringing] = useState("");

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!bringing.trim()) return;
    onThreshold(bringing.trim());
    setBringing("");
  };

  // Deeper carry → darker, deeper-cut inscription.
  const depth = (count: number) => {
    if (count >= 5) return "text-linen";
    if (count >= 4) return "text-linen/85";
    return "text-linen/70";
  };

  return (
    <section className="relative overflow-hidden rounded-sm border border-stone/15 bg-gradient-to-b from-[#3b3029] to-ink px-6 py-12 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)] sm:px-12 sm:py-16">
      {/* Light falling from above onto the stone. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-terracotta/50 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-6rem] h-72 w-[44rem] max-w-[120%] -translate-x-1/2 rounded-full bg-terracotta/10 blur-[80px]"
      />

      <p className="relative text-center text-[0.7rem] uppercase tracking-[0.42em] text-stone">
        The Altar of Remembrance
      </p>

      {/* The dashboard — progress at a glance; every figure is a door. */}
      <div className="relative mx-auto mt-9 flex max-w-4xl flex-wrap items-start justify-center gap-x-6 gap-y-4">
        <Stat
          value={cornerstones.length}
          label="inscribed"
          hint="promises set in stone below"
        />
        <Stat
          value={wordsInFlight}
          label="carrying"
          hint="words on their way, at the Desk"
          onGo={onGoToDesk}
        />
        {reading && (
          <Stat
            value={`✦ ${reading.streak}`}
            label="in the word"
            hint="days reading, kept at the Desk"
            onGo={onGoToDesk}
          />
        )}
        {watch && (
          <Stat
            value={`✦ ${watch.streak}`}
            label="on watch"
            hint="days praying the watch"
            onGo={onGoToDesk}
          />
        )}
      </div>

      {/* The season, and the crossing into the next. */}
      <div className="relative mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 text-sm">
        <span className="font-serif text-stone">
          {season ? (
            <>
              Season · <span className="text-linen/85">{season.name}</span>{" "}
              <span className="ml-0.5 text-[0.65rem] uppercase tracking-[0.2em] text-terracotta/80">
                {season.is_open ? "open" : "closed"}
              </span>
            </>
          ) : (
            <span className="italic text-stone/70">No season open yet</span>
          )}
        </span>
        <button
          onClick={onBeginRitual}
          className="rounded-sm border border-terracotta/40 px-3 py-1 font-serif text-xs text-terracotta transition-colors hover:border-terracotta hover:bg-terracotta/10"
        >
          {hasOpenSeason ? "✦ Cross into a new season" : "✦ Open the first season"}
        </button>
      </div>

      {/* The cornerstones — the heart of the room. */}
      <div className="relative mx-auto mt-12 flex max-w-4xl flex-col items-center gap-8">
        {cornerstones.length === 0 ? (
          <p className="py-2 text-center font-serif text-base italic leading-relaxed text-stone">
            No stones are set yet. Carry a word through three seasons<br className="hidden sm:block" />
            and it is inscribed here.
          </p>
        ) : (
          <>
          <p className="-mb-3 text-center font-serif text-xs italic text-stone/70">
            Words carried through three seasons, set in stone.
          </p>
          {cornerstones.map((c) => (
            <div key={c.id} className="settle text-center">
              <p
                className={`font-display text-[1.7rem] leading-snug tracking-wide sm:text-[2.1rem] ${depth(
                  c.carry_count,
                )}`}
              >
                {c.scripture_text ? `“${c.scripture_text}”` : c.scripture}
              </p>
              <p className="mt-2.5 text-[0.65rem] uppercase tracking-[0.3em] text-terracotta">
                {c.scripture} · carried {c.carry_count}×
              </p>
              {/* A carried promise God kept stays inscribed here, and rests in the Window. */}
              {c.stage === "witnessed" ? (
                <p className="mt-2 text-[0.6rem] uppercase tracking-[0.35em] text-terracotta/90">
                  ✦ Kept — witnessed in the Window
                </p>
              ) : (
                onWitness && (
                  <div className="mt-2.5 mx-auto max-w-sm text-left">
                    <WitnessForm
                      tone="onInk"
                      initial={c.words ?? ""}
                      onWitness={(words) => onWitness(c.id, words)}
                    />
                  </div>
                )
              )}
            </div>
          ))}
          </>
        )}
      </div>

      {/* The carved line that turns the room toward you. */}
      <div aria-hidden className="relative mx-auto mt-14 flex max-w-xs items-center gap-3 text-terracotta/50">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-terracotta/30" />
        <span className="text-xs">✦</span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-terracotta/30" />
      </div>

      <form onSubmit={submit} className="relative mx-auto mt-8 max-w-xl">
        <label htmlFor="threshold-line" className="block text-center font-serif text-lg text-linen/80">
          What are you bringing to God today?
        </label>
        <input
          id="threshold-line"
          value={bringing}
          onChange={(e) => setBringing(e.target.value)}
          placeholder="Speak it…"
          className="mt-4 w-full border-b border-stone/40 bg-transparent pb-2.5 text-center font-serif text-xl text-linen placeholder:text-stone/55 focus:border-terracotta focus:outline-none"
        />
        <div className="mt-3.5 flex flex-col items-center gap-1.5">
          <button
            type="submit"
            disabled={!bringing.trim()}
            className="rounded-sm border border-terracotta/50 px-4 py-1.5 font-serif text-sm text-terracotta transition-colors hover:border-terracotta hover:bg-terracotta/10 disabled:opacity-0 disabled:pointer-events-none"
          >
            Lay it down ↓
          </button>
          <p className="font-serif text-xs italic text-stone/70">
            It becomes the open page at the Desk, ready to receive.
          </p>
        </div>
      </form>
    </section>
  );
}
