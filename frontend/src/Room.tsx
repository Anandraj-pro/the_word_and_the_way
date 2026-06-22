import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  type ConfessionSummary,
  type CrossResult,
  type Encounter,
  type Season,
} from "./api";
import { Altar } from "./components/Altar";
import { Desk } from "./components/Desk";
import { SeasonRitual } from "./components/SeasonRitual";
import { Shelves } from "./components/Shelves";
import { Wall } from "./components/Wall";
import { Window } from "./components/Window";

/**
 * The one room. Not a dashboard of pages — a single space the Pastor enters,
 * facing the Altar, with the Desk, Shelves, Wall, and Window framing it.
 */
export function Room() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [cornerstones, setCornerstones] = useState<Encounter[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [confessions, setConfessions] = useState<ConfessionSummary[]>([]);
  const [seed, setSeed] = useState<string>();
  const [error, setError] = useState<string>();
  const [inscribed, setInscribed] = useState<string>(); // flash when a word reaches the Altar
  const [ritualOpen, setRitualOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [enc, altar, sns, conf] = await Promise.all([
        api.encounters(),
        api.altar(),
        api.seasons(),
        api.confessions(),
      ]);
      setEncounters(enc);
      setCornerstones(altar);
      setSeasons(sns);
      setConfessions(conf);
      setError(undefined);
    } catch {
      setError("The room could not be opened — is the backend running on :8000?");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openSeason = seasons.find((s) => s.is_open);
  const openSeasonId = openSeason?.id ?? null;

  const flash = (scripture: string) => {
    setInscribed(scripture);
    setTimeout(() => setInscribed(undefined), 5000);
  };

  // The same Encounter list, sorted to its station. The Desk holds the open season's
  // words still on their way — received/reflecting and not yet a cornerstone.
  const deskActive = useMemo(
    () =>
      encounters.filter(
        (e) =>
          (e.stage === "received" || e.stage === "reflecting") &&
          !e.is_cornerstone &&
          e.season_id === openSeasonId,
      ),
    [encounters, openSeasonId],
  );
  const declarations = useMemo(
    () => encounters.filter((e) => e.stage === "declared"),
    [encounters],
  );
  const testimonies = useMemo(
    () => encounters.filter((e) => e.stage === "witnessed"),
    [encounters],
  );

  const receive = async (scripture: string, words: string) => {
    await api.createEncounter({
      scripture: scripture || null,
      words: words || null,
      stage: "received",
      season_id: openSeasonId,
    });
    setSeed(undefined);
    load();
  };

  const carry = async (id: number) => {
    const carried = await api.carry(id);
    if (carried.is_cornerstone) {
      // It just crossed the threshold — it leaves the Desk and settles on the Altar.
      flash(carried.scripture ?? "A promise");
    }
    load();
  };

  const completeRitual = (result?: CrossResult) => {
    setRitualOpen(false);
    // A word the crossing pushed past the threshold is inscribed on the Altar.
    const first = result?.inscribed?.[0];
    if (first) flash(first.scripture ?? "A promise");
    load();
  };

  return (
    <div className="min-h-full bg-ink">
      {/* Inscription toast — fixed, so a word reaching the Altar is seen from any station. */}
      {inscribed && (
        <div className="settle fixed inset-x-0 top-4 z-50 flex justify-center px-4">
          <p className="rounded-sm border border-terracotta/50 bg-ink/95 px-5 py-2.5 text-center font-serif text-sm text-linen shadow-lg shadow-black/30">
            ✦ {inscribed} is now inscribed on the Altar — carried through three seasons.
          </p>
        </div>
      )}
      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6">
        {error && (
          <p className="rounded-sm bg-terracotta-deep px-4 py-2 text-center text-sm text-linen">
            {error}
          </p>
        )}

        {/* The wall you face on entry. */}
        <Altar cornerstones={cornerstones} onThreshold={setSeed} />

        {/* The working band: Shelves · Desk · Wall. */}
        <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr_1fr]">
          <Shelves
            seasons={seasons}
            hasOpenSeason={openSeasonId !== null}
            onBeginRitual={() => setRitualOpen(true)}
          />
          <Desk active={deskActive} seed={seed} onReceive={receive} onCarry={carry} />
          <Wall declarations={declarations} confessions={confessions} />
        </div>

        {/* The view outward. */}
        <Window testimonies={testimonies} />

        <p className="pt-2 text-center text-xs uppercase tracking-[0.3em] text-stone/60">
          The Word and the Way
        </p>
      </main>

      <SeasonRitual
        open={ritualOpen}
        hasOpenSeason={openSeasonId !== null}
        closingName={openSeason?.name}
        candidates={deskActive}
        onClose={() => setRitualOpen(false)}
        onComplete={completeRitual}
      />
    </div>
  );
}
