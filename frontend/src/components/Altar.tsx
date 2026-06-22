import { useState } from "react";
import type { Encounter } from "../api";

interface AltarProps {
  cornerstones: Encounter[];
  onThreshold: (bringing: string) => void;
}

/**
 * The Altar of Remembrance — the wall the Pastor faces on entry.
 * Cornerstone promises inscribed in stone; most-carried sit deepest and darkest.
 * The threshold line lives here: "What are you bringing to God today?"
 */
export function Altar({ cornerstones, onThreshold }: AltarProps) {
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
    <section className="relative overflow-hidden rounded-sm border border-stone/15 bg-gradient-to-b from-[#3b3029] to-ink px-6 py-14 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)] sm:px-12 sm:py-20">
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

      <div className="relative mx-auto mt-10 flex max-w-3xl flex-col items-center gap-8">
        {cornerstones.length === 0 ? (
          <p className="py-6 text-center font-serif text-base italic leading-relaxed text-stone">
            No stones are set yet. Carry a word through three seasons<br className="hidden sm:block" />
            and it is inscribed here.
          </p>
        ) : (
          cornerstones.map((c) => (
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
            </div>
          ))
        )}
      </div>

      {/* The carved line that turns the room toward you. */}
      <div aria-hidden className="relative mx-auto mt-14 flex max-w-xs items-center gap-3 text-terracotta/50">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-terracotta/30" />
        <span className="text-xs">✦</span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-terracotta/30" />
      </div>

      <form onSubmit={submit} className="relative mx-auto mt-8 max-w-xl">
        <label className="block text-center font-serif text-lg text-linen/80">
          What are you bringing to God today?
        </label>
        <input
          value={bringing}
          onChange={(e) => setBringing(e.target.value)}
          placeholder="Speak it…"
          className="mt-4 w-full border-b border-stone/40 bg-transparent pb-2.5 text-center font-serif text-xl text-linen placeholder:text-stone/55 focus:border-terracotta focus:outline-none"
        />
      </form>
    </section>
  );
}
