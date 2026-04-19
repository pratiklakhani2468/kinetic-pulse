"use client";

/**
 * Reveal — scroll-triggered fade + slide wrapper.
 * Faithfully ported from the HTML design's Reveal component.
 *
 * - Uses IntersectionObserver for normal scroll triggering
 * - Falls back to a 1.5 s timer so content is never permanently hidden
 *   (handles iframe sizing edge-cases and SSR)
 */

import { useRef, useEffect, useState, ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Milliseconds to wait after entering viewport before animating */
  delay?: number;
  /** Starting translateY offset in px */
  y?: number;
  className?: string;
}

export default function Reveal({ children, delay = 0, y = 24, className = "" }: RevealProps) {
  const ref   = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let io: IntersectionObserver | null = null;
    // Deduplicate: only call setShown(true) once
    let done = false;
    const show = () => {
      if (done) return;
      setTimeout(() => { done = true; setShown(true); }, delay);
    };

    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { show(); io?.disconnect(); io = null; } },
        { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
      );
      io.observe(el);
    }

    // Guarantee reveal no matter what (handles hidden iframes / unusual viewports)
    const fallback = setTimeout(show, 1500 + delay);

    return () => {
      io?.disconnect();
      clearTimeout(fallback);
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:    shown ? 1 : 0,
        transform:  shown ? "translateY(0)" : `translateY(${y}px)`,
        transition: "opacity 900ms cubic-bezier(0.2,0.8,0.2,1), transform 900ms cubic-bezier(0.2,0.8,0.2,1)",
        willChange: shown ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
