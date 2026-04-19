import { Sparkles, Zap, Settings } from "lucide-react";

export default function AIInsightCard() {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background:  "rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
        border:      "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(155,109,250,0.15)" }}
          >
            <Sparkles size={13} style={{ color: "#9b6dfa" }} />
          </div>
          <span
            className="text-[11px] font-bold tracking-[0.18em] uppercase"
            style={{ color: "#9b6dfa" }}
          >
            AI Kinetic Insight
          </span>
        </div>
        <button
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          <Settings size={11} className="text-white/30" />
        </button>
      </div>

      {/* Quote */}
      <p className="text-white/80 text-[13px] leading-relaxed mb-4">
        &ldquo;Your CNS recovery is{" "}
        <span className="font-semibold" style={{ color: "#10b981" }}>optimal</span>. Focus on
        power output today.&rdquo;
      </p>

      {/* Recommended focus */}
      <div
        className="rounded-xl p-3"
        style={{
          background: "rgba(255,255,255,0.03)",
          border:     "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p className="text-white/25 text-[9px] font-bold tracking-[0.3em] uppercase mb-2.5">
          Recommended Focus
        </p>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(74,140,255,0.15)" }}
          >
            <Zap size={12} style={{ color: "#4a8cff" }} />
          </div>
          <div>
            <p className="text-white/85 text-[13px] font-semibold leading-tight">
              High-Velocity Squats
            </p>
            <p className="text-white/30 text-[10px] mt-0.5">5×3 @ 82%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
