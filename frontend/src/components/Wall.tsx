import { useMemo, useRef, useState } from "react";
import { api, type Confession, type ConfessionSummary, type Encounter } from "../api";
import { Station } from "./Station";
import { WarRoom, type WarRoomItem } from "./WarRoom";

interface WallProps {
  declarations: Encounter[];
  confessions: ConfessionSummary[];
  cornerstones: Encounter[];
}

/**
 * The Wall — Declare. Type to filter by title instantly; press Enter to
 * search by meaning (RAG semantic search via ChromaDB + Ollama). Gather several
 * words and enter the War Room to proclaim them aloud, one at a time.
 */
export function Wall({ declarations, confessions, cornerstones }: WallProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Confession | null>(null);
  const [loading, setLoading] = useState(false);

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
        {declarations.map((d) => {
          const mustered = isMustered("declaration", d.id);
          return (
            <div
              key={d.id}
              className="relative rounded-sm bg-terracotta px-4 py-3 text-linen shadow-sm"
            >
              <p className="pr-6 font-display text-base leading-snug">
                {d.words || d.scripture_text}
              </p>
              {d.scripture && (
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-linen/75">
                  {d.scripture}
                </p>
              )}
              <button
                onClick={() =>
                  toggleMuster({
                    kind: "declaration",
                    id: d.id,
                    title: d.words || d.scripture_text || d.scripture || "",
                    scripture: d.scripture,
                  })
                }
                aria-label={mustered ? "Remove from War Room" : "Add to War Room"}
                aria-pressed={mustered}
                title={mustered ? "In the War Room" : "Take to the War Room"}
                className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-xs leading-none transition-colors ${
                  mustered
                    ? "bg-linen text-terracotta-deep"
                    : "bg-linen/20 text-linen hover:bg-linen/35"
                }`}
              >
                {mustered ? "✓" : "+"}
              </button>
            </div>
          );
        })}

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
                  <li className="px-2 py-2 text-sm italic text-stone">
                    {isSemanticMode ? "Nothing matched on the Wall." : "No declaration by that name."}
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* The scroll, unrolled — large text to read aloud and declare. */}
      {(open || loading) && (
        <div
          className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-ink/80 px-4 py-10 backdrop-blur-sm"
          onClick={() => setOpen(null)}
        >
          <div
            className="settle h-fit w-full max-w-2xl rounded-sm border border-terracotta/30 bg-linen px-7 py-8 shadow-2xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
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
        </div>
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
