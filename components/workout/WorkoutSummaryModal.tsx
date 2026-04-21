"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock, Repeat2, Target, LayoutDashboard, Sparkles } from "lucide-react";
import { generateWorkoutFeedback } from "@/lib/geminiCoach";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SummaryData {
  exercise:     string;
  reps:         number;
  duration:     number;   // seconds
  formAccuracy: number;   // 0–100, 0 = not available
  /** Top form-issue messages collected during the session */
  issues?:      string[];
  /** Whether bilateral imbalance was flagged */
  imbalance?:   boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  data:    SummaryData;
  onClose: () => void;
}

export default function WorkoutSummaryModal({ data, onClose }: Props) {
  const router = useRouter();

  // ── AI Coach state ────────────────────────────────────────────────────────
  // generateWorkoutFeedback always resolves (catches errors internally + returns
  // a fallback string), so we only need loading + result — no separate error state.
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [aiLoading,  setAiLoading]  = useState(true);

  // Fetch once on mount — data is stable for the lifetime of the modal
  useEffect(() => {
    generateWorkoutFeedback({
      exercise:  data.exercise,
      reps:      data.reps,
      duration:  data.duration,
      accuracy:  data.formAccuracy,
      issues:    data.issues   ?? [],
      imbalance: data.imbalance ?? false,
    })
      .then((text) => setAiFeedback(text))
      .finally(()  => setAiLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once

  // ── Navigation ────────────────────────────────────────────────────────────
  function handleDashboard() { onClose(); router.push("/dashboard"); }
  function handleHistory()   { onClose(); router.push("/analytics"); }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Card */}
      <div className="w-full max-w-sm bg-[#141414] border border-[#2a2a2a] rounded-3xl overflow-hidden shadow-2xl">

        {/* Top accent bar */}
        <div className="h-1 bg-primary" />

        <div className="p-7 flex flex-col items-center text-center gap-5">

          {/* Badge */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-emerald/10 border border-emerald/30 flex items-center justify-center">
              <CheckCircle size={26} className="text-emerald" />
            </div>
            <p className="text-[#6b7280] text-[10px] tracking-[0.3em] uppercase">Workout Complete</p>
            <h2 className="text-white font-black text-2xl uppercase tracking-tight leading-tight">
              {data.exercise}
            </h2>
          </div>

          {/* Reps hero number */}
          <div className="flex flex-col items-center">
            <span className="text-emerald font-black leading-none" style={{ fontSize: "5rem" }}>
              {data.reps}
            </span>
            <p className="text-[#6b7280] text-xs tracking-widest uppercase -mt-1">Reps Completed</p>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-6 w-full">
            {/* Duration */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-xl bg-[#1e1e1e] flex items-center justify-center">
                <Clock size={14} className="text-[#4a8cff]" />
              </div>
              <p className="text-white font-bold text-sm">{formatDuration(data.duration)}</p>
              <p className="text-[#4b5563] text-[9px] tracking-widest uppercase">Duration</p>
            </div>

            {/* Divider */}
            <div className="h-10 w-px bg-[#222]" />

            {/* Reps per min */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-xl bg-[#1e1e1e] flex items-center justify-center">
                <Repeat2 size={14} className="text-[#9b6dfa]" />
              </div>
              <p className="text-white font-bold text-sm">
                {data.duration > 0
                  ? Math.round((data.reps / data.duration) * 60)
                  : data.reps}
              </p>
              <p className="text-[#4b5563] text-[9px] tracking-widest uppercase">Reps / min</p>
            </div>

            {/* Form accuracy (optional) */}
            {data.formAccuracy > 0 && (
              <>
                <div className="h-10 w-px bg-[#222]" />
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-xl bg-[#1e1e1e] flex items-center justify-center">
                    <Target size={14} className="text-[#ff7043]" />
                  </div>
                  <p className="text-white font-bold text-sm">{data.formAccuracy}%</p>
                  <p className="text-[#4b5563] text-[9px] tracking-widest uppercase">Accuracy</p>
                </div>
              </>
            )}
          </div>

          {/* ── AI Coach feedback ──────────────────────────────────────────── */}
          <div className="w-full bg-[#0f0f0f] border border-[#222] rounded-2xl p-4 text-left">

            {/* Header */}
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles size={11} className="text-[#9b6dfa]" />
              <p className="text-[#9b6dfa] text-[9px] font-bold tracking-[0.25em] uppercase">
                AI Coach
              </p>
            </div>

            {/* Content */}
            {aiLoading ? (
              // Loading — skeleton bars + status text
              <div className="space-y-2">
                <p className="text-[#4b5563] text-[10px] tracking-wide mb-2">
                  Generating AI feedback…
                </p>
                <div className="h-2.5 bg-[#1e1e1e] rounded-full animate-pulse w-full" />
                <div className="h-2.5 bg-[#1e1e1e] rounded-full animate-pulse w-[82%]" />
                <div className="h-2.5 bg-[#1e1e1e] rounded-full animate-pulse w-[60%]" />
              </div>
            ) : (
              // Result — either AI coaching text or the graceful fallback string
              <p className="text-[#d1d5db] text-sm leading-relaxed">
                {aiFeedback}
              </p>
            )}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={handleDashboard}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm tracking-widest uppercase transition-all"
            >
              <LayoutDashboard size={15} />
              Back to Dashboard
            </button>
            <button
              onClick={handleHistory}
              className="w-full py-2.5 rounded-2xl bg-[#1e1e1e] hover:bg-[#252525] text-[#9ca3af] hover:text-white font-semibold text-xs tracking-widest uppercase transition-all border border-[#2a2a2a]"
            >
              View History
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
