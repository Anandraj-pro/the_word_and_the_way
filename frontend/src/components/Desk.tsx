import { useState } from "react";
import type { Encounter } from "../api";
import { Station } from "./Station";
import { EncounterCard } from "./EncounterCard";

interface DeskProps {
  active: Encounter[]; // open-season words still on their way to the Altar
  seed?: string; // prefilled from the Altar threshold line
  onReceive: (scripture: string, words: string) => void;
  onCarry: (id: number) => void;
}

/** The Desk — Receive + Reflect. Where a rhema word is captured and carried toward the Altar. */
export function Desk({ active, seed, onReceive, onCarry }: DeskProps) {
  const [scripture, setScripture] = useState("");
  const [words, setWords] = useState(seed ?? "");

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!scripture.trim() && !words.trim()) return;
    onReceive(scripture.trim(), words.trim());
    setScripture("");
    setWords("");
  };

  return (
    <Station label="The Desk" subtitle="Receive · Reflect">
      <form onSubmit={submit} className="mb-5 flex flex-col gap-2">
        <input
          value={scripture}
          onChange={(e) => setScripture(e.target.value)}
          placeholder="A reference, if one was given…"
          className="border-b border-stone/30 bg-transparent pb-1 font-display text-base text-terracotta-deep placeholder:font-serif placeholder:text-sm placeholder:text-stone/60 focus:border-terracotta focus:outline-none"
        />
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

      <div className="flex flex-col gap-4 overflow-y-auto">
        {active.length === 0 ? (
          <p className="text-sm italic text-stone">The page is blank. The silence is the invitation.</p>
        ) : (
          active.map((e) => <EncounterCard key={e.id} e={e} onCarry={onCarry} />)
        )}
      </div>
    </Station>
  );
}
