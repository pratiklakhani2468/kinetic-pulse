"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface Props {
  onComplete: () => void;
}

const BRAND    = "KINETIC";
const BRAND_B  = "PULSE";

export default function LoadingIntro({ onComplete }: Props) {
  const overlayRef    = useRef<HTMLDivElement>(null);
  const irisRef       = useRef<HTMLDivElement>(null);
  const lineARef      = useRef<HTMLDivElement>(null);  // "KINETIC"
  const lineBRef      = useRef<HTMLDivElement>(null);  // "PULSE"
  const taglineRef    = useRef<HTMLParagraphElement>(null);
  const barRef        = useRef<HTMLDivElement>(null);
  const barTrackRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay   = overlayRef.current;
    const iris      = irisRef.current;
    const lineA     = lineARef.current;
    const lineB     = lineBRef.current;
    const tagline   = taglineRef.current;
    const bar       = barRef.current;
    const barTrack  = barTrackRef.current;
    if (!overlay || !iris || !lineA || !lineB || !tagline || !bar || !barTrack) return;

    // Grab every letter span in each line
    const charsA = Array.from(lineA.querySelectorAll<HTMLElement>("[data-char]"));
    const charsB = Array.from(lineB.querySelectorAll<HTMLElement>("[data-char]"));

    // ── Set initial states ──────────────────────────────────────────────────
    gsap.set([charsA, charsB], { yPercent: 105, opacity: 0 });
    gsap.set(tagline,          { opacity: 0, y: 10 });
    gsap.set(bar,              { scaleX: 0, transformOrigin: "left center" });
    gsap.set(iris,             {
      clipPath:  "circle(0% at 50% 50%)",
      opacity:   1,
    });

    // ── Master timeline ─────────────────────────────────────────────────────
    const tl = gsap.timeline({
      defaults: { ease: "expo.out" },
      onComplete: () => {
        // Remove overlay from DOM flow so the page becomes fully interactive
        if (overlay) overlay.style.display = "none";
        onComplete();
      },
    });

    // Phase 1 — letters slide up, line A then line B with slight overlap
    tl.to(charsA, {
      yPercent: 0,
      opacity:  1,
      duration: 1.1,
      stagger:  0.045,
    })
    .to(charsB, {
      yPercent: 0,
      opacity:  1,
      duration: 1.1,
      stagger:  0.045,
    }, "-=0.75")

    // Phase 2 — progress bar draws across
    .to(bar, {
      scaleX:   1,
      duration: 0.8,
      ease:     "expo.inOut",
    }, "-=0.3")

    // Phase 3 — tagline fades in
    .to(tagline, {
      opacity:  1,
      y:        0,
      duration: 0.7,
    }, "-=0.4")

    // Phase 5 — letters, tagline, and bar track fade out (delay acts as the hold)
    .to([charsA, charsB, tagline, bar, barTrack], {
      opacity:  0,
      y:        -8,
      duration: 0.55,
      delay:    0.35,
      stagger:  0.012,
      ease:     "power2.in",
    })

    // Phase 6 — iris expands from center to full screen
    .to(iris, {
      clipPath:  "circle(150% at 50% 50%)",
      duration:  1.0,
      ease:      "expo.inOut",
    }, "-=0.2")

    // Phase 7 — iris (lime fill) fades out revealing the page
    .to(iris, {
      opacity:  0,
      duration: 0.55,
      ease:     "power2.inOut",
    })

    // Phase 8 — overlay itself fades away
    .to(overlay, {
      opacity:  0,
      duration: 0.35,
      ease:     "power1.inOut",
    }, "-=0.2");

    // If the tab goes to background, RAF freezes. Seek to end immediately
    // so the user never returns to a half-finished loading screen.
    function onHidden() {
      if (document.hidden) tl.seek(tl.totalDuration(), false);
    }
    document.addEventListener("visibilitychange", onHidden);

    return () => {
      tl.kill();
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [onComplete]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#080808] overflow-hidden"
    >
      {/* ── Iris circle ── expands to fill screen ─────────────────────────── */}
      <div
        ref={irisRef}
        className="absolute inset-0 pointer-events-none"
        style={{ background: "#10b981" }}
      />

      {/* ── Brand text ────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center gap-1 select-none">

        {/* Line A — "KINETIC" */}
        <div
          ref={lineARef}
          className="flex overflow-hidden"
          aria-label={BRAND}
        >
          {BRAND.split("").map((char, i) => (
            <span
              key={i}
              data-char
              className="inline-block font-black uppercase text-white"
              style={{
                fontSize:      "clamp(3rem, 10vw, 8rem)",
                letterSpacing: "-0.04em",
                lineHeight:    1,
              }}
            >
              {char}
            </span>
          ))}
        </div>

        {/* Line B — "PULSE" */}
        <div
          ref={lineBRef}
          className="flex overflow-hidden -mt-2"
          aria-label={BRAND_B}
        >
          {BRAND_B.split("").map((char, i) => (
            <span
              key={i}
              data-char
              className="inline-block font-black uppercase"
              style={{
                fontSize:         "clamp(3rem, 10vw, 8rem)",
                letterSpacing:    "-0.04em",
                lineHeight:       1,
                color:            "#10b981",
              }}
            >
              {char}
            </span>
          ))}
        </div>

        {/* Progress bar */}
        <div ref={barTrackRef} className="mt-8 w-24 h-px relative overflow-hidden">
          <div
            ref={barRef}
            className="absolute inset-0 bg-emerald"
          />
        </div>

        {/* Tagline */}
        <p
          ref={taglineRef}
          className="mt-4 text-[#333] text-[10px] font-bold tracking-[0.45em] uppercase"
        >
          AI Fitness Platform
        </p>
      </div>
    </div>
  );
}
