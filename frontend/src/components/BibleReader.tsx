import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api, type Passage } from "../api";
import { type Book, NEW_TESTAMENT, OLD_TESTAMENT } from "../bibleBooks";

interface BibleReaderProps {
  initialReference: string; // where to open — today's chapter (resume)
  todayReference: string | null; // the goal's current chapter; receive is offered here
  readTodayRefs?: string[]; // chapters already kept today — shown as read, not offered again
  startPicking?: boolean; // open straight into the book/chapter picker (free reading)
  onComplete: () => void; // a reading became an Encounter
  onClose: () => void;
}

/** Loose key so "James  1" and "James 1" mark the same chapter. */
const normRef = (r: string) => r.trim().replace(/\s+/g, " ").toLowerCase();

/** The book — a chapter read verse by verse, with a book/chapter picker and chapter nav. */
export function BibleReader({
  initialReference,
  todayReference,
  readTodayRefs = [],
  startPicking = false,
  onComplete,
  onClose,
}: BibleReaderProps) {
  const [ref, setRef] = useState(initialReference);
  const [passage, setPassage] = useState<Passage | null>(null);
  const [loading, setLoading] = useState(true);
  const [edgeNote, setEdgeNote] = useState<string>();
  const [response, setResponse] = useState("");
  const [marking, setMarking] = useState(false);
  // Which chapters are kept today — each chapter keeps its own mark, so reading one doesn't
  // hide the affordance on the next. Seeded with what was already kept today.
  const [readRefs, setReadRefs] = useState<Set<string>>(() => new Set(readTodayRefs.map(normRef)));
  const [picking, setPicking] = useState(startPicking);
  const [pickBook, setPickBook] = useState<Book | null>(null);
  // Verses kept for meditation in this chapter (numbers), the one being considered, and its note.
  const [keptVerses, setKeptVerses] = useState<Set<number>>(new Set());
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [verseNote, setVerseNote] = useState("");
  const [keeping, setKeeping] = useState(false);

  const fetchPassage = useCallback(async (reference: string) => {
    setLoading(true);
    setEdgeNote(undefined);
    setSelectedVerse(null);
    setVerseNote("");
    try {
      const p = await api.passage(reference);
      setPassage(p);
      setRef(p.reference);
      // Which verses here are already kept — for the highlight on re-read.
      try {
        setKeptVerses(new Set(await api.keptVerses(p.reference)));
      } catch {
        setKeptVerses(new Set());
      }
    } catch {
      // A 404 here means we paged past the last chapter of the book.
      setEdgeNote("That's the end of the book.");
    } finally {
      setLoading(false);
    }
  }, []);

  const choose = (reference: string) => {
    setPicking(false);
    setPickBook(null);
    fetchPassage(reference);
  };

  useEffect(() => {
    fetchPassage(initialReference);
  }, [fetchPassage, initialReference]);

  // Lock the room behind so only the verses scroll while the book is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const onToday = todayReference !== null && normRef(ref) === normRef(todayReference);
  const readToday = readRefs.has(normRef(ref));

  const markRead = async () => {
    if (marking) return;
    setMarking(true);
    try {
      // Pass the chapter actually open — the plan's chapter advances the plan; any other
      // chapter is logged as a free reading that still keeps today's streak.
      await api.completeReading(response.trim() || undefined, ref);
      setReadRefs((prev) => new Set(prev).add(normRef(ref)));
      setResponse("");
      onComplete();
    } finally {
      setMarking(false);
    }
  };

  const selectedText =
    selectedVerse !== null ? passage?.verses.find((v) => v.verse === selectedVerse)?.text : undefined;

  // Keep a single verse — it becomes a received Encounter in the open season, ready to carry.
  const keepVerse = async () => {
    if (selectedVerse === null || keeping || !passage) return;
    setKeeping(true);
    try {
      await api.keepVerse(
        `${passage.reference}:${selectedVerse}`,
        selectedText,
        verseNote.trim() || undefined,
      );
      setKeptVerses((prev) => new Set(prev).add(selectedVerse));
      setSelectedVerse(null);
      setVerseNote("");
      onComplete(); // the kept verse lands on the Desk to be carried toward the Altar
    } finally {
      setKeeping(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 px-4 py-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="settle flex max-h-[85vh] w-full max-w-2xl flex-col rounded-sm border border-terracotta/30 bg-linen px-8 pb-6 pt-8 shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned header — the title opens the book/chapter picker. */}
        <div className="flex shrink-0 items-start justify-between gap-4 pb-4">
          <button
            onClick={() => {
              setPickBook(null);
              setPicking((p) => !p);
            }}
            className="group flex items-baseline gap-2 text-left"
          >
            <span className="font-display text-3xl leading-none text-terracotta-deep">
              {picking ? "Choose a passage" : passage?.reference ?? ref}
            </span>
            {!picking && (
              <span className="text-sm text-stone/60 transition-colors group-hover:text-terracotta">
                ▾
              </span>
            )}
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-xl leading-none text-stone transition-colors hover:text-terracotta-deep"
          >
            ✕
          </button>
        </div>

        {picking ? (
          /* The book/chapter picker — read anywhere, freely. */
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {pickBook === null ? (
              <div className="flex flex-col gap-4">
                {[
                  { label: "Old Testament", books: OLD_TESTAMENT },
                  { label: "New Testament", books: NEW_TESTAMENT },
                ].map((section) => (
                  <div key={section.label}>
                    <p className="mb-1.5 text-xs uppercase tracking-[0.25em] text-stone/60">
                      {section.label}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                      {section.books.map((b) => (
                        <button
                          key={b.name}
                          onClick={() => setPickBook(b)}
                          className="font-serif text-sm text-ink/90 transition-colors hover:text-terracotta-deep"
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setPickBook(null)}
                  className="mb-3 font-serif text-sm text-terracotta hover:text-terracotta-deep"
                >
                  ← all books
                </button>
                <p className="mb-2 font-display text-xl text-terracotta-deep">{pickBook.name}</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: pickBook.chapters }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => choose(`${pickBook.name} ${n}`)}
                      className="flex h-9 w-9 items-center justify-center rounded-sm border border-stone/30 font-serif text-sm text-ink transition-colors hover:border-terracotta hover:bg-terracotta/10"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* The page — verses flowing with superscript numbers, scrolling inside the book. */
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {loading ? (
              <p className="font-serif text-sm italic text-stone">Opening the book…</p>
            ) : edgeNote ? (
              <p className="font-serif text-sm italic text-stone">{edgeNote}</p>
            ) : (
              <p className="font-serif text-[1.05rem] leading-loose text-ink">
                {passage?.verses.map((v) => {
                  const kept = v.verse != null && keptVerses.has(v.verse);
                  const selected = v.verse != null && selectedVerse === v.verse;
                  return (
                    <span
                      key={v.verse ?? Math.random()}
                      onClick={() =>
                        v.verse != null && setSelectedVerse(selected ? null : v.verse)
                      }
                      className={`cursor-pointer rounded-sm px-0.5 transition-colors ${
                        selected
                          ? "bg-terracotta/25"
                          : kept
                            ? "bg-terracotta/10 hover:bg-terracotta/20"
                            : "hover:bg-stone/10"
                      }`}
                    >
                      <sup className="mr-0.5 align-super text-[0.6rem] font-medium text-terracotta">
                        {v.verse}
                      </sup>
                      <span>{v.text} </span>
                    </span>
                  );
                })}
              </p>
            )}
          </div>
        )}

        {/* Pinned chapter navigation + receive — hidden while picking. */}
        {!picking && (
        <>
        <div className="mt-4 flex shrink-0 items-center justify-between border-t border-stone/20 pt-4">
          <button
            onClick={() => passage?.previous_reference && fetchPassage(passage.previous_reference)}
            disabled={!passage?.previous_reference || loading}
            className="font-serif text-sm text-terracotta transition-colors hover:text-terracotta-deep disabled:invisible"
          >
            ← {passage?.previous_reference}
          </button>
          <span className="text-xs uppercase tracking-[0.25em] text-stone/50">
            {passage?.translation}
          </span>
          <button
            onClick={() => passage?.next_reference && fetchPassage(passage.next_reference)}
            disabled={!passage?.next_reference || loading}
            className="font-serif text-sm text-terracotta transition-colors hover:text-terracotta-deep disabled:invisible"
          >
            {passage?.next_reference} →
          </button>
        </div>

        {/* Keep a verse — tap one above to dwell on it; it joins the carry loop. */}
        {selectedVerse !== null && passage && (
          <div className="mt-4 flex shrink-0 flex-col gap-2 rounded-sm border border-terracotta/30 bg-linen-deep/60 px-4 py-3">
            <p className="font-display text-sm text-terracotta-deep">
              {passage.reference}:{selectedVerse}
              {keptVerses.has(selectedVerse) && (
                <span className="ml-2 font-serif text-xs italic text-stone/60">already kept</span>
              )}
            </p>
            {selectedText && (
              <p className="font-serif text-sm italic leading-snug text-ink/80">“{selectedText}”</p>
            )}
            <textarea
              value={verseNote}
              onChange={(e) => setVerseNote(e.target.value)}
              placeholder="a word to keep with it, if one came…"
              rows={2}
              className="resize-none border-b border-stone/30 bg-transparent pb-1 font-serif text-sm leading-snug text-ink placeholder:text-stone/55 focus:border-terracotta focus:outline-none"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={keepVerse}
                disabled={keeping}
                className="self-start rounded-sm bg-terracotta px-4 py-1.5 font-serif text-sm text-linen transition-colors hover:bg-terracotta-deep disabled:opacity-50"
              >
                {keeping ? "Keeping…" : "✦ Keep this verse"}
              </button>
              <button
                onClick={() => {
                  setSelectedVerse(null);
                  setVerseNote("");
                }}
                className="font-serif text-xs italic text-stone/60 hover:text-terracotta-deep"
              >
                cancel
              </button>
            </div>
          </div>
        )}

        {/* A quiet hint that verses can be kept — only when nothing is selected. */}
        {selectedVerse === null && passage && !edgeNote && (
          <p className="mt-2 shrink-0 text-center text-[0.65rem] italic text-stone/45">
            tap a verse to keep it for meditation
          </p>
        )}

        {/* Receive — mark any chapter as today's reading; off-plan chapters keep the
            streak without consuming the John plan. */}
        {selectedVerse === null && !readToday && passage && !edgeNote && (
          <div className="mt-4 flex shrink-0 flex-col gap-2 rounded-sm bg-linen-deep/50 px-4 py-3">
            {!onToday && todayReference && (
              <p className="font-serif text-xs italic text-stone/60">
                Off your plan (today is {todayReference}) — marking this keeps your streak but
                leaves the plan where it is.
              </p>
            )}
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="What is God saying through it?"
              rows={2}
              className="resize-none border-b border-stone/30 bg-transparent pb-1 font-serif text-sm leading-snug text-ink placeholder:text-stone/55 focus:border-terracotta focus:outline-none"
            />
            <button
              onClick={markRead}
              disabled={marking}
              className="self-start rounded-sm bg-terracotta px-4 py-1.5 font-serif text-sm text-linen transition-colors hover:bg-terracotta-deep disabled:opacity-50"
            >
              {response.trim()
                ? "Read & receive"
                : onToday
                  ? "Mark as read"
                  : "Mark as today's reading"}
            </button>
          </div>
        )}
        {readToday && (
          <p className="mt-4 shrink-0 font-serif text-sm italic text-stone">
            ✓ Read today. {passage?.next_reference && `Read on, or return tomorrow.`}
          </p>
        )}
        </>
        )}
      </div>
    </div>,
    document.body,
  );
}
