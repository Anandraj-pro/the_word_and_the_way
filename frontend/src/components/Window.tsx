import type { Encounter } from "../api";
import { Station } from "./Station";
import { EncounterCard } from "./EncounterCard";

/** The Window — Witness. Testimonies God kept; yours first, then the world (later). */
export function Window({ testimonies }: { testimonies: Encounter[] }) {
  return (
    <Station
      label="The Window"
      subtitle="Witness"
      empty={testimonies.length === 0}
      emptyWord="No testimony has been recorded yet."
    >
      {/* Soft daylight falling through the glass. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-terracotta/8 to-transparent"
      />
      <div
        className={`relative gap-4 ${
          testimonies.length > 1 ? "grid sm:grid-cols-2" : "flex justify-center"
        }`}
      >
        {testimonies.map((t) => (
          <div
            key={t.id}
            className="w-full rounded-sm bg-linen-deep/45 p-4 transition-colors hover:bg-linen-deep/70"
          >
            <EncounterCard e={t} />
          </div>
        ))}
      </div>
    </Station>
  );
}
