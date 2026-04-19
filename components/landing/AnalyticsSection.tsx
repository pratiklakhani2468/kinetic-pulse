"use client";

/**
 * AnalyticsSection — faithful port of the HTML design's Analytics + ChartCard.
 *
 * ChartCard: 48-point math-generated curve (sin/cos), form score 94.2, +6.8,
 * time period toggle buttons (30d active), trailing dot with ring.
 */

import { useMemo } from "react";
import Reveal from "./Reveal";

const ACCENT = "#22C55E";

// ─── ChartCard ────────────────────────────────────────────────────────────────

function ChartCard() {
  const points = useMemo(() => {
    const N = 48;
    return Array.from({ length: N }, (_, i) => {
      const t = i / (N - 1);
      const y = 0.55 + Math.sin(t * 3.2) * 0.18 + Math.cos(t * 6) * 0.05 + t * 0.18;
      return [t * 100, 100 - y * 100] as [number, number];
    });
  }, []);

  const path = points.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ");
  const area = `${path} L 100 100 L 0 100 Z`;
  const last = points[points.length - 1];

  return (
    <div
      className="relative rounded-[22px] p-10"
      style={{
        background: "linear-gradient(180deg, rgba(18,22,28,0.5) 0%, rgba(10,12,16,0.7) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: `0 40px 120px -40px ${ACCENT}15`,
      }}
    >
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35 mb-3">
            Form score · 30 days
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-[56px] leading-none tracking-[-0.03em] font-medium">94.2</div>
            <div className="text-[13px] font-mono" style={{ color: ACCENT }}>+6.8</div>
          </div>
        </div>
        <div className="hidden md:flex gap-1 p-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
          {["7d", "30d", "90d", "1y"].map((x) => (
            <button
              key={x}
              className={`px-3 py-1 text-[11px] font-mono rounded-full transition ${
                x === "30d" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {x}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-[180px] w-full">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={ACCENT} stopOpacity="0.3" />
              <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#chartFill)" />
          <path
            d={path} fill="none" stroke={ACCENT}
            strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 4px ${ACCENT})` }}
          />
          <circle cx={last[0]} cy={last[1]} r="1.1" fill={ACCENT} />
          <circle cx={last[0]} cy={last[1]} r="2.6" fill="none" stroke={ACCENT} strokeWidth="0.3" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function AnalyticsSection() {
  return (
    <section id="analytics" className="relative py-48">
      <div className="max-w-[1240px] mx-auto px-8">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-24 items-center">
          {/* Left — copy */}
          <Reveal>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/40 mb-8">
                Performance
              </div>
              <h2 className="text-[clamp(2.6rem,5vw,4.8rem)] leading-[0.95] tracking-[-0.04em] font-medium">
                Progress,<br /><span className="text-white/40">measured.</span>
              </h2>
              <p className="mt-10 text-[16px] text-white/50 max-w-[36ch] leading-[1.55]">
                Form, range of motion, tempo, volume. Per set. Per lift.
              </p>
            </div>
          </Reveal>

          {/* Right — chart */}
          <Reveal delay={200}>
            <ChartCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
