// The room's one object and the calls each station makes.

// A word carried through this many seasons is inscribed on the Altar as a cornerstone.
export const CORNERSTONE_THRESHOLD = 3;

export type Stage =
  | "received" // rhema — Desk
  | "reflecting" // journal — Desk
  | "declared" // confession / declaration — Wall
  | "carried" // promise — Altar
  | "witnessed"; // testimony — Window

export interface Encounter {
  id: number;
  scripture: string | null;
  scripture_text: string | null;
  words: string | null;
  stage: Stage;
  season_id: number | null;
  received_on: string;
  carry_count: number;
  themes: string | null;
  is_cornerstone: boolean;
  created_at: string;
  updated_at: string;
}

/** A confession on the Wall — inherited liturgy, read and declared (not a personal Encounter). */
export interface ConfessionSummary {
  id: number;
  slug: string;
  title: string;
  refs: string[];
}

export interface Confession extends ConfessionSummary {
  body: string;
}

export interface Season {
  id: number;
  name: string;
  opening_scripture: string | null;
  opening_declaration: string | null;
  epitaph: string | null;
  opened_on: string;
  closed_on: string | null;
  is_open: boolean;
}

/** Opening the first season (when none is open). */
export interface SeasonOpen {
  name: string;
  opening_scripture?: string | null;
  opening_declaration?: string | null;
}

/** The crossing ritual — close the open season and enter the next in one act. */
export interface SeasonCross extends SeasonOpen {
  epitaph: string; // the closing season's name in hindsight
  carry_encounter_ids: number[];
}

export interface CrossResult {
  season: Season;
  carried: Encounter[];
  inscribed: Encounter[]; // crossed to Cornerstone in this crossing
}

/** A verse fetched for the Desk lookup. */
export interface Scripture {
  reference: string; // canonical, e.g. "Psalms 27:14"
  text: string;
  translation: string;
}

/** A standing thing prayed over — the daily watch. */
export interface PrayerFocus {
  id: number;
  label: string;
  kind: "standard" | "personal";
  scripture: string | null;
  prayed_today: boolean;
  last_prayed: string | null;
}

export interface PrayerToday {
  focuses: PrayerFocus[];
  streak: number;
  prayed_today: number;
  total: number;
}

/** One numbered verse in the book reader. */
export interface Verse {
  verse: number | null;
  text: string;
}

/** A whole chapter, broken into verses, for the book reader. */
export interface Passage {
  reference: string;
  translation: string;
  verses: Verse[];
  previous_reference: string | null;
  next_reference: string | null;
}

/** Today's reading on the Desk — the daily Bible-reading rhythm. */
export interface ReadingToday {
  status: "to_read" | "done_today" | "plan_complete";
  day_index: number | null;
  reference: string | null;
  text: string | null;
  translation: string | null;
  total: number;
  completed: number;
  streak: number;
  next_reference: string | null;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  altar: () => http<Encounter[]>("/encounters/altar"),
  onThisDay: () => http<Encounter[]>("/encounters/on-this-day"),
  encounters: (params?: { stage?: Stage; season_id?: number }) => {
    const q = new URLSearchParams();
    if (params?.stage) q.set("stage", params.stage);
    if (params?.season_id != null) q.set("season_id", String(params.season_id));
    const qs = q.toString();
    return http<Encounter[]>(`/encounters${qs ? `?${qs}` : ""}`);
  },
  createEncounter: (body: Partial<Encounter>) =>
    http<Encounter>("/encounters", { method: "POST", body: JSON.stringify(body) }),
  carry: (id: number) =>
    http<Encounter>(`/encounters/${id}/carry`, { method: "POST" }),
  seasons: () => http<Season[]>("/seasons"),
  openSeason: (body: SeasonOpen) =>
    http<Season>("/seasons", { method: "POST", body: JSON.stringify(body) }),
  crossSeason: (body: SeasonCross) =>
    http<CrossResult>("/seasons/cross", { method: "POST", body: JSON.stringify(body) }),
  confessions: () => http<ConfessionSummary[]>("/confessions"),
  confession: (slug: string) => http<Confession>(`/confessions/${slug}`),
  searchConfessions: (q: string, n = 5) =>
    http<ConfessionSummary[]>("/confessions/search", {
      method: "POST",
      body: JSON.stringify({ q, n }),
    }),
  scripture: (reference: string) =>
    http<Scripture>(`/scripture?reference=${encodeURIComponent(reference)}`),
  passage: (reference: string) =>
    http<Passage>(`/scripture/passage?reference=${encodeURIComponent(reference)}`),
  readingToday: () => http<ReadingToday>("/reading/today"),
  completeReading: (response?: string, reference?: string) =>
    http<ReadingToday>("/reading/complete", {
      method: "POST",
      body: JSON.stringify({ response: response ?? null, reference: reference ?? null }),
    }),
  prayerToday: () => http<PrayerToday>("/prayer/today"),
  togglePrayer: (focusId: number) =>
    http<PrayerToday>(`/prayer/${focusId}/pray`, { method: "POST" }),
  addPrayerFocus: (label: string, scripture?: string) =>
    http<PrayerToday>("/prayer/focus", {
      method: "POST",
      body: JSON.stringify({ label, scripture: scripture ?? null }),
    }),
  removePrayerFocus: (focusId: number) =>
    http<PrayerToday>(`/prayer/focus/${focusId}`, { method: "DELETE" }),
};
