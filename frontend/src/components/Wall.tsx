import { useMemo, useRef, useState } from "react";
import {
  api,
  type ComposeResult,
  type Confession,
  type ConfessionSummary,
  type Encounter,
} from "../api";
import { Modal } from "./ui/Modal";
import { Station } from "./Station";
import { WarRoom, type WarRoomItem } from "./WarRoom";

// The scribe writes in light markdown (*scripture refs*, **emphasis**). Read it plainly.
const cleanProse = (s: string) =>
  s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .trim();

// Short enough to speak in one breath — set large, like a line carved on the wall.
// Anything longer is prose, and prose is set to be read: serif, measured, in paragraphs.
const ONE_BREATH = 160;

function DeclarationCard({
  d,
  mustered,
  onToggleMuster,
}: {
  d: Encounter;
  mustered: boolean;
  onToggleMuster: () => void;
}) {
  const text = cleanProse(d.words || d.scripture_text || "");
  const isLine = text.length <= ONE_BREATH;
  const [unrolled, setUnrolled] = useState(false);
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim());

  const musterButton = (
    <button
      onClick={onToggleMuster}
      aria-label={mustered ? "Remove from War Room" : "Add to War Room"}
      aria-pressed={mustered}
      title={mustered ? "In the War Room" : "Take to the War Room"}
      className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-xs leading-none transition-colors ${
        isLine
          ? mustered
            ? "bg-linen text-terracotta-deep"
            : "bg-linen/20 text-linen hover:bg-linen/35"
          : mustered
            ? "bg-terracotta text-linen"
            : "bg-stone/15 text-stone hover:bg-terracotta/20 hover:text-terracotta"
      }`}
    >
      {mustered ? "✓" : "+"}
    </button>
  );

  if (isLine) {
    return (
      <div className="relative rounded-sm bg-terracotta px-4 py-3 text-linen shadow-sm">
        <p className="max-w-[40ch] pr-6 font-display text-base leading-snug">{text}</p>
        {d.scripture && (
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-linen/75">{d.scripture}</p>
        )}
        {musterButton}
      </div>
    );
  }

  return (
    <div className="relative rounded-sm border border-stone/20 border-l-2 border-l-terracotta bg-linen-deep/40 px-4 py-3">
      <div
        className={`relative flex flex-col gap-2.5 pr-6 ${unrolled ? "" : "max-h-36 overflow-hidden"}`}
      >
        {paragraphs.map((para, i) => (
          <p key={i} className="max-w-[65ch] whitespace-pre-line font-serif text-[0.95rem] leading-relaxed text-ink">
            {para}
          </p>
        ))}
        {!unrolled && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#ece5d8] to-transparent"
          />
        )}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <button
          onClick={() => setUnrolled((u) => !u)}
          className="font-serif text-xs italic text-terracotta underline decoration-terracotta/40 underline-offset-2 transition-colors hover:text-terracotta-deep"
        >
          {unrolled ? "Roll it up" : "Unroll — read it whole"}
        </button>
        {d.scripture && (
          <p className="text-xs uppercase tracking-[0.2em] text-stone/70">{d.scripture}</p>
        )}
      </div>
      {musterButton}
    </div>
  );
}

interface WallProps {
  declarations: Encounter[];
  confessions: ConfessionSummary[];
  cornerstones: Encounter[];
  // Keep a freshly composed confession as a declared Encounter on the spine.
  onKeep: (
    words: string,
    scripture: string | null,
    scriptureText: string | null,
  ) => Promise<void>;
}

/**
 * The Wall — Declare. Type to filter by title instantly; press Enter to
 * search by meaning (RAG semantic search via ChromaDB + Ollama). Gather several
 * words and enter the War Room to proclaim them aloud, one at a time.
 */
export function Wall({ declarations, confessions, cornerstones, onKeep }: WallProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Confession | null>(null);
  const [loading, setLoading] = useState(false);

  // The scribe — compose a new declaration from a real-time need (RAG generation).
  const [composeOpen, setComposeOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const [composed, setComposed] = useState<ComposeResult | null>(null);
  const [composeFailed, setComposeFailed] = useState(false); // the model was unreachable
  const [keeping, setKeeping] = useState(false);
  const [kept, setKept] = useState(false);

  // The War Room muster — words marked to proclaim, in the order chosen.
  const [muster, setMuster] = useState<WarRoomItem[]>([]);
  const [warRoomOpen, setWarRoomOpen] = useState(false);

  const isMustered = (kind: WarRoomItem["kind"], id: number) =>
    muster.some((m) => m.kind === kind && m.id === id);

  const toggleMuster = (item: WarRoomItem) =>
    setMuster((prev) =>
      prev.some((m) => m.kind === item.kind && m.id === item.id)
        ? prev.filter((m) => !(m.kind === item.kind && m.id === item.id))
        : [...prev, item],
    );

  const leaveWarRoom = () => {
    setWarRoomOpen(false);
    setMuster([]);
  };

  const [semanticResults, setSemanticResults] = useState<ConfessionSummary[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [searchFailed, setSearchFailed] = useState(false); // semantic search unreachable
  const inputRef = useRef<HTMLInputElement>(null);

  const titleFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return confessions;
    return confessions.filter((c) => c.title.toLowerCase().includes(q));
  }, [confessions, query]);

  const isSemanticMode = semanticResults !== null;
  const displayList = isSemanticMode ? semanticResults : titleFiltered;

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const q = query.trim();
      if (!q) return;
      setSearching(true);
      setSearchedQuery(q);
      setSearchFailed(false);
      try {
        const results = await api.searchConfessions(q, 10);
        setSemanticResults(results);
      } catch {
        // Ollama/ChromaDB unreachable — fall back to the title filter, which still works.
        setSemanticResults(null);
        setSearchFailed(true);
      } finally {
        setSearching(false);
      }
    }
    if (e.key === "Escape") clearSearch();
  };

  const clearSearch = () => {
    setSemanticResults(null);
    setSearchedQuery("");
    setSearchFailed(false);
    setQuery("");
    inputRef.current?.focus();
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSearchFailed(false);
    if (semanticResults !== null) setSemanticResults(null);
  };

  const unroll = async (c: ConfessionSummary) => {
    setLoading(true);
    try {
      setOpen(await api.confession(c.slug));
    } finally {
      setLoading(false);
    }
  };

  // Ask the scribe for a word: retrieve the nearest confessions, ground them in
  // Scripture, and let the local model write a declaration for this exact need.
  const composeWord = async () => {
    const q = query.trim();
    if (!q) return;
    setComposeOpen(true);
    setComposing(true);
    setComposed(null);
    setComposeFailed(false);
    setKept(false);
    try {
      setComposed(await api.composeConfession(q, 3));
    } catch {
      setComposeFailed(true);
    } finally {
      setComposing(false);
    }
  };

  const closeCompose = () => {
    setComposeOpen(false);
    setComposed(null);
    setComposeFailed(false);
    setKept(false);
  };

  // Keep it: the word leaves the scribe and joins the spine as a declaration.
  const keepComposed = async () => {
    if (!composed) return;
    setKeeping(true);
    try {
      const primary = composed.scriptures[0];
      await onKeep(composed.confession, primary?.reference ?? null, primary?.text ?? null);
      setKept(true);
      setTimeout(closeCompose, 1300);
    } finally {
      setKeeping(false);
    }
  };

  const isEmpty = declarations.length === 0 && confessions.length === 0;

  return (
    <Station
      label="The Wall"
      subtitle="Declarations"
      empty={isEmpty}
      emptyWord="Nothing is posted on the wall yet."
    >
      <div className="flex flex-col gap-3 overflow-y-auto">
        {/* The muster — words gathered for the War Room, ready to be proclaimed. */}
        {muster.length > 0 && (
          <div className="flex items-center justify-between gap-2 rounded-sm border border-terracotta/40 bg-terracotta/10 px-3 py-2">
            <button
              onClick={() => setWarRoomOpen(true)}
              className="font-display text-sm uppercase tracking-[0.15em] text-terracotta-deep transition-colors hover:text-terracotta"
            >
              Enter the War Room ({muster.length})
            </button>
            <button
              onClick={() => setMuster([])}
              className="text-xs text-stone/60 underline underline-offset-2 transition-colors hover:text-terracotta"
            >
              clear
            </button>
          </div>
        )}

        {/* The Pastor's own declarations, proclaimed in his own words. */}
        {declarations.map((d) => (
          <DeclarationCard
            key={d.id}
            d={d}
            mustered={isMustered("declaration", d.id)}
            onToggleMuster={() =>
              toggleMuster({
                kind: "declaration",
                id: d.id,
                title: cleanProse(d.words || d.scripture_text || d.scripture || ""),
                scripture: d.scripture,
              })
            }
          />
        ))}

        {/* The inherited corpus — a library to read and declare from. */}
        {confessions.length > 0 && (
          <div className="mt-1">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-stone/70">
                Scriptural declarations
              </p>
              <span className="text-xs text-stone/60">
                {isSemanticMode ? `${displayList.length} found` : confessions.length}
              </span>
            </div>

            {/* Search input */}
            <div className="relative mb-1">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Find a declaration… or describe a need"
                className="w-full border-b border-stone/30 bg-transparent pb-1 pr-6 font-serif text-sm text-ink placeholder:text-stone/45 focus:border-terracotta focus:outline-none"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  aria-label="Clear"
                  className="absolute right-0 top-0 text-stone/50 transition-colors hover:text-terracotta"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Mode label */}
            {isSemanticMode ? (
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs italic text-terracotta">
                  By meaning — "{searchedQuery}"
                </span>
                <button
                  onClick={clearSearch}
                  className="text-xs text-stone/60 underline underline-offset-2 transition-colors hover:text-terracotta"
                >
                  browse all
                </button>
              </div>
            ) : searchFailed ? (
              <p className="mb-2 text-xs italic text-stone/70">
                Search by meaning is resting — showing title matches.
              </p>
            ) : query.trim() ? (
              <p className="mb-2 text-xs italic text-stone/50">
                Press Enter to search by meaning
              </p>
            ) : null}

            {/* The scribe — turn this need into a new, Scripture-grounded declaration. */}
            {query.trim() && !searching && (
              <button
                onClick={composeWord}
                className="mb-2 flex items-center gap-1.5 font-serif text-xs italic text-terracotta underline decoration-terracotta/40 underline-offset-2 transition-colors hover:text-terracotta-deep"
              >
                ✦ Compose a word for this need
              </button>
            )}

            {searching && (
              <p className="animate-pulse py-2 text-sm italic text-stone/70">
                Searching the Wall…
              </p>
            )}

            {!searching && (
              <ul className="-mx-2 flex max-h-72 flex-col overflow-y-auto pr-1">
                {displayList.map((c, i) => {
                  const mustered = isMustered("confession", c.id);
                  return (
                    <li key={c.id} className="flex items-center gap-1">
                      <button
                        onClick={() => unroll(c)}
                        className="group flex min-w-0 flex-1 items-baseline gap-2.5 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-terracotta/10"
                      >
                        {isSemanticMode ? (
                          <span className="w-4 shrink-0 text-right font-display text-xs text-terracotta/70">
                            {i + 1}
                          </span>
                        ) : (
                          <span
                            aria-hidden
                            className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-terracotta/40 transition-colors group-hover:bg-terracotta"
                          />
                        )}
                        <span className="min-w-0 flex-1 truncate font-serif text-sm text-ink/90 group-hover:text-terracotta-deep">
                          {c.title}
                        </span>
                        {c.refs.length > 0 && (
                          <span className="shrink-0 font-serif text-[0.7rem] uppercase tracking-wider text-stone/45">
                            {c.refs[0]}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() =>
                          toggleMuster({
                            kind: "confession",
                            id: c.id,
                            slug: c.slug,
                            title: c.title,
                          })
                        }
                        aria-label={mustered ? "Remove from War Room" : "Add to War Room"}
                        aria-pressed={mustered}
                        title={mustered ? "In the War Room" : "Take to the War Room"}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs leading-none transition-colors ${
                          mustered
                            ? "bg-terracotta text-linen"
                            : "text-stone/40 hover:bg-terracotta/15 hover:text-terracotta"
                        }`}
                      >
                        {mustered ? "✓" : "+"}
                      </button>
                    </li>
                  );
                })}
                {displayList.length === 0 && (
                  <li className="px-2 py-2 text-sm italic text-stone/70">
                    {isSemanticMode
                      ? "Nothing matched on the Wall — compose a word above."
                      : "No declaration by that title — press Enter to search by meaning, or compose a word above."}
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* The scroll, unrolled — large text to read aloud and declare. */}
      {(open || loading) && (
        <Modal onClose={() => setOpen(null)}>
          <div className="px-7 py-8">
            {loading || !open ? (
              <p className="font-serif text-sm italic text-stone">Unrolling…</p>
            ) : (
              <>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <h2 className="font-display text-2xl leading-tight text-terracotta-deep">
                    {open.title}
                  </h2>
                  <button
                    onClick={() => setOpen(null)}
                    aria-label="Close"
                    className="shrink-0 text-xl leading-none text-stone transition-colors hover:text-terracotta-deep"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {open.body.split(/\n{2,}/).map((para, i) => {
                    const h1 = para.match(/^#\s+(.+)/);
                    const h2 = para.match(/^##\s+(.+)/);
                    if (h2)
                      return (
                        <p key={i} className="font-display text-base uppercase tracking-widest text-stone">
                          {h2[1]}
                        </p>
                      );
                    if (h1)
                      return (
                        <p key={i} className="font-display text-lg text-terracotta-deep">
                          {h1[1]}
                        </p>
                      );
                    return (
                      <p key={i} className="whitespace-pre-line font-serif text-[1.05rem] leading-relaxed text-ink">
                        {para}
                      </p>
                    );
                  })}
                </div>
                {open.refs.length > 0 && (
                  <div className="mt-6 border-t border-stone/25 pt-4">
                    <p className="mb-1.5 text-xs uppercase tracking-[0.25em] text-stone/70">
                      Scripture references
                    </p>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1">
                      {open.refs.map((r) => (
                        <li key={r} className="font-serif text-sm text-stone">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>
      )}

      {/* The scribe's word — a freshly composed declaration, to be prayed and kept. */}
      {composeOpen && (
        <Modal onClose={closeCompose}>
          {/* Header — sticks to the top of the card so the close is always reachable. */}
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-stone/15 bg-linen/95 px-7 py-5 backdrop-blur-sm">
            <div>
              <p className="flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.25em] text-terracotta-deep">
                ✦ A word for you
              </p>
              {composed && (
                <p className="mt-1 font-serif text-sm italic text-stone">
                  for “{composed.problem}”
                </p>
              )}
            </div>
            <button
              onClick={closeCompose}
              aria-label="Close"
              className="shrink-0 rounded-full px-2 text-xl leading-none text-stone transition-colors hover:text-terracotta-deep"
            >
              ✕
            </button>
          </div>

          <div className="px-7 py-6">
            {composing && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="flex gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-terracotta [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-terracotta [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-terracotta" />
                </span>
                <p className="font-serif text-sm italic text-stone/70">
                  The scribe is writing… this can take a moment.
                </p>
              </div>
            )}

            {composeFailed && (
              <p className="py-10 text-center font-serif text-sm italic text-terracotta-deep">
                The scribe is resting — the local model could not be reached. Is Ollama
                running?
              </p>
            )}

            {composed && !composing && (
              <>
                {/* The declaration — the hero, set to be read aloud. */}
                <div className="flex flex-col gap-4">
                  {cleanProse(composed.confession)
                    .split(/\n{2,}/)
                    .filter((p) => p.trim())
                    .map((para, i) => (
                      <p
                        key={i}
                        className="whitespace-pre-line font-serif text-[1.15rem] leading-relaxed text-ink"
                      >
                        {para}
                      </p>
                    ))}
                </div>

                {composed.scriptures.length > 0 && (
                  <div className="mt-7 border-t border-stone/20 pt-5">
                    <p className="mb-3 text-xs uppercase tracking-[0.25em] text-stone/70">
                      The Word it stands on
                    </p>
                    <ul className="flex flex-col gap-3">
                      {composed.scriptures.map((s) => (
                        <li key={s.reference} className="border-l-2 border-terracotta/30 pl-3">
                          <p className="font-display text-xs uppercase tracking-[0.15em] text-terracotta-deep">
                            {s.reference}
                          </p>
                          <p className="mt-0.5 font-serif text-sm italic leading-relaxed text-stone">
                            {s.text}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {composed.prayer && (
                  <div className="mt-7 rounded-md border border-terracotta/20 bg-terracotta/[0.07] px-5 py-4">
                    <p className="mb-1.5 text-xs uppercase tracking-[0.25em] text-stone/70">
                      A prayer
                    </p>
                    <p className="whitespace-pre-line font-serif text-[1.05rem] leading-relaxed text-ink">
                      {cleanProse(composed.prayer)}
                    </p>
                  </div>
                )}

                {composed.sources.length > 0 && (
                  <p className="mt-5 font-serif text-xs italic text-stone/55">
                    Drawn from the Wall: {composed.sources.map((s) => s.title).join(" · ")}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Actions — pinned to the bottom of the card, always in reach. */}
          {composed && !composing && (
            <div className="sticky bottom-0 flex items-center justify-end gap-4 border-t border-stone/15 bg-linen/95 px-7 py-4 backdrop-blur-sm">
              {kept ? (
                <p className="font-serif text-sm italic text-terracotta-deep">
                  Kept — it is on the Wall. ✓
                </p>
              ) : (
                <>
                  <button
                    onClick={closeCompose}
                    className="font-serif text-sm text-stone/70 transition-colors hover:text-terracotta-deep"
                  >
                    Let it go
                  </button>
                  <button
                    onClick={keepComposed}
                    disabled={keeping}
                    className="rounded-sm bg-terracotta px-5 py-2 font-display text-sm uppercase tracking-[0.15em] text-linen shadow-sm transition-colors hover:bg-terracotta-deep disabled:opacity-60"
                  >
                    {keeping ? "Keeping…" : "Keep this"}
                  </button>
                </>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* The War Room — the muster, proclaimed full-screen, ending on the cornerstone. */}
      {warRoomOpen && (
        <WarRoom
          sequence={muster}
          cornerstone={cornerstones[0] ?? null}
          onClose={leaveWarRoom}
        />
      )}
    </Station>
  );
}
