import { useState } from "react";

// --- The five stations of the one room ---
// Each panel is a place, not a page. Rather than stock photography, every station
// carries a bespoke line-art scene drawn in the Ember & Stone palette — so the
// imagery *is* the station: a candle on stone for the Altar, an open book for the
// Desk, spines on a shelf, courses of stone, an arched window of light.
type Motif = "altar" | "desk" | "shelves" | "wall" | "window";

export interface StationPanel {
  id: number;
  /** The station's name, e.g. "The Desk". */
  title: string;
  /** Plain function shown beneath the name, e.g. "Daily devotions". */
  subtitle: string;
  /** One word for the function — paired with the name in navigation. */
  nav: string;
  /** A line spoken when the panel opens. */
  line: string;
  /** Which bespoke scene to draw behind the panel. */
  motif: Motif;
  /** The id of the station section to scroll to when chosen. */
  anchor: string;
  /** Optional photo override; when set, replaces the drawn scene. */
  imageUrl?: string;
}

const STATIONS: StationPanel[] = [
  {
    id: 1,
    title: "The Altar",
    subtitle: "Home & remembrance",
    nav: "Home",
    line: "Your progress, and the words carried through to stone.",
    motif: "altar",
    anchor: "station-altar",
  },
  {
    id: 2,
    title: "The Desk",
    subtitle: "Daily devotions",
    nav: "Devotions",
    line: "Read the Word, keep the watch, and receive what God is saying.",
    motif: "desk",
    anchor: "station-desk",
  },
  {
    id: 3,
    title: "The Shelves",
    subtitle: "Seasons",
    nav: "Seasons",
    line: "Time kept in seasons — what is open, what has closed.",
    motif: "shelves",
    anchor: "station-shelves",
  },
  {
    id: 4,
    title: "The Wall",
    subtitle: "Declarations",
    nav: "Declarations",
    line: "Scriptural declarations to speak outward and hold to the light.",
    motif: "wall",
    anchor: "station-wall",
  },
  {
    id: 5,
    title: "The Window",
    subtitle: "Testimonies",
    nav: "Testimonies",
    line: "Testimonies of what God carried you through.",
    motif: "window",
    anchor: "station-window",
  },
];

// Ember & Stone, as raw hex for SVG fills/strokes.
const C = {
  terracotta: "#c4643d",
  terracottaDeep: "#a44a28",
  stone: "#8b6b5a",
  linen: "#f0ebe4",
  linenDeep: "#e4dccf",
  ink: "#2c2420",
} as const;

