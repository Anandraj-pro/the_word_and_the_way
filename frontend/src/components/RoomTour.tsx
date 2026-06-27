import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * The first walk through the room. Shown once (then re-openable from the
 * entrance), it lights each station in turn and names, in plain words, what it
 * is for — so a first-time visitor learns the one path before working it.
 */
interface TourStep {
  /** The station section to light; absent = a centred card (welcome / farewell). */
  anchor?: string;
  /** Small function label above the name. */
  eyebrow?: string;
  title: string;
  body: string;
}

interface RoomTourProps {
  /** The Shelves stand as the Archive once any season exists; the Window only when there is testimony. */
  hasShelves: boolean;
  hasWindow: boolean;
  /** Collapse the entrance hero so the walk passes through the actual room. */
  onRequestEnter: () => void;
  /** The walk is finished (or stepped out of). */
  onClose: () => void;
}

export function RoomTour({ hasShelves, hasWindow, onRequestEnter, onClose }: RoomTourProps) {
  const steps = useMemo<TourStep[]>(() => {
    const walk: TourStep[] = [
      {
        title: "Welcome — this is one room.",
        body:
          "Not a dashboard of features, but a single space you enter. Five places sit along one path: a word is received, reflected on, declared, carried season by season, and finally remembered. Here is the walk.",
      },
      {
        anchor: "station-altar",
        eyebrow: "Home",
        title: "The Altar",
        body:
          "Where you begin and return. It holds your progress, and the promises you have carried all the way through — set in stone.",
      },
      {
        anchor: "station-desk",
        eyebrow: "Daily devotions",
        title: "The Desk",
        body:
          "Your daily rhythm: read the Word, keep the watch, and write down what God is saying. Every word you receive begins its journey here.",
      },
      {
        anchor: "station-wall",
        eyebrow: "Declarations",
        title: "The Wall",
        body:
          "Scripture to speak out loud over your life — declarations to hold to the light and pray back to God.",
      },
    ];
    if (hasShelves)
      walk.push({
        anchor: "station-shelves",
        eyebrow: "Seasons",
        title: "The Shelves",
        body:
          "Time kept as seasons. Open a season's spine to read what it held — the words received, wrestled, and declared in it, and what God has already brought to a close.",
      });
    if (hasWindow)
      walk.push({
        anchor: "station-window",
        eyebrow: "Testimonies",
        title: "The Window",
        body:
          "Testimonies of what God carried you through — kept where the light comes in, to encourage you onward.",
      });
    walk.push({
      title: "The room is yours.",
      body:
        "Begin wherever you are drawn. Whatever you receive moves along the one path, from the Desk to the Altar. You can take this walk again from the entrance.",
    });
    return walk;
  }, [hasShelves, hasWindow]);

  const [raw, setRaw] = useState(0);
  const i = Math.min(raw, steps.length - 1); // stay in range if the room changes mid-walk
  const step = steps[i];
  const isLast = i === steps.length - 1;

  // Collapse the entrance hero so the walk is through the room itself.
  useEffect(() => {
    onRequestEnter();
  }, [onRequestEnter]);

  const [rect, setRect] = useState<DOMRect | null>(null);

  const measure = useCallback(() => {
    if (!step.anchor) {
      setRect(null);
      return;
    }
    const el = document.getElementById(step.anchor);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step.anchor]);

  // Bring the station into view, then keep the spotlight glued to it as it settles.
  useEffect(() => {
    if (step.anchor) {
      document.getElementById(step.anchor)?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    measure();
    const onMove = () => measure();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    const track = window.setInterval(measure, 100);
    const stop = window.setTimeout(() => window.clearInterval(track), 800);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
      window.clearInterval(track);
      window.clearTimeout(stop);
    };
  }, [step.anchor, measure]);

  const next = useCallback(() => setRaw((n) => Math.min(n + 1, steps.length - 1)), [steps.length]);
  const back = useCallback(() => setRaw((n) => Math.max(n - 1, 0)), []);

  // Keyboard: Esc steps out, →/Enter advances (or finishes), ← goes back.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        if (isLast) onClose();
        else next();
      } else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLast, next, back, onClose]);

  // Place the card near the lit station (below if there is room, otherwise above).
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const cardW = Math.min(360, vw - 32);
  let cardStyle: React.CSSProperties;
  if (rect) {
    const below = rect.bottom + 220 < vh;
    const left = Math.max(16, Math.min(rect.left + rect.width / 2 - cardW / 2, vw - cardW - 16));
    cardStyle = below
      ? { top: rect.bottom + 16, left, width: cardW }
      : { top: rect.top - 16, left, width: cardW, transform: "translateY(-100%)" };
  } else {
    cardStyle = { top: "50%", left: "50%", width: cardW, transform: "translate(-50%, -50%)" };
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="A walk through the room">
      {/* The dim, with a clear hole over the lit station (or a plain wash when centred). */}
      {rect ? (
        <div
          aria-hidden
          className="tour-spot pointer-events-none fixed"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            borderRadius: 8,
            boxShadow: "0 0 0 9999px rgba(20, 15, 12, 0.74)",
            outline: "1px solid rgba(196, 100, 61, 0.6)",
          }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-ink/80" />
      )}

      {/* Catch stray clicks so the room rests while the walk is open. */}
      <div className="absolute inset-0" />

      <div className="settle fixed" style={cardStyle}>
        <div className="relative rounded-sm border border-stone/30 bg-linen p-6 text-ink shadow-2xl shadow-black/40">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 text-[0.65rem] uppercase tracking-[0.2em] text-stone/70 transition-colors hover:text-terracotta-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            Skip
          </button>

          {step.eyebrow && (
            <p className="mb-1 text-[0.65rem] uppercase tracking-[0.3em] text-terracotta">
              {step.eyebrow}
            </p>
          )}
          <h2 className="font-display text-2xl leading-tight text-ink">
            <span className="mr-1.5 text-terracotta">✦</span>
            {step.title}
          </h2>
          <p className="mt-2.5 font-serif text-[0.95rem] leading-relaxed text-ink/80">{step.body}</p>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div aria-hidden className="flex items-center gap-1.5">
              {steps.map((_, n) => (
                <span
                  key={n}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    n === i ? "w-4 bg-terracotta" : "w-1.5 bg-stone/35"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {i > 0 && (
                <button
                  type="button"
                  onClick={back}
                  className="rounded-sm px-3 py-1.5 font-serif text-sm text-stone transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={isLast ? onClose : next}
                className="rounded-sm bg-terracotta px-4 py-1.5 font-serif text-sm text-linen transition-colors hover:bg-terracotta-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              >
                {isLast ? "Enter the room" : i === 0 ? "Walk through" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
