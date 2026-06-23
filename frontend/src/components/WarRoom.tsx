import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type Confession, type Encounter } from "../api";

/** One thing to proclaim — an inherited confession, or the Pastor's own declaration. */
export type WarRoomItem =
  | { kind: "confession"; id: number; slug: string; title: string }
  | { kind: "declaration"; id: number; title: string; scripture: string | null };

interface WarRoomProps {
  sequence: WarRoomItem[];
  cornerstone: Encounter | null;
  onClose: () => void;
}

// Render a confession body the way the Wall's unroll modal does — headings lifted,
// paragraphs spaced — but at proclamation weight, to be read aloud.
function proclaim(body: string) {
  return body.split(/\n{2,}/).map((para, i) => {
    const h1 = para.match(/^#\s+(.+)/);
    const h2 = para.match(/^##\s+(.+)/);
    if (h2)
      return (
        <p key={i} className="font-display text-lg uppercase tracking-widest text-linen/70">
          {h2[1]}
        </p>
      );
    if (h1)
      return (
        <p key={i} className="font-display text-2xl text-linen/90">
          {h1[1]}
        </p>
      );
    return (
      <p
        key={i}
        className="whitespace-pre-line font-display text-3xl leading-tight sm:text-4xl"
      >
        {para}
      </p>
    );
  });
}

/**
 * The War Room — the Wall's militant mode. Selected words, proclaimed one at a time,
 * full-screen, ending on the cornerstone promise. Advance by tap, → or Space; back with ←;
 * leave with Escape.
 */
export function WarRoom({ sequence, cornerstone, onClose }: WarRoomProps) {
  // The cornerstone (or its quiet absence) is always the closing screen.
  const total = sequence.length + 1;
  const [index, setIndex] = useState(0);
  const [bodies, setBodies] = useState<Record<string, Confession>>({});
  const [failed, setFailed] = useState<Record<string, true>>({});

  // The cornerstone screen is the last step (index === sequence.length); stepping past it leaves.
  const advance = useCallback(() => {
    if (index >= total - 1) {
      onClose();
      return;
    }
    setIndex((i) => i + 1);
  }, [index, total, onClose]);
  const retreat = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        advance();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        retreat();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, retreat, onClose]);

  // The word now in front of the Pastor (null on the closing cornerstone screen).
  const current = index < sequence.length ? sequence[index] : null;

  // Unroll a confession's full text the moment it is reached, and keep it.
  useEffect(() => {
    if (current?.kind === "confession" && !bodies[current.slug] && !failed[current.slug]) {
      let alive = true;
      const { slug } = current;
      api
        .confession(slug)
        .then((c) => {
          if (alive) setBodies((b) => ({ ...b, [slug]: c }));
        })
        .catch(() => {
          // The scroll would not unroll — let the Pastor declare on rather than wait.
          if (alive) setFailed((f) => ({ ...f, [slug]: true }));
        });
      return () => {
        alive = false;
      };
    }
  }, [current, bodies, failed]);

  const content = useMemo(() => {
    if (!current) return null; // closing screen handled below
    if (current.kind === "declaration") {
      return (
        <>
          <div className="flex flex-col gap-4">
            <p className="whitespace-pre-line font-display text-3xl leading-tight sm:text-5xl">
              {current.title}
            </p>
          </div>
          {current.scripture && (
            <p className="mt-8 text-sm uppercase tracking-[0.25em] text-linen/60">
              {current.scripture}
            </p>
          )}
        </>
      );
    }
    if (failed[current.slug])
      return (
        <>
          <p className="mb-4 font-display text-2xl text-linen/80">{current.title}</p>
          <p className="font-serif text-base italic text-linen/55">
            This scroll would not unroll. Declare on, or open it later on the Wall.
          </p>
        </>
      );
    const loaded = bodies[current.slug];
    if (!loaded)
      return <p className="font-serif text-lg italic text-linen/60">Unrolling…</p>;
    return (
      <>
        <h2 className="mb-8 font-display text-xl uppercase tracking-[0.2em] text-linen/55">
          {loaded.title}
        </h2>
        <div className="flex flex-col gap-6">{proclaim(loaded.body)}</div>
        {loaded.refs.length > 0 && (
          <p className="mt-10 text-sm uppercase tracking-[0.25em] text-linen/45">
            {loaded.refs.join(" · ")}
          </p>
        )}
      </>
    );
  }, [current, bodies, failed]);

  const onCornerstone = current === null;

  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col ${
        onCornerstone ? "bg-terracotta-deep text-linen" : "bg-ink text-linen"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="War Room"
      onClick={advance}
    >
      {/* The standing — position in the sequence, and the way out. */}
      <div className="flex shrink-0 items-center justify-between px-6 py-5 sm:px-10">
        <span className="font-display text-sm tracking-[0.3em] text-linen/55">
          {Math.min(index + 1, total)} / {total}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Leave the War Room"
          className="text-2xl leading-none text-linen/60 transition-colors hover:text-linen"
        >
          ✕
        </button>
      </div>

      {/* The word, held alone and large. Tap anywhere to advance. */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-4 sm:px-16">
        <div
          className="settle mx-auto w-full max-w-3xl text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {onCornerstone ? (
            cornerstone ? (
              <>
                <p className="mb-6 font-display text-sm uppercase tracking-[0.3em] text-linen/70">
                  The cornerstone — carried, and kept
                </p>
                {cornerstone.scripture && (
                  <p className="mb-5 text-sm uppercase tracking-[0.25em] text-linen/75">
                    {cornerstone.scripture}
                  </p>
                )}
                <p className="whitespace-pre-line font-display text-3xl leading-tight sm:text-5xl">
                  {cornerstone.words || cornerstone.scripture_text || cornerstone.scripture}
                </p>
              </>
            ) : (
              <p className="font-display text-2xl leading-snug text-linen/85 sm:text-3xl">
                Carry a promise through three seasons to seal the War Room upon the Altar.
              </p>
            )
          ) : (
            content
          )}
        </div>
      </div>

      {/* A quiet hint, kept out of the way of the words. */}
      <div className="flex shrink-0 items-center justify-center gap-6 px-6 py-5 text-xs uppercase tracking-[0.25em] text-linen/40">
        <button
          onClick={(e) => {
            e.stopPropagation();
            retreat();
          }}
          disabled={index === 0}
          className="transition-colors enabled:hover:text-linen disabled:opacity-30"
        >
          ← back
        </button>
        <span className="text-linen/30">tap to declare on</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            advance();
          }}
          className="transition-colors hover:text-linen"
        >
          {index + 1 >= total ? "close" : "next →"}
        </button>
      </div>
    </div>
  );
}