// --- The drawn scene behind each station ---
function StationScene({ motif }: { motif: Motif }) {
  const gid = `grad-${motif}`;
  const glow = `glow-${motif}`;
  return (
    <svg
      viewBox="0 0 360 420"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a2f28" />
          <stop offset="100%" stopColor={C.ink} />
        </linearGradient>
        <radialGradient id={glow} cx="50%" cy="38%" r="55%">
          <stop offset="0%" stopColor={C.terracotta} stopOpacity="0.35" />
          <stop offset="100%" stopColor={C.terracotta} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="360" height="420" fill={`url(#${gid})`} />
      <rect width="360" height="420" fill={`url(#${glow})`} />

      {motif === "altar" && (
        <g>
          {/* candle glow + flame */}
          <circle cx="180" cy="150" r="70" fill={C.terracotta} opacity="0.18" />
          <path
            d="M180 120 C170 138 176 150 180 158 C184 150 190 138 180 120 Z"
            fill={C.terracotta}
          />
          <path d="M180 134 C176 142 178 150 180 154 C182 150 184 142 180 134 Z" fill={C.linen} />
          <rect x="174" y="158" width="12" height="60" rx="2" fill={C.linenDeep} opacity="0.85" />
          {/* stone slab */}
          <rect x="96" y="226" width="168" height="44" rx="3" fill={C.stone} opacity="0.9" />
          <rect x="96" y="226" width="168" height="10" rx="3" fill={C.linenDeep} opacity="0.25" />
          <line x1="120" y1="248" x2="240" y2="248" stroke={C.ink} strokeOpacity="0.3" strokeWidth="2" />
        </g>
      )}

      {motif === "desk" && (
        <g stroke={C.linenDeep} strokeOpacity="0.85" strokeWidth="2.5" fill="none">
          {/* open book — two pages from a centre spine */}
          <path d="M180 150 C150 138 120 138 96 150 L96 264 C120 252 150 252 180 264 Z" fill={C.linen} fillOpacity="0.08" />
          <path d="M180 150 C210 138 240 138 264 150 L264 264 C240 252 210 252 180 264 Z" fill={C.linen} fillOpacity="0.08" />
          <line x1="180" y1="150" x2="180" y2="264" stroke={C.terracotta} strokeOpacity="0.9" />
          {/* text lines */}
          <line x1="112" y1="176" x2="164" y2="170" strokeWidth="2" strokeOpacity="0.5" />
          <line x1="112" y1="192" x2="164" y2="187" strokeWidth="2" strokeOpacity="0.5" />
          <line x1="112" y1="208" x2="164" y2="203" strokeWidth="2" strokeOpacity="0.5" />
          <line x1="196" y1="170" x2="248" y2="176" strokeWidth="2" strokeOpacity="0.5" />
          <line x1="196" y1="187" x2="248" y2="192" strokeWidth="2" strokeOpacity="0.5" />
          <line x1="196" y1="203" x2="248" y2="208" strokeWidth="2" strokeOpacity="0.5" />
        </g>
      )}

      {motif === "shelves" && (
        <g>
          {/* shelf rails */}
          {[140, 230, 320].map((y) => (
            <rect key={y} x="80" y={y} width="200" height="6" fill={C.stone} opacity="0.85" />
          ))}
          {/* book spines */}
          {[
            { x: 88, y: 96, w: 16, h: 44, c: C.terracotta },
            { x: 108, y: 84, w: 14, h: 56, c: C.linenDeep },
            { x: 126, y: 100, w: 18, h: 40, c: C.stone },
            { x: 148, y: 90, w: 12, h: 50, c: C.terracottaDeep },
            { x: 164, y: 96, w: 16, h: 44, c: C.linen },
            { x: 184, y: 86, w: 14, h: 54, c: C.terracotta },
            { x: 202, y: 100, w: 18, h: 40, c: C.linenDeep },
            { x: 224, y: 92, w: 12, h: 48, c: C.stone },
            { x: 240, y: 96, w: 16, h: 44, c: C.terracottaDeep },
            { x: 90, y: 188, w: 14, h: 42, c: C.linenDeep },
            { x: 108, y: 178, w: 16, h: 52, c: C.terracotta },
            { x: 128, y: 192, w: 12, h: 38, c: C.stone },
            { x: 144, y: 184, w: 18, h: 46, c: C.linen },
            { x: 166, y: 190, w: 14, h: 40, c: C.terracottaDeep },
            { x: 184, y: 180, w: 16, h: 50, c: C.terracotta },
            { x: 204, y: 192, w: 12, h: 38, c: C.linenDeep },
            { x: 220, y: 186, w: 18, h: 44, c: C.stone },
            { x: 242, y: 190, w: 14, h: 40, c: C.terracotta },
          ].map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx="1.5" fill={b.c} opacity="0.88" />
          ))}
        </g>
      )}

      {motif === "wall" && (
        <g>
          {/* courses of stone, offset row to row */}
          {[
            { y: 120, off: 0 },
            { y: 162, off: 36 },
            { y: 204, off: 0 },
            { y: 246, off: 36 },
            { y: 288, off: 0 },
          ].map((row) =>
            [0, 1, 2, 3].map((i) => {
              const w = 64;
              const x = 60 + i * (w + 8) - row.off;
              return (
                <rect
                  key={`${row.y}-${i}`}
                  x={x}
                  y={row.y}
                  width={w}
                  height="34"
                  rx="3"
                  fill={i % 2 === 0 ? C.stone : C.terracottaDeep}
                  opacity="0.55"
                  stroke={C.ink}
                  strokeOpacity="0.4"
                  strokeWidth="2"
                />
              );
            }),
          )}
        </g>
      )}

      {motif === "window" && (
        <g>
          {/* light spilling through */}
          <path d="M132 96 L228 96 L300 380 L60 380 Z" fill={C.terracotta} opacity="0.12" />
          {/* arched frame */}
          <path
            d="M132 150 A48 48 0 0 1 228 150 L228 300 L132 300 Z"
            fill={C.ink}
            fillOpacity="0.25"
            stroke={C.linenDeep}
            strokeWidth="4"
          />
          {/* mullions */}
          <line x1="180" y1="106" x2="180" y2="300" stroke={C.linenDeep} strokeWidth="4" />
          <line x1="132" y1="210" x2="228" y2="210" stroke={C.linenDeep} strokeWidth="4" />
          <line x1="132" y1="150" x2="228" y2="150" stroke={C.linenDeep} strokeWidth="3" strokeOpacity="0.6" />
        </g>
      )}
    </svg>
  );
}

interface AccordionItemProps {
  item: StationPanel;
  isActive: boolean;
  onMouseEnter: () => void;
  onSelect: () => void;
}

