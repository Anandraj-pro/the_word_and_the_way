import { useState } from "react";
import { api, type CrossResult, type Encounter } from "../api";

interface SeasonRitualProps {
  open: boolean;
  hasOpenSeason: boolean;
  closingName?: string; // the season currently open — closed by the crossing
  candidates: Encounter[]; // open-season Desk words available to carry forward
  onClose: () => void;
  onComplete: (result?: CrossResult) => void;
}

/**
 * The crossing ritual. With no open season it simply opens the first. With one open,
 * it is a single weighty act: write the closing season's epitaph, choose what to carry,
 * and name the season being entered.
 */
export function SeasonRitual({
  open,
  hasOpenSeason,
  closingName,
  candidates,
  onClose,
  onComplete,
}: SeasonRitualProps) {
  const [epitaph, setEpitaph] = useState("");
  const [name, setName] = useState("");
  const [scripture, setScripture] = useState("");
  const [declaration, setDeclaration] = useState("");
  const [carry, setCarry] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();

  if (!open) return null;

  const reset = () => {
    setEpitaph("");
    setName("");
    setScripture("");
    setDeclaration("");
    setCarry(new Set());
    setErr(undefined);
  };

  const close = () => {
    reset();
    onClose();
  };

  const toggle = (id: number) =>
    setCarry((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const canSubmit = name.trim() && (!hasOpenSeason || epitaph.trim());

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setErr(undefined);
    try {
      let result: CrossResult | undefined;
      if (hasOpenSeason) {
        result = await api.crossSeason({
          epitaph: epitaph.trim(),
          name: name.trim(),
          opening_scripture: scripture.trim() || null,
          opening_declaration: declaration.trim() || null,
          carry_encounter_ids: [...carry],
        });
      } else {
        await api.openSeason({
          name: name.trim(),
          opening_scripture: scripture.trim() || null,
          opening_declaration: declaration.trim() || null,
        });
      }
      reset();
      onComplete(result);
    } catch {
      setErr("The season could not turn. Is the backend running?");
    } finally {
      setBusy(false);
    }
  };

  const labelCls = "text-xs uppercase tracking-[0.25em] text-stone/70";
  const inputCls =
    "w-full border-b border-stone/30 bg-transparent pb-1 font-serif text-ink placeholder:text-stone/55 focus:border-terracotta focus:outline-none";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-ink/80 px-4 py-10 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="settle h-fit w-full max-w-xl rounded-sm border border-terracotta/30 bg-linen px-7 py-8 shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl leading-tight text-terracotta-deep">
              {hasOpenSeason ? "Cross into a new season" : "Open a season"}
            </h2>
            <p className="mt-1 font-serif text-sm italic text-stone">
              {hasOpenSeason
                ? "A season ends so a new one can begin. What you carry, you carry on purpose."
                : "Name the season you are entering. It becomes the lens the room looks through."}
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="shrink-0 text-xl leading-none text-stone transition-colors hover:text-terracotta-deep"
          >
            ✕
          </button>
        </div>

        {/* Movement I — close the season passing (only when one is open). */}
        {hasOpenSeason && (
          <section className="mb-6">
            <p className={labelCls}>
              Closing {closingName ? `“${closingName}”` : "this season"}
            </p>
            <p className="mb-2 mt-1 font-serif text-sm text-stone">
              Its name in hindsight — the epitaph it is remembered by.
            </p>
            <textarea
              value={epitaph}
              onChange={(e) => setEpitaph(e.target.value)}
              placeholder="This was my season of…"
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </section>
        )}

        {/* Movement II — choose what crosses over. */}
        {hasOpenSeason && (
          <section className="mb-6">
            <p className={labelCls}>What do you carry forward?</p>
            <p className="mb-2 mt-1 font-serif text-sm text-stone">
              {candidates.length > 0
                ? "These cross with you; the rest stay in the season closing. Carried words near the Altar with each crossing."
                : "Nothing waits on the Desk to carry. You enter the new season with open hands."}
            </p>
            <ul className="flex flex-col gap-1.5">
              {candidates.map((c) => {
                const checked = carry.has(c.id);
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => toggle(c.id)}
                      className={`flex w-full items-center gap-3 rounded-sm border px-3 py-2 text-left transition-colors ${
                        checked
                          ? "border-terracotta bg-terracotta/10"
                          : "border-stone/25 hover:border-stone/50"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border text-[10px] ${
                          checked
                            ? "border-terracotta bg-terracotta text-linen"
                            : "border-stone/50"
                        }`}
                        aria-hidden
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <span className="flex-1">
                        <span className="block font-display text-sm leading-tight text-ink">
                          {c.scripture || c.words || "An unnamed word"}
                        </span>
                        <span className="block text-xs italic text-stone">
                          carried {c.carry_count}× · {3 - c.carry_count} more to the Altar
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Movement III — name the season entered. */}
        <section className="mb-6">
          <p className={labelCls}>{hasOpenSeason ? "Entering" : "This season"}</p>
          <div className="mt-2 flex flex-col gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="This season is…"
              className={`${inputCls} font-display text-lg text-terracotta-deep`}
            />
            <input
              value={scripture}
              onChange={(e) => setScripture(e.target.value)}
              placeholder="A verse over it, if one was given…"
              className={inputCls}
            />
            <textarea
              value={declaration}
              onChange={(e) => setDeclaration(e.target.value)}
              placeholder="Declare what you are entering…"
              rows={2}
              className={`${inputCls} resize-none text-sm`}
            />
          </div>
        </section>

        {err && <p className="mb-3 text-sm text-terracotta-deep">{err}</p>}

        <button
          onClick={submit}
          disabled={!canSubmit || busy}
          className="rounded-sm bg-terracotta px-5 py-2 font-serif text-sm text-linen transition-colors hover:bg-terracotta-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy
            ? "…"
            : hasOpenSeason
              ? "Cross over"
              : "Open this season"}
        </button>
      </div>
    </div>
  );
}
