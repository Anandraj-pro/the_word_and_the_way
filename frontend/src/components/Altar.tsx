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
    <section className="rounded-sm bg-ink px-8 py-10 shadow-inner">
      <p className="text-center text-xs uppercase tracking-[0.35em] text-stone">
        The Altar of Remembrance
      </p>

      <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-6">
        {cornerstones.length === 0 ? (
          <p className="py-6 text-center text-sm italic text-stone">
            No stones are set yet. Carry a word through three seasons and it is inscribed here.
          </p>
        ) : (
          cornerstones.map((c) => (
            <div key={c.id} className="settle text-center">
              <p
                className={`font-display text-2xl leading-snug tracking-wide ${depth(
                  c.carry_count,
                )}`}
              >
                {c.scripture_text ? `“${c.scripture_text}”` : c.scripture}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.25em] text-terracotta">
                {c.scripture} · carried {c.carry_count}×
              </p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={submit} className="mx-auto mt-12 max-w-xl">
        <label className="block text-center font-serif text-lg text-linen/80">
          What are you bringing to God today?
        </label>
        <input
          value={bringing}
          onChange={(e) => setBringing(e.target.value)}
          placeholder="Speak it…"
          className="mt-3 w-full border-b border-stone/50 bg-transparent pb-2 text-center font-serif text-lg text-linen placeholder:text-stone/60 focus:border-terracotta focus:outline-none"
        />
      </form>
    </section>
  );
}
