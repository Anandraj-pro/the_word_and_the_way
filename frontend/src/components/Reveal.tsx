import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Forwarded so existing anchors (#station-*) keep working. */
  id?: string;
  className?: string;
  /** Stagger, in ms, before this element settles in. */
  delay?: number;
}

/**
 * Settles its child into view the first time it scrolls near the viewport.
 * Renders a plain wrapper div (no extra nesting beyond what the layout already had),
 * so grid stretching and scroll anchors are untouched. Honors prefers-reduced-motion
 * via the .reveal CSS — when motion is off, the child is simply present.
 */
export function Reveal({ children, id, className = "", delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect(); // reveal once, then stay
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      id={id}
      ref={ref}
      className={`reveal ${shown ? "is-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
