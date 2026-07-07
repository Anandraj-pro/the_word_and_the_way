import { useEffect, useRef, useState } from "react";
import { api, type Encounter, type Scripture } from "../api";
import { Station } from "./Station";
import { EncounterCard } from "./EncounterCard";
import { DailyReading } from "./DailyReading";
import { DailyPrayer } from "./DailyPrayer";
import { Vine } from "./Vine";

interface DeskProps {
  active: Encounter[]; // open-season words still on their way to the Altar
  seed?: string; // prefilled from the Altar threshold line
  onReceive: (scripture: string, words: string, scriptureText?: string) => void;
  onCarry: (id: number) => void;
  onWitness: (id: number, words: string) => void | Promise<void>; // God kept it → the Window
  onReadingComplete: () => void; // a reading may have become an Encounter
}

// A reference worth looking up — something with a chapter:verse, e.g. "Psalm 27:14".
const LOOKS_LIKE_REFERENCE = /\d+\s*:\s*\d+/;

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; verse: Scripture }
  | { status: "notfound" }
  | { status: "unavailable" };

/** The Desk — Receive + Reflect. Where a rhema word is captured and carried toward the Altar. */
export function Desk({ active, seed, onReceive, onCarry, onWitness, onReadingComplete }: DeskProps) {
  const [scripture, setScripture] = useState("");
  const [words, setWords] = useState(seed ?? "");
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pageRef = useRef<HTMLTextAreaElement>(null);

  // A line laid down at the Altar arrives here as the open page, ready to continue.
  useEffect(() => {
    if (seed) {
      setWords(seed);
      pageRef.current?.focus();
    }
  }, [seed]);

  // Debounced verse lookup as a reference is typed. Cached server-side, so repeats are cheap.
  useEffect(() => {
    const ref = scripture.trim();
    clearTimeout(timer.current);
    if (!LOOKS_LIKE_REFERENCE.test(ref)) {
      setLookup({ status: "idle" });
      return;
    }
    timer.current = setTimeout(async () => {
      setLookup({ status: "loading" });
      try {
        const verse = await api.scripture(ref);
        setLookup({ status: "found", verse });
      } catch (e) {
        const offline = !(e instanceof Error && e.message.startsWith("404"));
        setLookup({ status: offline ? "unavailable" : "notfound" });
      }
    }, 600);
    return () => clearTimeout(timer.current);
  }, [scripture]);

  const foundText =
    lookup.status === "found" ? lookup.verse.text : undefined;

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!scripture.trim() && !words.trim()) return;
    onReceive(scripture.trim(), words.trim(), foundText);
    setScripture("");
    setWords("");
    setLookup({ status: "idle" });
  };

  return (
    <Station label="The Desk" subtitle="Daily devotions">
      {/* Receive — the Desk's one dominant act. The open page leads; all else serves it. */}
      <form
        onSubmit={submit}
        className="mb-6 rounded-sm border border-stone/20 bg-[#faf7f1] px-5 py-5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.4)]"
      >
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-terracotta-deep">
            Receive a word
          </p>
          <p className="font-serif text-xs italic text-stone/70">
            written here, it begins its walk to the Altar
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <input
            value={scripture}
            onChange={(e) => setScripture(e.target.value)}
            placeholder="A reference, if one was given…"
            className="border-b border-stone/30 bg-transparent pb-1.5 font-display text-lg text-terracotta-deep placeholder:font-serif placeholder:text-sm placeholder:text-stone/60 focus:border-terracotta focus:outline-none"
          />

          {/* The verse fills itself in as you name the reference. */}
          {lookup.status === "loading" && (
            <p className="text-xs italic text-stone/60">finding the verse…</p>
          )}
          {lookup.status === "found" && (
            <p className="border-l-2 border-terracotta/50 pl-2.5 font-serif text-sm italic leading-snug text-ink/90">
              “{lookup.verse.text}”
              <span className="ml-1 text-xs not-italic uppercase tracking-wider text-stone/60">
                {lookup.verse.translation}
              </span>
            </p>
          )}
          {lookup.status === "notfound" && (
            <p className="text-xs italic text-stone/60">No verse found for that reference.</p>
          )}
          {lookup.status === "unavailable" && (
            <p className="text-xs italic text-stone/60">
              Couldn’t reach the verse — you can still receive the reference.
            </p>
          )}

          <textarea
            ref={pageRef}
            value={words}
            onChange={(e) => setWords(e.target.value)}
            placeholder="What is God saying?"
            rows={4}
            className="resize-none bg-transparent font-serif text-base leading-relaxed text-ink placeholder:text-stone/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!scripture.trim() && !words.trim()}
            className="self-start rounded-sm bg-terracotta px-5 py-2 font-serif text-base text-linen transition-colors hover:bg-terracotta-deep disabled:opacity-40"
          >
            Receive
          </button>
        </div>
      </form>

      {/* Carrying — words already received, still on their way to the Altar. */}
      {active.length > 0 && (
        <p className="mb-2.5 text-[0.65rem] uppercase tracking-[0.3em] text-stone/60">
          Carrying · {active.length}
          <span className="ml-2 normal-case tracking-normal font-serif text-xs italic text-stone/60">
            — carry a word each season; after three it is inscribed on the Altar
          </span>
        </p>
      )}
      <div className="mb-6 flex min-h-0 flex-col gap-4">
        {active.length === 0 ? (
          <p className="text-sm italic text-stone">The page is blank. The silence is the invitation.</p>
        ) : (
          active.map((e) => (
            <EncounterCard key={e.id} e={e} onCarry={onCarry} onWitness={onWitness} />
          ))
        )}
      </div>

      {/* The day's rhythm — quieter furniture: the Vine, the reading, the watch. */}
      <p className="mb-2 text-[0.65rem] uppercase tracking-[0.3em] text-stone/60">
        The day's rhythm
      </p>
      <Vine />
      <div className="divide-y divide-stone/15 rounded-sm border border-stone/15 bg-linen-deep/30 px-4">
        <DailyReading onComplete={onReadingComplete} />
        <DailyPrayer />
      </div>
    </Station>
  );
}
