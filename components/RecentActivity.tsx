"use client";

import { ChevronRight, Timer, Dumbbell } from "lucide-react";
import type { RecentActivityItem } from "@/lib/useWorkoutStats";

// ─── Exercise → visual style mapping ─────────────────────────────────────────

const EXERCISE_STYLES: Record<string, { icon: string; color: string; glow: string }> = {
  "Bicep Curls":    { icon: "💪", color: "rgba(255,112,67,0.12)",  glow: "rgba(255,112,67,0.5)" },
  "Squats":         { icon: "🏋️", color: "rgba(16,185,129,0.12)",  glow: "rgba(16,185,129,0.5)" },
  "Push-Ups":       { icon: "🤸", color: "rgba(74,140,255,0.12)",  glow: "rgba(74,140,255,0.5)" },
  "Deadlifts":      { icon: "⚡", color: "rgba(155,109,250,0.12)", glow: "rgba(155,109,250,0.5)" },
  "Lunges":         { icon: "🚀", color: "rgba(74,222,128,0.12)",  glow: "rgba(74,222,128,0.5)" },
  "Shoulder Press": { icon: "🏆", color: "rgba(251,191,36,0.12)",  glow: "rgba(251,191,36,0.5)" },
};

const FALLBACK_STYLE = { icon: "🎯", color: "rgba(107,114,128,0.12)", glow: "rgba(107,114,128,0.5)" };

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  activities: RecentActivityItem[];
  isLoading?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RecentActivity({ activities, isLoading = false }: Props) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background:    "rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
        border:        "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/85 text-[13px] font-semibold">Recent Activity</p>
        <button className="flex items-center gap-1 text-white/25 hover:text-white/60 text-[10px] font-bold tracking-[0.15em] uppercase transition-colors">
          View All <ChevronRight size={10} />
        </button>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex-shrink-0 animate-pulse"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
              <div className="flex-1 space-y-2">
                <div
                  className="h-2.5 rounded-full animate-pulse w-3/4"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                />
                <div
                  className="h-2 rounded-full animate-pulse w-1/2"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                />
              </div>
              <div
                className="h-3 w-7 rounded-full animate-pulse"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && activities.length === 0 && (
        <div className="flex flex-col items-center justify-center py-7 text-center">
          <Dumbbell size={20} className="text-white/10 mb-2" />
          <p className="text-white/20 text-xs">No workouts yet</p>
        </div>
      )}

      {/* Activity list */}
      {!isLoading && activities.length > 0 && (
        <div className="space-y-3">
          {activities.map((activity) => {
            const style = EXERCISE_STYLES[activity.exercise] ?? FALLBACK_STYLE;
            return (
              <div key={activity.id} className="flex items-center gap-3 group">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: style.color }}
                >
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/85 text-[13px] font-semibold truncate leading-tight">
                    {activity.exercise}
                  </p>
                  <p className="text-white/30 text-[10px] flex items-center gap-1 mt-0.5">
                    <Timer size={9} />
                    {formatDuration(activity.duration)} · {activity.reps} reps
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white/70 text-xs font-bold">{activity.reps}</p>
                  <p className="text-white/20 text-[9px]">reps</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
