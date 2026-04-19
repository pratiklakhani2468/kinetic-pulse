"use client";

/**
 * ProductSection — faithful port of the HTML design's ImmersiveProduct + FormFeedback + KeyFeatures.
 *
 * ImmersiveProduct: section header + FormFeedback card (12-rep bar chart, form score, flags).
 * KeyFeatures: two-column sticky layout, 3 numbered feature items.
 * NO skeleton figure.
 */

import Reveal from "./Reveal";

const ACCENT = "#22C55E";

// ─── FormFeedback ─────────────────────────────────────────────────────────────

const REPS = [
  { depth: 92, score: 96, flag: null },
  { depth: 95, score: 98, flag: null },
  { depth: 88, score: 94, flag: null },
  { depth: 81, score: 86, flag: "Shallow depth" },
  { depth: 94, score: 97, flag: null },
  { depth: 96, score: 99, flag: null },
  { depth: 78, score: 82, flag: "Knee collapse" },
  { depth: 90, score: 95, flag: null },
  { depth: 93, score: 97, flag: null },
  { depth: 95, score: 98, flag: null },
  { depth: 91, score: 96, flag: null },
  { depth: 97, score: 99, flag: null },
] as const;

const avg = Math.round(REPS.reduce((a, r) => a + r.score, 0) / REPS.length);

function FormFeedback() {
  return (
    <div
      className="relative rounded-[24px] overflow-hidden p-10 md:p-12"
      style={{
        background: "linear-gradient(180deg, rgba(16,20,26,0.6) 0%, rgba(8,10,14,0.8) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: `0 60px 160px -40px ${ACCENT}18, inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* Ambient wash */}
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background: `radial-gradient(80% 50% at 10% 100%, ${ACCENT}14 0%, transparent 50%)`,
        }}
      />

      {/* Header */}
      <div className="relative flex items-end justify-between mb-10">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35 mb-3">
            Set 03 · Barbell Squat
          </div>
          <div className="flex items-baseline gap-4">
            <div className="text-[64px] leading-none tracking-[-0.035em] font-medium">{avg}</div>
            <div className="flex flex-col">
              <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/45">Form score</div>
              <div className="text-[12px] font-mono mt-1" style={{ color: ACCENT }}>2 corrections</div>
            </div>
          </div>
        </div>
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <span className="relative flex w-1.5 h-1.5">
            <span
              className="absolute inline-flex w-full h-full rounded-full animate-ping opacity-60"
              style={{ background: ACCENT }}
            />
            <span className="relative w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
          </span>
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/70">Live</span>
        </div>
      </div>

      {/* Rep timeline */}
      <div className="relative">
        <div className="flex items-end gap-2 md:gap-3 h-[220px]">
          {REPS.map((r, i) => {
            const bad = r.score < 90;
            return (
              <div key={i} className="flex-1 relative flex flex-col items-center justify-end group">
                {/* Flag tooltip */}
                {r.flag && (
                  <div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md whitespace-nowrap text-[10px] font-mono"
                    style={{
                      background: "rgba(255,180,120,0.1)",
                      color: "#FFB478",
                      border: "1px solid rgba(255,180,120,0.25)",
                    }}
                  >
                    {r.flag}
                  </div>
                )}
                {/* Bar */}
                <div
                  className="relative w-full rounded-t-md"
                  style={{
                    height: `${r.depth}%`,
                    background: bad
                      ? "linear-gradient(180deg, rgba(255,180,120,0.7), rgba(255,180,120,0.15))"
                      : `linear-gradient(180deg, ${ACCENT}, ${ACCENT}30)`,
                    boxShadow: bad
                      ? "0 0 20px rgba(255,180,120,0.2)"
                      : `0 0 20px ${ACCENT}40`,
                  }}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-px"
                    style={{
                      background: bad ? "#FFB478" : ACCENT,
                      boxShadow: bad ? "0 0 6px #FFB478" : `0 0 6px ${ACCENT}`,
                    }}
                  />
                </div>
                <div className="text-[10px] font-mono text-white/30 mt-2">{i + 1}</div>
              </div>
            );
          })}
        </div>

        {/* 90% target line */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{ top: "calc(220px - 90% * 220 / 100)", transform: "translateY(22px)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-px flex-1"
              style={{ background: `linear-gradient(90deg, ${ACCENT}60, transparent)` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom stat row */}
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 mt-10 border-t border-white/[0.06]">
        {[
          ["Depth avg", "92%"],
          ["Tempo",     "2.1s / 1.3s"],
          ["ROM",       "96%"],
          ["Volume",    "1,240 kg"],
        ].map(([k, v]) => (
          <div key={k}>
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35 mb-2">{k}</div>
            <div className="text-[20px] tracking-tight font-medium">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KeyFeatures ──────────────────────────────────────────────────────────────

const FEATURES = [
  { n: "01", t: "Form feedback",  d: "Knee valgus, butt wink, shallow depth — caught the moment they happen." },
  { n: "02", t: "Live rooms",     d: "Up to eight friends. Shared timer, shared leaderboard, one session." },
  { n: "03", t: "Rep tracking",   d: "Joint-angle based. Forty plus movements out of the box." },
] as const;

function KeyFeatures() {
  return (
    <section className="relative py-48">
      <div className="max-w-[1240px] mx-auto px-8">
        <div className="grid md:grid-cols-[1fr_1.5fr] gap-24">
          <Reveal>
            <div className="md:sticky md:top-32">
              <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/40 mb-6">
                Capabilities
              </div>
              <h2 className="text-[clamp(2.4rem,4.5vw,4rem)] leading-[0.95] tracking-[-0.035em] font-medium">
                What it<br /><span className="text-white/40">actually does.</span>
              </h2>
            </div>
          </Reveal>

          <div>
            {FEATURES.map((f, i) => (
              <Reveal key={f.n} delay={i * 120}>
                <div className="grid grid-cols-[auto_1fr] gap-10 py-14 border-b border-white/[0.06] last:border-0">
                  <div className="text-[11px] font-mono text-white/30 pt-2">{f.n}</div>
                  <div>
                    <h3 className="text-[clamp(1.9rem,3vw,2.8rem)] tracking-[-0.028em] font-medium leading-tight">
                      {f.t}
                    </h3>
                    <p className="mt-4 text-[16px] text-white/50 max-w-[48ch] leading-relaxed">
                      {f.d}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── ProductSection ───────────────────────────────────────────────────────────

export default function ProductSection() {
  return (
    <>
      {/* ImmersiveProduct */}
      <section id="product" className="relative py-48">
        <div className="max-w-[1240px] mx-auto px-8">
          <Reveal>
            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/40 mb-8">
              The Product
            </div>
            <h2 className="text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.95] tracking-[-0.04em] max-w-[12ch] font-medium">
              Real-time<br />
              <span className="text-white/40">form correction.</span>
            </h2>
          </Reveal>
        </div>

        <Reveal delay={200} y={60}>
          <div className="relative mt-24 mx-auto max-w-[1200px] px-6">
            <FormFeedback />
          </div>
        </Reveal>
      </section>

      {/* KeyFeatures */}
      <KeyFeatures />
    </>
  );
}
