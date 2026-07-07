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
import { OnThisDay } from "./components/OnThisDay";
import { SeasonRitual } from "./components/SeasonRitual";
import { Shelves } from "./components/Shelves";
import { Wall } from "./components/Wall";
import { Window } from "./components/Window";
import {
  RoomAccordion,
  RoomThreshold,
  StationBar,
} from "./components/ui/interactive-image-accordion";
import { Reveal } from "./components/Reveal";
import { RoomTour } from "./components/RoomTour";

// Set once the first walk through the room has been taken (or skipped).
const TOUR_SEEN_KEY = "tww.tour.v1";
// Set once the threshold has been crossed — a returning visitor lands inside.
const ENTERED_KEY = "tww.entered.v1";

// The room's fixed geography, in the order you meet it walking in.
const STATION_ANCHORS = [
  "station-altar",
  "station-desk",
  "station-shelves",
  "station-wall",
  "station-window",
] as const;

/**
 * The one room. Not a dashboard of pages — a single space the Pastor enters,
 * facing the Altar, with the Desk, Wall, Shelves, and Window down one scroll.
 * Every station is always present; the empty ones sit dim, never absent.
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
  // The full hero shows only until the threshold is first crossed.
  const [entered, setEntered] = useState(() => localStorage.getItem(ENTERED_KEY) !== null);
  const [activeStation, setActiveStation] = useState("station-altar"); // the station nearest in view
  const [readingToday, setReadingToday] = useState<ReadingToday | null>(null); // dashboard progress
  const [prayerToday, setPrayerToday] = useState<PrayerToday | null>(null);
  const [onThisDay, setOnThisDay] = useState<Encounter[]>([]); // words received on this date in years past
  const [tourOpen, setTourOpen] = useState(false); // the first walk through the room

  // First visit: take the walk once, then remember it was taken.
  useEffect(() => {
    if (!localStorage.getItem(TOUR_SEEN_KEY)) setTourOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setTourOpen(false);
    localStorage.setItem(TOUR_SEEN_KEY, "seen");
  }, []);

  // Crossing the threshold, remembered — a returning visitor lands inside.
  const markEntered = useCallback(() => {
    setEntered(true);
    localStorage.setItem(ENTERED_KEY, "yes");
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
    // A gentle remembrance of words received on this date in years past — also non-critical.
    api.onThisDay().then(setOnThisDay).catch(() => setOnThisDay([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The bar's light follows you down the room — the station nearest the eye stays lit.
  useEffect(() => {
    if (!entered) return;
    const els = STATION_ANCHORS.map((a) => document.getElementById(a)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveStation(entry.target.id);
        }
      },
      // A band across the upper middle of the viewport — the place you're "standing".
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [entered]);

  const openSeason = seasons.find((s) => s.is_open);
  const openSeasonId = openSeason?.id ?? null;

  const flash = (scripture: string) => {
    setInscribed(scripture);
    setTimeout(() => setInscribed(undefined), 5000);
  };

  // Turn toward a station — one smooth walk down the room, never a page swap.
  const goToStation = (anchor: string) => {
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Step through the threshold: the hero gives way to the room, facing the chosen station.
  const enterRoom = (anchor: string) => {
    markEntered();
    // Wait a beat for the stations to mount before walking to one.
    requestAnimationFrame(() => goToStation(anchor));
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

  // Witness — "God kept it." A Desk word moves to the Window; a carried promise on
  // the Altar stays inscribed and also rests in the Window. Reuses PATCH via the wrapper.
  const witness = async (id: number, words: string) => {
    await api.witnessEncounter(id, words);
    await load();
  };

  const completeRitual = (result?: CrossResult) => {
    setRitualOpen(false);
    // A word the crossing pushed past the threshold is inscribed on the Altar.
    const first = result?.inscribed?.[0];
    if (first) flash(first.scripture ?? "A promise");
    load();
  };

  // What is brought to God at the Altar becomes the open page at the Desk.
  const bringToDesk = (bringing: string) => {
    setSeed(bringing);
    goToStation("station-desk");
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

      {/* The bars — ceiling on wide screens, floor under the thumb in hand. */}
      {entered && (
        <>
          <RoomThreshold
            onGo={goToStation}
            onHome={() => goToStation("station-altar")}
            onTour={() => setTourOpen(true)}
            active={new Set([activeStation])}
          />
          <StationBar onGo={goToStation} active={new Set([activeStation])} />
        </>
      )}

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 pb-24 sm:gap-8 sm:px-6 sm:py-10 sm:pb-10">
        {error && (
          <p className="rounded-sm bg-terracotta-deep px-4 py-2 text-center text-sm text-linen">
            {error}
          </p>
        )}

        {/* The threshold — the full entrance hero, only until first crossed. */}
        {!entered && <RoomAccordion onEnter={enterRoom} onTour={() => setTourOpen(true)} />}

        {/* The room — every station down one scroll, framing the Altar you face on entry. */}
        {entered && (
          <>
            {/* The Altar: progress, cornerstones, and the season's crossing. */}
            <Reveal id="station-altar" className="scroll-mt-16">
              <Altar
                cornerstones={cornerstones}
                onThreshold={bringToDesk}
                wordsInFlight={wordsInFlight}
                season={openSeason}
                hasOpenSeason={openSeasonId !== null}
                onBeginRitual={() => setRitualOpen(true)}
                reading={readingToday ?? undefined}
                watch={prayerToday ?? undefined}
                onWitness={witness}
                onGoToDesk={() => goToStation("station-desk")}
              />
            </Reveal>

            {/* On This Day — surfaced on the Altar only when this date holds words from years past. */}
            {onThisDay.length > 0 && (
              <Reveal className="mx-auto w-full">
                <OnThisDay remembered={onThisDay} />
              </Reveal>
            )}

            {/* The Desk — Receive & Reflect. */}
            <Reveal id="station-desk" delay={80} className="mx-auto w-full max-w-5xl scroll-mt-16">
              <Desk
                active={deskActive}
                seed={seed}
                onReceive={receive}
                onCarry={carry}
                onWitness={witness}
                onReadingComplete={load}
              />
            </Reveal>

            {/* The Shelves — the Archive of seasons kept. */}
            <Reveal id="station-shelves" delay={120} className="mx-auto w-full max-w-5xl scroll-mt-16">
              <Shelves
                seasons={seasons}
                encounters={encounters}
                onDeleteEncounter={async (id) => {
                  await api.deleteEncounter(id);
                  await load();
                }}
              />
            </Reveal>

            {/* The Wall — Declare. */}
            <Reveal id="station-wall" delay={160} className="mx-auto w-full max-w-5xl scroll-mt-16">
              <Wall
                declarations={declarations}
                confessions={confessions}
                cornerstones={cornerstones}
                onKeep={async (words, scripture, scriptureText) => {
                  await api.createEncounter({
                    words,
                    scripture,
                    scripture_text: scriptureText,
                    stage: "declared",
                    season_id: openSeasonId,
                  });
                  await load();
                }}
              />
            </Reveal>

            {/* The Window — Witness. */}
            <Reveal id="station-window" delay={200} className="mx-auto w-full max-w-5xl scroll-mt-16">
              <Window testimonies={testimonies} />
            </Reveal>
          </>
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

      {/* The first walk through the room — once on arrival, re-openable from the bar. */}
      {tourOpen && (
        <RoomTour
          hasShelves={seasons.length > 0}
          hasWindow={testimonies.length > 0}
          onRequestEnter={markEntered}
          onClose={closeTour}
        />
      )}
    </div>
  );
}