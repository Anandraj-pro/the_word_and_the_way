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
      <div className="grid gap-4 sm:grid-cols-2">
        {testimonies.map((t) => (
          <EncounterCard key={t.id} e={t} />
        ))}
      </div>
    </Station>
  );
}
