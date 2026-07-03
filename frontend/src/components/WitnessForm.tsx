import { useState } from "react";

interface WitnessFormProps {
  /** Pre-fill for the testimony — the word's existing reflection, if any. */
  initial: string;
  /** Record the testimony: how God kept this word. Caller binds the Encounter id. */
  onWitness: (words: string) => void | Promise<void>;
  /** The surface it sits on — a lit linen card, or the Altar's dark stone. */
  tone?: "onLinen" | "onInk";
  className?: string;
}

/**
 * The witness affordance — "God kept it." A single line until opened, then an inline
 * note (never a modal). Shared by the Desk's active words and the Altar's kept promises,
 * so both record a testimony the same way. Robust submit: guards empty text and
 * double-submit, and on failure keeps the note so no false success is shown.
 */
export function WitnessForm({ initial, onWitness, tone = "onLinen", className = "" }: WitnessFormProps) {
  const [witnessing, setWitnessing] = useState(false);
  const [testimony, setTestimony] = useState("");
  const [saving, setSaving] = useState(false);

  const record = async () => {
    if (saving || !testimony.trim()) return;
    setSaving(true);
    try {
      await onWitness(testimony.trim());
      setWitnessing(false); // the room refresh carries this word to the Window
    } catch {
      // Not witnessed — keep the note and its text, surface no false success.
    } finally {
      setSaving(false);
    }
  };

  if (!witnessing) {
    return (
      <button
        onClick={() => {
          setTestimony(initial);
          setWitnessing(true);
        }}
        className={`text-xs font-medium uppercase tracking-[0.15em] text-terracotta transition-colors hover:text-terracotta-deep ${className}`}
      >
        ✦ Witness — God kept it
      </button>
    );
  }

  // On the dark stone the note must read in linen; on linen it reads in ink.
  const inputTone =
    tone === "onInk"
      ? "border-stone/40 text-linen placeholder:text-stone/55"
      : "border-stone/30 text-ink placeholder:text-stone/55";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <textarea
        value={testimony}
        onChange={(ev) => setTestimony(ev.target.value)}
        placeholder="How did God keep it?"
        autoFocus
        rows={2}
        className={`resize-none border-b bg-transparent pb-1 font-serif text-sm leading-snug focus:border-terracotta focus:outline-none ${inputTone}`}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={record}
          disabled={saving || !testimony.trim()}
          className="text-xs font-medium uppercase tracking-[0.15em] text-terracotta transition-colors hover:text-terracotta-deep disabled:opacity-50"
        >
          {saving ? "recording…" : "Record testimony"}
        </button>
        <button
          onClick={() => setWitnessing(false)}
          className="text-xs italic text-stone/60 transition-colors hover:text-terracotta-deep"
        >
          cancel
        </button>
      </div>
    </div>
  );
}
