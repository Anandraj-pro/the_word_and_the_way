import { useMemo, useState } from "react";
import { api, type Confession, type ConfessionSummary, type Encounter } from "../api";
import { Station } from "./Station";

interface WallProps {
  declarations: Encounter[]; // the Pastor's own words, proclaimed
  confessions: ConfessionSummary[]; // the inherited corpus
}

/**
 * The Wall — Declare. The Pastor's own proclamations sit above the inherited
 * confessions corpus; any confession opens into a scroll to be read aloud.
 */
export function Wall({ declarations, confessions }: WallProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Confession | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return confessions;
    return confessions.filter((c) => c.title.toLowerCase().includes(q));
  }, [confessions, query]);

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
              <span className="text-xs text-stone/60">{confessions.length}</span>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a confession…"
              className="mb-2 w-full border-b border-stone/30 bg-transparent pb-1 font-serif text-sm text-ink placeholder:text-stone/55 focus:border-terracotta focus:outline-none"
            />
            <ul className="flex max-h-72 flex-col overflow-y-auto">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => unroll(c)}
                    className="w-full border-b border-stone/15 py-1.5 text-left font-serif text-sm text-ink/90 transition-colors hover:text-terracotta-deep"
                  >
                    {c.title}
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="py-2 text-sm italic text-stone">
                  No confession by that name.
                </li>
              )}
            </ul>
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
                  {open.body.split(/\n{2,}/).map((para, i) => (
                    <p
                      key={i}
                      className="whitespace-pre-line font-serif text-[1.05rem] leading-relaxed text-ink"
                    >
                      {para}
                    </p>
                  ))}
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
