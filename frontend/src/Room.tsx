import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  type ConfessionSummary,
  type CrossResult,
  type Encounter,
  type PrayerToday,
  type ReadingToday,
  type Season,
} from "./api";
import { Altar } from "./components/Altar";
import { Desk } from "./components/Desk";
import { SeasonRitual } from "./components/SeasonRitual";
import { Shelves } from "./components/Shelves";
import { Wall } from "./components/Wall";
import { Window } from "./components/Window";
import { RoomAccordion, RoomThreshold } from "./components/ui/interactive-image-accordion";
import { Reveal } from "./components/Reveal";
import { RoomTour } from "./components/RoomTour";

// Set once the first walk through the room has been taken (or skipped).
const TOUR_SEEN_KEY = "tww.tour.v1";

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
  const [entered, setEntered] = useState(false); // false = standing at the threshold (full hero)
  const [activeStations, setActiveStations] = useState<ReadonlySet<string>>(new Set()); // which station ids are in view
  const [readingToday, setReadingToday] = useState<ReadingToday | null>(null); // dashboard progress
  const [prayerToday, setPrayerToday] = useState<PrayerToday | null>(null);
  const [tourOpen, setTourOpen] = useState(false); // the first walk through the room

  // First visit: take the walk once, then remember it was taken.
  useEffect(() => {
    if (!localStorage.getItem(TOUR_SEEN_KEY)) setTourOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setTourOpen(false);
    localStorage.setItem(TOUR_SEEN_KEY, "seen");
  }, []);

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
    // Progress for the Altar dashboard — non-critical, so failures don't close the room.
    api.readingToday().then(setReadingToday).catch(() => setReadingToday(null));
    api.prayerToday().then(setPrayerToday).catch(() => setPrayerToday(null));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Track which station the Pastor is standing in, to light it on the threshold bar.
  // The Shelves·Desk·Wall band shares a row, so several can be "here" at once.
  useEffect(() => {
    if (!entered) return;
    const ids = [
      "station-altar",
      "station-shelves",
      "station-desk",
      "station-wall",
      "station-window",
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        setActiveStations((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            if (entry.isIntersecting) next.add(entry.target.id);
            else next.delete(entry.target.id);
          }
          return next;
        });
      },
      // Active zone: just below the sticky bar, down to the upper-middle of the view.
      { rootMargin: "-56px 0px -45% 0px", threshold: 0.01 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [entered]);

  const openSeason = seasons.find((s) => s.is_open);
  const openSeasonId = openSeason?.id ?? null;

  const flash = (scripture: string) => {
    setInscribed(scripture);
    setTimeout(() => setInscribed(undefined), 5000);
  };

  // Crossing the room from the entry hero to a station.
  const goToStation = (anchor: string) => {
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Step through the threshold: the hero collapses to the slim bar, then we walk to the station.
  const enterRoom = (anchor: string) => {
    setEntered(true);
    setTimeout(() => goToStation(anchor), 80); // let the slim bar mount before scrolling
  };

  // Step back out: re-open the full entrance and return to the top.
  const reopenThreshold = () => {
    setEntered(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
  // Every word still on its way to the Altar, across all seasons — the dashboard count.
  const wordsInFlight = useMemo(
    () =>
      encounters.filter(
        (e) => (e.stage === "received" || e.stage === "reflecting") && !e.is_cornerstone,
      ).length,
    [encounters],
  );

  const receive = async (scripture: string, words: string, scriptureText?: string) => {
    await api.createEncounter({
      scripture: scripture || null,
      scripture_text: scriptureText || null,
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
      {/* Once entered, the threshold collapses to a slim, sticky bar of quick-nav. */}
      {entered && (
        <RoomThreshold
          onGo={goToStation}
          onReopen={reopenThreshold}
          active={activeStations}
        />
      )}

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10">
        {error && (
          <p className="rounded-sm bg-terracotta-deep px-4 py-2 text-center text-sm text-linen">
            {error}
          </p>
        )}

        {/* The threshold — the full entrance hero, shown until you step into the room. */}
        {!entered && <RoomAccordion onEnter={enterRoom} onTour={() => setTourOpen(true)} />}

        {/* Home — the Altar you face: progress, cornerstones, and the season's crossing. */}
        <Reveal id="station-altar" className="scroll-mt-24">
          <Altar
            cornerstones={cornerstones}
            onThreshold={setSeed}
            wordsInFlight={wordsInFlight}
            season={openSeason}
            hasOpenSeason={openSeasonId !== null}
            onBeginRitual={() => setRitualOpen(true)}
            reading={readingToday ?? undefined}
            watch={prayerToday ?? undefined}
          />
        </Reveal>

        {/* The two stations you work in: the Desk (primary) and the Wall (second). */}
        <div className="grid items-stretch gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Reveal id="station-desk" className="h-full scroll-mt-24" delay={0}>
            <Desk
              active={deskActive}
              seed={seed}
              onReceive={receive}
              onCarry={carry}
              onReadingComplete={load}
            />
          </Reveal>
          <Reveal id="station-wall" className="h-full scroll-mt-24" delay={120}>
            <Wall
              declarations={declarations}
              confessions={confessions}
              cornerstones={cornerstones}
            />
          </Reveal>
        </div>

        {/* The Shelves surface only when words are on their way — the season they're joining. */}
        {deskActive.length > 0 && (
          <Reveal id="station-shelves" className="mx-auto w-full max-w-3xl scroll-mt-24">
            <p className="mb-2 text-center text-[0.65rem] uppercase tracking-[0.3em] text-stone/60">
              Where these words are gathering
            </p>
            <Shelves seasons={seasons} />
          </Reveal>
        )}

        {/* The Window opens only when there is testimony to encourage by. */}
        {testimonies.length > 0 && (
          <Reveal id="station-window" className="mx-auto w-full max-w-3xl scroll-mt-24">
            <Window testimonies={testimonies} />
          </Reveal>
        )}

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

      {/* The first walk through the room — once on arrival, re-openable from the entrance. */}
      {tourOpen && (
        <RoomTour
          hasShelves={deskActive.length > 0}
          hasWindow={testimonies.length > 0}
          onRequestEnter={() => setEntered(true)}
          onClose={closeTour}
        />
      )}
    </div>
  );
}
