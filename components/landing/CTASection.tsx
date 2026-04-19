"use client";

/**
 * CTASection — faithful port of the HTML design's FinalCTA + Footer.
 *
 * Large headline, single Start training button, footer with logo + nav links.
 */

import { useRouter } from "next/navigation";
import Reveal from "./Reveal";

const ACCENT = "#22C55E";

export default function CTASection() {
  const router = useRouter();

  return (
    <>
      {/* FinalCTA */}
      <section className="relative py-48 overflow-hidden">
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-50"
            style={{
              background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 60%)`,
              filter: "blur(70px)",
            }}
          />
        </div>

        <div className="relative max-w-[1000px] mx-auto px-8 text-center">
          <Reveal>
            <h2 className="text-[clamp(3.5rem,8vw,9rem)] leading-[0.88] tracking-[-0.045em] font-medium">
              Start your first<br />
              <span className="italic font-normal">AI workout</span>
              <span style={{ color: ACCENT }}>.</span>
            </h2>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-16 flex flex-wrap gap-3 justify-center items-center">
              <button
                onClick={() => router.push("/auth")}
                className="inline-flex items-center gap-2 px-7 py-[15px] rounded-full text-black font-medium text-[14px] transition hover:scale-[1.02]"
                style={{
                  background: ACCENT,
                  boxShadow: `0 20px 60px -10px ${ACCENT}40`,
                }}
              >
                Start training
              </button>
            </div>
            <p className="mt-10 text-[12px] font-mono uppercase tracking-[0.25em] text-white/30">
              Free · No credit card · Browser-based
            </p>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-14">
        <div className="max-w-[1240px] mx-auto px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-[10px] h-[10px] rounded-[2px]"
              style={{ background: ACCENT }}
            />
            <span className="text-[13px] font-medium">Kinetic Pulse</span>
          </div>

          {/* Links */}
          <div className="flex gap-10 text-[13px] text-white/45">
            <a href="#" className="hover:text-white transition">About</a>
            <a href="#" className="hover:text-white transition">GitHub</a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); router.push("/auth"); }}
              className="hover:text-white transition"
            >
              Sign in
            </a>
          </div>

          <div className="text-[11px] font-mono text-white/25">© 2026</div>
        </div>
      </footer>
    </>
  );
}
