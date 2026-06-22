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
      className={`flex flex-col rounded-sm border border-stone/20 bg-linen/95 p-6 transition-opacity ${
        empty ? "opacity-50" : "opacity-100"
      } ${className}`}
    >
      <header className="mb-4 border-b border-stone/20 pb-2">
        <h2 className="font-display text-2xl tracking-wide text-ink">{label}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs uppercase tracking-[0.2em] text-stone">
            {subtitle}
          </p>
        )}
      </header>
      {empty ? (
        <p className="my-auto py-8 text-center text-sm italic text-stone">
          {emptyWord ?? "Nothing here yet."}
        </p>
      ) : (
        children
      )}
    </section>
  );
}