// --- A single station panel ---
function AccordionItem({ item, isActive, onMouseEnter, onSelect }: AccordionItemProps) {
  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onFocus={onMouseEnter}
      onClick={onSelect}
      aria-label={`${item.title} — ${item.subtitle}`}
      aria-expanded={isActive}
      className={`
        group relative h-[340px] shrink-0 overflow-hidden rounded-sm sm:h-[420px]
        cursor-pointer border transition-all duration-700 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta
        ${
          isActive
            ? "w-[72vw] max-w-[360px] border-terracotta/60 sm:w-[300px]"
            : "w-[46px] border-stone/30 sm:w-[52px]"
        }
      `}
    >
      {/* The station's scene (or a photo override) */}
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover saturate-[0.6]"
        />
      ) : (
        <StationScene motif={item.motif} />
      )}

      {/* Ember & Stone wash — deepens the foot for the caption, warms when open */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
      <div
        className={`absolute inset-0 bg-terracotta/15 transition-opacity duration-700 ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Open caption — horizontal, settled at the foot of the panel */}
      <div
        className={`absolute inset-x-0 bottom-0 p-5 text-left transition-all duration-500 ${
          isActive
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <p className="text-[0.65rem] uppercase tracking-[0.25em] text-terracotta">
          {item.subtitle}
        </p>
        <h3 className="font-display text-2xl leading-tight text-linen">{item.title}</h3>
        <p className="mt-1.5 max-w-[18rem] font-serif text-sm italic leading-snug text-linen/80">
          {item.line}
        </p>
      </div>

      {/* Closed caption — the station's name turned on its side, never clipped */}
      <span
        className={`absolute inset-0 flex items-center justify-end pb-6 font-display text-lg tracking-wide text-linen/90 transition-opacity duration-300 [writing-mode:vertical-rl] ${
          isActive ? "opacity-0" : "opacity-100"
        }`}
      >
        {item.title}
      </span>
    </button>
  );
}

// --- A small line-drawn glyph of each station, for the bars. ---
export function StationGlyph({ motif, className = "" }: { motif: Motif; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {motif === "altar" && (
        <>
          <path d="M12 3c-1.6 2.2-.8 3.6 0 4.8.8-1.2 1.6-2.6 0-4.8Z" fill="currentColor" stroke="none" />
          <path d="M12 9v4" />
          <rect x="5" y="16" width="14" height="4" rx="1" />
        </>
      )}
      {motif === "desk" && (
        <>
          <path d="M12 6C9.8 4.9 7.4 4.9 5 6v12c2.4-1.1 4.8-1.1 7 0 2.2-1.1 4.6-1.1 7 0V6c-2.4-1.1-4.8-1.1-7 0Z" />
          <path d="M12 6v12" />
        </>
      )}
      {motif === "shelves" && (
        <>
          <path d="M4 20h16" />
          <rect x="6" y="8" width="3" height="12" />
          <rect x="10.5" y="5" width="3" height="15" />
          <rect x="15" y="10" width="3" height="10" />
        </>
      )}
      {motif === "wall" && (
        <>
          <path d="M4 6h16v14H4Z" />
          <path d="M4 11h16M4 16h16" />
          <path d="M12 6v5M8 11v5M16 11v5M12 16v4" />
        </>
      )}
      {motif === "window" && (
        <>
          <path d="M7 20v-9a5 5 0 0 1 10 0v9" />
          <path d="M12 7v13M7 14h10M5 20h14" />
        </>
      )}
    </svg>
  );
}

interface RoomThresholdProps {
  /** The stations to list; defaults to the room's five. */
  items?: StationPanel[];
  /** Jump to a station's section. */
  onGo: (anchor: string) => void;
  /** Return to the Altar — the room's home. */
  onHome: () => void;
  /** Open the guided walk through the room. */
  onTour?: () => void;
  /** Anchors currently in view — these stay lit; the rest rest quietly. */
  active?: ReadonlySet<string>;
}

// --- The slim, sticky bar along the room's ceiling. ---
// Every station is always in reach — nothing necessary hides behind a hover.
// The station you stand nearest stays lit; the rest wait, visible, in linen.
export function RoomThreshold({ items = STATIONS, onGo, onHome, onTour, active }: RoomThresholdProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone/20 bg-ink/90 backdrop-blur supports-[backdrop-filter]:bg-ink/75">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
        <button
          type="button"
          onClick={onHome}
          aria-label="Return to the Altar"
          className="group flex min-w-0 items-center gap-2"
        >
          <span className="text-terracotta">✦</span>
          <span className="truncate font-display text-base tracking-wide text-linen">
            The Word and the Way
          </span>
        </button>
        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-0.5 sm:flex" aria-label="The stations">
            {items.map((it) => {
              const isActive = active?.has(it.anchor) ?? false;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => onGo(it.anchor)}
                  aria-current={isActive ? "true" : undefined}
                  title={`${it.title} — ${it.subtitle.toLowerCase()}`}
                  className={`relative whitespace-nowrap rounded-sm px-2.5 py-1 font-serif text-sm transition-colors hover:bg-terracotta/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
                    isActive ? "text-terracotta" : "text-linen/70 hover:text-linen"
                  }`}
                >
                  {it.title.replace(/^The\s+/, "")}
                  <span
                    className={`absolute inset-x-2.5 -bottom-px h-px bg-terracotta transition-opacity duration-300 ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </button>
              );
            })}
          </nav>
          {onTour && (
            <button
              type="button"
              onClick={onTour}
              className="whitespace-nowrap rounded-sm border border-stone/30 px-2.5 py-1 font-serif text-xs text-stone transition-colors hover:border-terracotta hover:text-terracotta focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
            >
              ✦ Take a walk
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

interface StationBarProps {
  items?: StationPanel[];
  onGo: (anchor: string) => void;
  active?: ReadonlySet<string>;
}

// --- The station bar, in hand. ---
// Below the sm breakpoint the ceiling bar has no room for five names, so the
// stations sit under the thumb instead: five glyphs along the room's floor.
export function StationBar({ items = STATIONS, onGo, active }: StationBarProps) {
  return (
    <nav
      aria-label="The stations"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone/25 bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-ink/85 sm:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch">
        {items.map((it) => {
          const isActive = active?.has(it.anchor) ?? false;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onGo(it.anchor)}
              aria-current={isActive ? "true" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-1 pb-2 pt-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
                isActive ? "text-terracotta" : "text-linen/60"
              }`}
            >
              <StationGlyph motif={it.motif} className="h-5 w-5" />
              <span className="text-[0.58rem] uppercase tracking-[0.14em]">
                {it.title.replace(/^The\s+/, "")}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

interface RoomAccordionProps {
  /** Override the panels; defaults to the room's five stations. */
  items?: StationPanel[];
  /** Which panel opens first (index). Defaults to the Desk. */
  initialIndex?: number;
  /** Called with a panel's anchor id when chosen — wire this to scroll. */
  onEnter?: (anchor: string) => void;
  /** Open the guided walk through the room. */
  onTour?: () => void;
}

// --- The entry hero: "Enter the room." ---
export function RoomAccordion({ items = STATIONS, initialIndex = 1, onEnter, onTour }: RoomAccordionProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const active = items[activeIndex] ?? items[0];

  return (
    <section className="overflow-hidden rounded-sm border border-stone/20 bg-ink">
      <div className="flex flex-col items-center gap-10 px-6 py-12 lg:flex-row lg:justify-between lg:gap-12 lg:px-12">
        {/* Left: the invitation */}
        <div className="w-full text-center lg:w-[42%] lg:text-left">
          <p className="text-xs uppercase tracking-[0.3em] text-stone">
            The Word and the Way
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight text-linen md:text-6xl">
            Enter the room.
          </h1>
          <p className="mx-auto mt-5 max-w-md font-serif text-lg leading-relaxed text-linen/70 lg:mx-0">
            One space — five stations. A word is received at the Desk, declared on
            the Wall, and carried, season by season, until it is inscribed on the
            Altar.
          </p>
          <button
            type="button"
            onClick={() => onEnter?.(active.anchor)}
            className="group mt-8 inline-flex items-center gap-2 rounded-sm bg-terracotta px-7 py-3 font-serif text-base text-linen shadow-lg shadow-black/30 transition-colors hover:bg-terracotta-deep"
          >
            Go to {active.title}
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </button>

          {onTour && (
            <p className="mt-4 text-sm text-linen/50">
              New here?{" "}
              <button
                type="button"
                onClick={onTour}
                className="font-serif text-terracotta underline-offset-4 transition-colors hover:text-linen hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
              >
                Take a walk through the room
              </button>
            </p>
          )}
        </div>

        {/* Right: the stations, side by side. w-max + auto margins centre the row
            when it fits and keep its start reachable when it must scroll. */}
        <div className="w-full overflow-x-auto lg:w-[58%]">
          <div className="mx-auto flex w-max flex-row items-center gap-2.5 p-1 sm:gap-3">
            {items.map((item, index) => (
              <AccordionItem
                key={item.id}
                item={item}
                isActive={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onSelect={() => onEnter?.(item.anchor)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
