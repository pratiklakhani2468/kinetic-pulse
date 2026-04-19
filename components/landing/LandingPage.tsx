"use client";

/**
 * LandingPage — root landing component.
 *
 * Responsibilities:
 *  1. Inject Google Fonts (Inter Tight, Geist Mono, Instrument Serif) via useEffect
 *  2. Gate rendering behind the LoadingIntro animation
 *  3. Render the HTML-faithful Nav (scroll-blur backdrop, anchor links)
 *  4. Compose all sections in order
 *
 * Auth logic is intentionally ABSENT — this page always renders regardless of
 * login state. CTAs link to /dashboard; the dashboard's useRequireAuth handles
 * unauthenticated access from there.
 */

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingIntro from "@/components/LoadingIntro";
import HeroSection      from "./HeroSection";
import ProductSection   from "./ProductSection";
import GhostSection     from "./GhostSection";
import AnalyticsSection from "./AnalyticsSection";
import CTASection       from "./CTASection";

const ACCENT = "#22C55E";

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", h, { passive: true });
    h();
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-2xl border-b border-white/[0.04]"
          : "bg-transparent"
      }`}
      style={scrolled ? { background: "rgba(5,6,10,0.70)" } : undefined}
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-8 h-[68px] flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div
            className="w-[12px] h-[12px] rounded-[3px]"
            style={{ background: ACCENT, boxShadow: `0 0 18px ${ACCENT}80` }}
          />
          <span className="text-[14px] font-medium tracking-[-0.01em] whitespace-nowrap">
            Kinetic Pulse
          </span>
        </div>

        {/* Anchor links */}
        <div className="hidden md:flex items-center gap-8 text-[13px] text-white/45 whitespace-nowrap">
          <a className="hover:text-white transition" href="#product">Product</a>
          <a className="hover:text-white transition" href="#ghost">Ghost mode</a>
          <a className="hover:text-white transition" href="#analytics">Analytics</a>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push("/auth")}
          className="text-[13px] font-medium text-black px-[14px] py-[7px] rounded-full transition hover:scale-[1.02] whitespace-nowrap flex-shrink-0"
          style={{ background: ACCENT }}
        >
          Get started
        </button>
      </div>
    </nav>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  // Inject Google Fonts (Inter Tight, Geist Mono, Instrument Serif)
  useEffect(() => {
    if (document.getElementById("kp-gfonts")) return;
    const link = document.createElement("link");
    link.id   = "kp-gfonts";
    link.rel  = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap";
    document.head.appendChild(link);
  }, []);

  // Intro is visible until the GSAP animation calls onComplete
  const [introVisible, setIntroVisible] = useState(true);
  const handleIntroComplete = useCallback(() => setIntroVisible(false), []);

  return (
    <>
      {/* Loading intro — runs once, then calls handleIntroComplete */}
      {introVisible && <LoadingIntro onComplete={handleIntroComplete} />}

      {/* Page — hidden (opacity 0) until intro completes, then fades in */}
      <div
        className="overflow-x-hidden"
        style={{
          background: "#05060A",
          color: "#EDEDED",
          fontFamily: "'Inter Tight', ui-sans-serif, system-ui, sans-serif",
          opacity: introVisible ? 0 : 1,
          transition: introVisible ? "none" : "opacity 0.65s ease",
        }}
      >
        <Nav />
        <main>
          <HeroSection />
          <ProductSection />
          <GhostSection />
          <AnalyticsSection />
          <CTASection />
        </main>
      </div>
    </>
  );
}
