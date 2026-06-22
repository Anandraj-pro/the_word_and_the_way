import type { ReactNode } from "react";

interface StationProps {
  label: string;
  subtitle?: string;
  /** Progressive Revelation: a station with no data is dim, never absent. */
  empty?: boolean;
  emptyWord?: string;
  children: ReactNode;
  className?: string;
}

/** A framed place in the room. Furniture, not a nav page. */
export function Station({
  label,
  subtitle,
  empty,
  emptyWord,
  children,
  className = "",
}: StationProps) {
  return (
    <section
      className={`relative flex h-full flex-col overflow-hidden rounded-sm border border-stone/15 bg-linen p-6 shadow-[0_24px_50px_-32px_rgba(0,0,0,0.85)] transition-opacity ${
        empty ? "opacity-60" : "opacity-100"
      } ${className}`}
    >
      {/* A hairline of warmth along the top edge — light catching the furniture. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-terracotta/30 to-transparent"
      />
      <header className="mb-4 flex items-baseline justify-between gap-3 border-b border-stone/20 pb-2.5">
        <h2 className="font-display text-2xl leading-none tracking-wide text-ink">{label}</h2>
        {subtitle && (
          <p className="text-[0.65rem] uppercase tracking-[0.25em] text-stone">
            {subtitle}
          </p>
        )}
      </header>
      {empty ? (
        <p className="my-auto py-8 text-center text-sm italic text-stone">
          {emptyWord ?? "Nothing here yet."}
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      )}
    </section>
  );
}
