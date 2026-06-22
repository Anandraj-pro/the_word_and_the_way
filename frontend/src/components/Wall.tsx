import { useMemo, useRef, useState } from "react";
import { api, type Confession, type ConfessionSummary, type Encounter } from "../api";
import { Station } from "./Station";

interface WallProps {
  declarations: Encounter[];
  confessions: ConfessionSummary[];
}

/**
 * The Wall — Declare. Type to filter by title instantly; press Enter to
 * search by meaning (RAG semantic search via ChromaDB + Ollama).
 */
export function Wall({ declarations, confessions }: WallProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Confession | null>(null);
  const [loading, setLoading] = useState(false);

  const [semanticResults, setSemanticResults] = useState<ConfessionSummary[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState("");
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
      try {
        const results = await api.searchConfessions(q, 10);
        setSemanticResults(results);
      } finally {
        setSearching(false);
      }
    }
    if (e.key === "Escape") clearSearch();
  };

  const clearSearch = () => {
    setSemanticResults(null);
    setSearchedQuery("");
    setQuery("");
    inputRef.current?.focus();
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
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
      subtitle="Declare"
      empty={isEmpty}
      emptyWord="Nothing is posted on the wall yet."
    >
      <div className="flex flex-col gap-3 overflow-y-auto">
        {/* The Pastor's own declarations, proclaimed in his own words. */}
        {declarations.map((d) => (
          <div
            key={d.id}
            className="rounded-sm bg-terracotta px-4 py-3 text-linen shadow-sm"
          >
            <p className="font-display text-base leading-snug">
              {d.words || d.scripture_text}
            </p>
            {d.scripture && (
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-linen/75">
                {d.scripture}
              </p>
            )}
          </div>
        ))}

        {/* The inherited corpus — a library to read and declare from. */}
        {confessions.length > 0 && (
          <div className="mt-1">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-stone/70">
                Confessions
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
                placeholder="Find a confession… or describe a need"
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
              <ul className="flex max-h-72 flex-col overflow-y-auto">
                {displayList.map((c, i) => (
                  <li key={c.id}>
                    <button
                      onClick={() => unroll(c)}
                      className="group w-full border-b border-stone/15 py-1.5 text-left transition-colors hover:text-terracotta-deep"
                    >
                      <span className="font-serif text-sm text-ink/90 group-hover:text-terracotta-deep">
                        {isSemanticMode && (
                          <span className="mr-1.5 font-display text-xs text-terracotta/60">
                            {i + 1}.
                          </span>
                        )}
                        {c.title}
                      </span>
                      {isSemanticMode && c.refs.length > 0 && (
                        <span className="ml-2 text-xs text-stone/50">
                          {c.refs.slice(0, 2).join(" · ")}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
                {displayList.length === 0 && (
                  <li className="py-2 text-sm italic text-stone">
                    {isSemanticMode ? "Nothing matched on the Wall." : "No confession by that name."}
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
    </Station>
  );
}
