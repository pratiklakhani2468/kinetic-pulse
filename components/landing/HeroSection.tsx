"use client";

/**
 * HeroSection — faithful port of the HTML design's Hero.
 * Gradient mesh + noise bg, "Public beta" badge, headline, two CTAs, scroll hint.
 */

import { useRouter } from "next/navigation";
import Reveal from "./Reveal";

const ACCENT = "#22C55E";

export default function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden pt-[68px]">
      {/* Static gradient mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute left-1/2 top-[20%] -translate-x-1/2 w-[1100px] h-[1100px] rounded-full opacity-70"
          style={{
            background: `radial-gradient(circle, ${ACCENT}20 0%, transparent 55%)`,
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute right-[-10%] bottom-[-20%] w-[700px] h-[700px] rounded-full opacity-40"
          style={{
            background: "radial-gradient(circle, #4A6FFF14 0%, transparent 60%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-px opacity-30"
          style={{
            background: `linear-gradient(90deg, transparent, ${ACCENT}60 50%, transparent)`,
          }}
        />
      </div>

      {/* Subtle noise */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      <div className="relative max-w-[1240px] mx-auto px-8 w-full text-center">
        {/* Beta badge */}
        <Reveal delay={100}>
          <div className="inline-flex items-center gap-2 px-3 py-[5px] rounded-full border border-white/10 bg-white/[0.02] text-[11px] font-mono tracking-[0.2em] uppercase text-white/50 mb-14">
            <span className="w-[5px] h-[5px] rounded-full" style={{ background: ACCENT }} />
            Public beta · No wearables
          </div>
        </Reveal>

        {/* Headline */}
        <Reveal delay={200}>
          <h1
            data-headline="true"
            className="text-[clamp(3.5rem,10vw,10rem)] leading-[0.9] tracking-[-0.045em] font-medium max-w-[14ch] mx-auto"
          >
            Train with AI.<br />
            <span className="text-white/35">Not </span>
            <span className="italic font-normal">guesswork</span>
            <span style={{ color: ACCENT }}>.</span>
          </h1>
        </Reveal>

        {/* Sub-text */}
        <Reveal delay={400}>
          <p className="mt-12 text-[18px] md:text-[20px] text-white/50 max-w-[36ch] mx-auto leading-[1.45]">
            Your camera sees every rep. Your coach never misses a form break.
          </p>
        </Reveal>

        {/* CTAs */}
        <Reveal delay={550}>
          <div className="mt-14 flex flex-wrap gap-3 items-center justify-center">
            {/* Primary — Start training */}
            <button
              onClick={() => router.push("/auth")}
              className="group relative inline-flex items-center gap-2 pl-7 pr-6 py-[15px] rounded-full text-black font-medium text-[14px] transition"
              style={{
                background: ACCENT,
                boxShadow: `0 20px 60px -10px ${ACCENT}40`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  `0 0 40px ${ACCENT}80, 0 20px 60px -10px ${ACCENT}60`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  `0 20px 60px -10px ${ACCENT}40`;
              }}
            >
              Start training
              <svg
                width="14" height="14" viewBox="0 0 14 14" fill="none"
                className="transition group-hover:translate-x-0.5"
              >
                <path
                  d="M5 2l5 5-5 5"
                  stroke="currentColor" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Secondary — Sign in */}
            <button
              onClick={() => router.push("/auth")}
              className="group inline-flex items-center gap-2.5 pl-5 pr-6 py-[15px] rounded-full text-white/80 font-medium text-[14px] hover:text-white transition"
            >
              <span className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center group-hover:border-white/35 transition">
                <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
                  <path d="M1 0.5l7 4-7 4z" />
                </svg>
              </span>
              Sign in
            </button>
          </div>
        </Reveal>
      </div>

    </section>
  );
}
