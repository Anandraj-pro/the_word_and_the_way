import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  /** Width override for the lit surface — defaults to a reading column. */
  className?: string;
}

/**
 * A lit surface raised over the dark room. Rendered through a portal to the document
 * body so it always covers the whole viewport — a station's reveal transform can't
 * trap it in one column. Closes on the backdrop or Escape; the card scrolls within
 * itself when a long word overflows, so it never runs off the screen.
 */
export function Modal({ onClose, children, className = "max-w-2xl" }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Hold the room still behind the surface.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/80 px-4 py-8 backdrop-blur-sm sm:py-12"
      onClick={onClose}
    >
      <div
        className={`settle my-auto w-full ${className} max-h-[86vh] overflow-y-auto rounded-md border border-terracotta/30 bg-linen shadow-2xl shadow-black/50`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
