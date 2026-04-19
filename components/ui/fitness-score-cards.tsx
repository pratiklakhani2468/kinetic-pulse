"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Dumbbell, Repeat, CalendarDays, Zap } from "lucide-react";
import { LiquidGlassCard } from "@/components/ui/liquid-glass-card";
import { Badge } from "@/components/ui/badge";
import type { WorkoutStats } from "@/lib/useWorkoutStats";

// ─── Animated counter ─────────────────────────────────────────────────────────

function useAnimatedCount(target: number, duration = 1200, enabled = true) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || target === 0) {
      setCount(target);
      return;
    }
    const start = performance.now();
    const from  = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(from + (target - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, enabled]);

  return count;
}

// ─── Half-circle SVG arc ──────────────────────────────────────────────────────

const RADIUS   = 44;
const CX       = 60;
const CY       = 58; // slightly below centre so arc sits nicely
const ARC_LEN  = Math.PI * RADIUS; // half-circumference ≈ 138.2

interface ArcProps {
  progress: number; // 0–100
  color: string;
  trackColor?: string;
  animated?: boolean;
}

const ArcProgress = memo(function ArcProgress({
  progress,
  color,
  trackColor = "rgba(255,255,255,0.06)",
  animated = true,
}: ArcProps) {
  const clampedPct = Math.min(Math.max(progress, 0), 100);
  const offset     = ARC_LEN * (1 - clampedPct / 100);

  // Common arc path props (left-to-right, bottom half flipped up)
  const arcProps = {
    cx: CX,
    cy: CY,
    r:  RADIUS,
    fill: "none",
    strokeWidth: 5,
    strokeLinecap: "round" as const,
    strokeDasharray: `${ARC_LEN} ${ARC_LEN * 10}`,
    transform: `rotate(180, ${CX}, ${CY})`,
  };

  return (
    <svg viewBox={`0 0 120 ${CY + 6}`} className="w-full" aria-hidden>
      {/* Track */}
      <circle {...arcProps} stroke={trackColor} strokeLinecap="butt" />
      {/* Filled arc */}
      <circle
        {...arcProps}
        stroke={color}
        strokeDashoffset={offset}
        style={{
          transition: animated ? "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)" : "none",
          filter: `drop-shadow(0 0 6px ${color}80)`,
        }}
      />
      {/* End dot glow */}
      {clampedPct > 2 && (
        <circle
          cx={CX + RADIUS * Math.cos(Math.PI * (1 - clampedPct / 100))}
          cy={CY - RADIUS * Math.sin(Math.PI * (1 - clampedPct / 100))}
          r="3"
          fill={color}
          style={{ filter: `drop-shadow(0 0 5px ${color})` }}
        />
      )}
    </svg>
  );
});

// ─── Individual score card ─────────────────────────────────────────────────────

interface ScoreCardProps {
  label: string;
  sublabel: string;
  value: number;
  displayValue?: string;  // override (e.g. "Today")
  maxValue: number;
  color: string;
  accentColor?: string;
  icon: React.ReactNode;
  badge: string;
  badgeVariant: "lime" | "blue" | "orange" | "purple";
  isLoading?: boolean;
  delay?: number;
}

const ScoreCard = memo(function ScoreCard({
  label,
  sublabel,
  value,
  displayValue,
  maxValue,
  color,
  icon,
  badge,
  badgeVariant,
  isLoading = false,
  delay = 0,
}: ScoreCardProps) {
  const [mounted, setMounted] = useState(false);

  // Stagger mount so animations fire after the card enters the DOM
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(id);
  }, [delay]);

  const progress      = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  const animatedCount = useAnimatedCount(value, 1200, mounted && !isLoading);
  const shown         = displayValue ?? String(animatedCount);

  return (
    <LiquidGlassCard accentColor={color} hoverable className="p-5 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}14`, color }}
          >
            {icon}
          </div>
          <div>
            <p className="text-white/80 text-xs font-semibold leading-tight">{label}</p>
            <p className="text-white/30 text-[10px] leading-tight mt-0.5">{sublabel}</p>
          </div>
        </div>
        <Badge variant={badgeVariant}>{badge}</Badge>
      </div>

      {/* Arc + value */}
      <div className="relative -mx-1">
        {isLoading ? (
          <div className="h-16 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-emerald/50 animate-spin" />
          </div>
        ) : (
          <>
            <ArcProgress
              progress={mounted ? progress : 0}
              color={color}
              animated={mounted}
            />
            {/* Centred value overlay */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-1 pointer-events-none">
              <span
                className="font-black leading-none tracking-tight"
                style={{
                  fontSize:  "clamp(1.6rem, 3.5vw, 2.2rem)",
                  color,
                  textShadow: `0 0 20px ${color}50`,
                }}
              >
                {shown}
              </span>
            </div>
          </>
        )}
      </div>
    </LiquidGlassCard>
  );
});

// ─── Exported grid ─────────────────────────────────────────────────────────────

interface FitnessScoreCardsProps {
  stats: WorkoutStats;
}

export const FitnessScoreCards = memo(function FitnessScoreCards({ stats }: FitnessScoreCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <ScoreCard
        label="Workouts"
        sublabel="Total sessions logged"
        value={stats.totalWorkouts}
        maxValue={Math.max(stats.totalWorkouts, 20)}
        color="#10b981"
        icon={<Dumbbell size={15} strokeWidth={2.5} />}
        badge="Sessions"
        badgeVariant="lime"
        isLoading={stats.loading}
        delay={0}
      />
      <ScoreCard
        label="Total Reps"
        sublabel="Cumulative rep count"
        value={stats.totalReps}
        maxValue={Math.max(stats.totalReps, 500)}
        color="#4a8cff"
        icon={<Repeat size={15} strokeWidth={2.5} />}
        badge="Reps"
        badgeVariant="blue"
        isLoading={stats.loading}
        delay={100}
      />
      <ScoreCard
        label="Active Days"
        sublabel="Unique training days"
        value={stats.activeDays}
        maxValue={Math.max(stats.activeDays, 30)}
        color="#ff7043"
        icon={<CalendarDays size={15} strokeWidth={2.5} />}
        badge="Days"
        badgeVariant="orange"
        isLoading={stats.loading}
        delay={200}
      />
      <ScoreCard
        label="Last Session"
        sublabel="Most recent workout"
        value={0}
        displayValue={stats.lastWorkout}
        maxValue={100}
        color="#9b6dfa"
        icon={<Zap size={15} strokeWidth={2.5} />}
        badge="AI Tracked"
        badgeVariant="purple"
        isLoading={stats.loading}
        delay={300}
      />
    </div>
  );
});
