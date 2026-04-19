"use client";

/**
 * GhostSection — faithful port of the HTML design's GhostMode + GhostStage.
 *
 * Uses the Skeleton component (the ONLY section that does).
 * Ghost = blurred white standing figure, Live = sharp green squat figure.
 * Both breathe via the `breathe` CSS keyframe.
 */

import Reveal from "./Reveal";
import Skeleton from "./Skeleton";

const ACCENT = "#22C55E";

// ─── GhostStage ───────────────────────────────────────────────────────────────

function GhostStage() {
  return (
    <div className="relative aspect-[5/6] w-full max-w-[560px] mx-auto">
      <div
        className="absolute inset-0 rounded-[28px] overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 110%, rgba(28,32,40,0.8) 0%, rgba(8,10,14,1) 60%)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: `0 60px 160px -40px ${ACCENT}22, inset 0 1px 0 rgba(255,255,255,0.04)`,
        }}
      >
        {/* Atmospheric glow */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(50% 40% at 50% 60%, ${ACCENT}14 0%, transparent 70%)`,
            filter: "blur(30px)",
          }}
        />

        {/* Floor line */}
        <div
          className="absolute left-[10%] right-[10%] bottom-[14%] h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${ACCENT}40 50%, transparent)`,
          }}
        />

        {/* Ghost skeleton — blurred, white, breathing */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-[82%] aspect-[4/5] relative">
            <div
              className="absolute inset-0"
              style={{
                filter: "blur(3px)",
                opacity: 0.5,
                transform: "translate(-22px, 6px) scale(0.98)",
                animation: "breathe 4.5s ease-in-out infinite",
              }}
            >
              <Skeleton ghost variant="standing" strokeW={3} glow={false} />
            </div>
          </div>
        </div>

        {/* Real skeleton — sharp, accent colour, glowing */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ animation: "breathe 4.5s ease-in-out infinite 0.4s" }}
        >
          <div className="h-[82%] aspect-[4/5]" style={{ transform: "translate(14px, 0)" }}>
            <Skeleton accent={ACCENT} variant="squat" strokeW={2.8} />
          </div>
        </div>

        {/* Top labels */}
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }}
          />
          <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/70">
            You · Live
          </span>
        </div>
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
          <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">
            Ghost · PR · 5×5
          </span>
        </div>

        {/* Delta badge */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-baseline gap-2 px-4 py-2 rounded-full"
          style={{
            background: "rgba(8,10,14,0.7)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/45">
            Δ ahead
          </span>
          <span className="text-[15px] font-mono" style={{ color: ACCENT }}>
            +1.24s
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function GhostSection() {
  return (
    <section id="ghost" className="relative py-48 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full opacity-40"
          style={{
            background: `radial-gradient(circle, ${ACCENT}18 0%, transparent 60%)`,
            filter: "blur(60px)",
          }}
        />
      </div>

      <div className="relative max-w-[1240px] mx-auto px-8">
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-24 items-center">
          {/* Left — copy */}
          <Reveal>
            <div>
              <div
                className="text-[11px] font-mono uppercase tracking-[0.22em] mb-8"
                style={{ color: ACCENT }}
              >
                Ghost Mode
              </div>
              <h2 className="text-[clamp(3.2rem,6.5vw,6.5rem)] leading-[0.9] tracking-[-0.045em] font-medium">
                Compete with<br />
                <span className="italic font-normal">your past self</span>
                <span style={{ color: ACCENT }}>.</span>
              </h2>
              <p className="mt-10 text-[17px] text-white/55 max-w-[38ch] leading-[1.55]">
                Your personal best, replayed as a translucent ghost. See the exact
                frame you edge past yourself.
              </p>
            </div>
          </Reveal>

          {/* Right — visual */}
          <Reveal delay={200} y={40}>
            <GhostStage />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
