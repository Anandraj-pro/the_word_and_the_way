import { useEffect, useRef, useState } from "react";
import { api, type Encounter, type Scripture } from "../api";
import { Station } from "./Station";
import { EncounterCard } from "./EncounterCard";
import { DailyReading } from "./DailyReading";
import { DailyPrayer } from "./DailyPrayer";

interface DeskProps {
  active: Encounter[]; // open-season words still on their way to the Altar
  seed?: string; // prefilled from the Altar threshold line
  onReceive: (scripture: string, words: string, scriptureText?: string) => void;
  onCarry: (id: number) => void;
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
export function Desk({ active, seed, onReceive, onCarry, onReadingComplete }: DeskProps) {
  const [scripture, setScripture] = useState("");
  const [words, setWords] = useState(seed ?? "");
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

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
    <Station label="The Desk" subtitle="Receive · Reflect">
      {/* Today — the daily rhythm, kept quiet so the Receive action leads. */}
      <div className="mb-5 divide-y divide-stone/15 rounded-sm border border-stone/15 bg-linen-deep/30 px-4">
        <DailyReading onComplete={onReadingComplete} />
        <DailyPrayer />
      </div>

      {/* Receive — the Desk's primary act. */}
      <p className="mb-2 text-[0.65rem] uppercase tracking-[0.3em] text-stone/60">
        Receive a word
      </p>
      <form onSubmit={submit} className="mb-5 flex flex-col gap-2">
        <input
          value={scripture}
          onChange={(e) => setScripture(e.target.value)}
          placeholder="A reference, if one was given…"
          className="border-b border-stone/30 bg-transparent pb-1 font-display text-base text-terracotta-deep placeholder:font-serif placeholder:text-sm placeholder:text-stone/60 focus:border-terracotta focus:outline-none"
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
          value={words}
          onChange={(e) => setWords(e.target.value)}
          placeholder="What is God saying?"
          rows={3}
          className="resize-none bg-transparent font-serif text-sm leading-snug text-ink placeholder:text-stone/60 focus:outline-none"
        />
        <button
          type="submit"
          className="self-start rounded-sm bg-terracotta px-4 py-1.5 font-serif text-sm text-linen transition-colors hover:bg-terracotta-deep"
        >
          Receive
        </button>
      </form>

      {active.length > 0 && (
        <p className="mb-2.5 text-[0.65rem] uppercase tracking-[0.3em] text-stone/60">
          Carrying · {active.length}
        </p>
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        {active.length === 0 ? (
          <p className="text-sm italic text-stone">The page is blank. The silence is the invitation.</p>
        ) : (
          active.map((e) => <EncounterCard key={e.id} e={e} onCarry={onCarry} />)
        )}
      </div>
    </Station>
  );
}
