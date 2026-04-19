"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayData {
  label: string;
  reps: number;
  sessions: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildWeekSkeleton(): DayData[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { label: DAY_ABBR[d.getDay()], reps: 0, sessions: 0 };
  });
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: DayData }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const { reps, sessions } = payload[0].payload;
  return (
    <div
      className="rounded-xl px-3.5 py-2.5 shadow-2xl"
      style={{
        background: "rgba(14,14,14,0.95)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      <p className="text-white/40 text-[10px] font-bold tracking-[0.18em] uppercase mb-1.5">{label}</p>
      <p style={{ color: "#10b981" }} className="text-sm font-black">
        {reps}{" "}
        <span className="text-white/35 font-normal text-xs">reps</span>
      </p>
      {sessions > 0 && (
        <p className="text-white/30 text-[10px] mt-0.5">
          {sessions} session{sessions !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

// ─── Active dot with glow rings ───────────────────────────────────────────────

function GlowDot(props: {
  cx?: number;
  cy?: number;
  payload?: DayData;
}) {
  const { cx = 0, cy = 0, payload } = props;
  if (!payload?.reps) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={12} fill="#10b981" opacity={0.07} />
      <circle cx={cx} cy={cy} r={7}  fill="#10b981" opacity={0.15} />
      <circle cx={cx} cy={cy} r={4}  fill="#10b981" />
      <circle cx={cx} cy={cy} r={1.8} fill="white" opacity={0.9} />
    </g>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-0">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-emerald/20 border-t-emerald/70"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <p className="text-white/20 text-[10px] tracking-[0.2em] uppercase">Loading data</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PerformanceChart() {
  const { user } = useAuth();
  const [data, setData]         = useState<DayData[]>(buildWeekSkeleton());
  const [loading, setLoading]   = useState(true);
  const [weekReps, setWeekReps] = useState(0);
  const [trend, setTrend]       = useState<"up" | "down" | "flat">("flat");

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    async function fetchChartData() {
      try {
        // Fetch all docs — no where/orderBy so no Firestore index required
        const snap = await getDocs(collection(db, "workouts"));

        const week = buildWeekSkeleton();

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const weekAgoStart = new Date(todayStart);
        weekAgoStart.setDate(weekAgoStart.getDate() - 6);

        snap.forEach((doc) => {
          const d = doc.data() as {
            userId?: string;
            reps?: number;
            timestamp?: { seconds: number } | null;
          };

          // Filter to this user only
          if (d.userId !== user!.uid) return;

          // Convert Firestore timestamp to JS Date without using .toDate()
          const date = d.timestamp?.seconds
            ? new Date(d.timestamp.seconds * 1000)
            : null;

          if (!date || date < weekAgoStart) return;

          const workoutDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const daysAgo    = Math.round((todayStart.getTime() - workoutDay.getTime()) / 86_400_000);
          const idx        = 6 - daysAgo;

          if (idx >= 0 && idx < 7) {
            week[idx].reps     += d.reps ?? 0;
            week[idx].sessions += 1;
          }
        });

        const total = week.reduce((s, d) => s + d.reps, 0);

        // Trend: compare first half vs second half of the week
        const firstHalf  = week.slice(0, 3).reduce((s, d) => s + d.reps, 0);
        const secondHalf = week.slice(4).reduce((s, d) => s + d.reps, 0);
        const trendDir: "up" | "down" | "flat" =
          secondHalf > firstHalf * 1.15 ? "up" :
          secondHalf < firstHalf * 0.85 ? "down" : "flat";

        setData(week);
        setWeekReps(total);
        setTrend(trendDir);
      } catch (err) {
        console.error("[PerformanceChart] Firestore error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchChartData();
  }, [user]);

  const hasData = data.some((d) => d.reps > 0);
  const yMax    = Math.max(...data.map((d) => d.reps), 10);

  const TrendIcon =
    trend === "up"   ? TrendingUp   :
    trend === "down" ? TrendingDown : Minus;

  const trendStyle =
    trend === "up"   ? { bg: "bg-emerald/10", text: "text-emerald", label: "Trending up" }   :
    trend === "down" ? { bg: "bg-[#ff7043]/10",  text: "text-[#ff7043]", label: "Declining" }     :
                       { bg: "bg-white/5",        text: "text-white/30",  label: "Steady" };

  return (
    <div
      className="relative rounded-2xl overflow-hidden h-full flex flex-col"
      style={{
        background:   "linear-gradient(145deg, #0a0a0a 0%, #111111 50%, #0d0d0d 100%)",
        border:       "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(2px)",
      }}
    >
      {/* Ambient glow bleed from top-left */}
      <div
        className="absolute top-0 left-0 w-64 h-32 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 0% 0%, rgba(16,185,129,0.05) 0%, transparent 70%)",
        }}
      />
      {/* Subtle scan line — moves top→bottom on a slow loop */}
      <div
        className="absolute inset-x-0 h-px pointer-events-none z-0"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.12) 50%, transparent 100%)",
          animation:  "perf-scan 6s ease-in-out infinite",
        }}
      />

      {/* ── Inline keyframes ────────────────────────────────────────────── */}
      <style>{`
        @keyframes perf-scan {
          0%   { top: 0%;   opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-start justify-between px-5 pt-5 pb-3 flex-shrink-0">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Activity size={12} color="#10b981" strokeWidth={2.5} />
            <span className="text-white/35 text-[10px] font-bold tracking-[0.22em] uppercase">
              Performance Trends
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            {loading ? (
              <div className="w-16 h-7 bg-white/5 rounded-lg animate-pulse" />
            ) : (
              <>
                <span
                  className="text-2xl font-black"
                  style={{ color: hasData ? "#10b981" : "rgba(255,255,255,0.2)" }}
                >
                  {weekReps > 999
                    ? `${(weekReps / 1000).toFixed(1)}k`
                    : weekReps}
                </span>
                <span className="text-white/25 text-xs">reps this week</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${trendStyle.bg} ${trendStyle.text}`}
          >
            <TrendIcon size={10} strokeWidth={2.5} />
            <span>{trendStyle.label}</span>
          </div>
          <span className="text-white/20 text-[10px] tracking-wide">
            Last 7 days activity
          </span>
        </div>
      </div>

      {/* ── Chart area ────────────────────────────────────────────────── */}
      <div
        className="relative z-10 flex-1 min-h-0 px-2 pb-4"
        style={{
          filter: hasData
            ? "drop-shadow(0 0 8px rgba(16,185,129,0.22)) drop-shadow(0 0 20px rgba(16,185,129,0.08))"
            : "none",
        }}
      >
        {loading ? (
          <ChartSkeleton />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
            >
              <defs>
                {/* Gradient fill under the line */}
                <linearGradient id="pcAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="55%"  stopColor="#10b981" stopOpacity={0.05} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>

                {/* Animated shimmer gradient for the stroke */}
                <linearGradient id="pcLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="35%"  stopColor="#10b981" stopOpacity={1} />
                  <stop offset="65%"  stopColor="#34d399" stopOpacity={1} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                  {/* SVG SMIL — translates the bright center L→R→L */}
                  <animateTransform
                    attributeName="gradientTransform"
                    type="translate"
                    values="-1 0;0.5 0;-1 0"
                    dur="5s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.45,0.05,0.55,0.95;0.45,0.05,0.55,0.95"
                    keyTimes="0;0.5;1"
                  />
                </linearGradient>
              </defs>

              {/* Very subtle horizontal grid only */}
              <CartesianGrid
                strokeDasharray="2 6"
                stroke="rgba(255,255,255,0.035)"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 10, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.18)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={[0, Math.ceil(yMax * 1.25)]}
                tickCount={4}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "rgba(16,185,129,0.18)",
                  strokeWidth: 1,
                  strokeDasharray: "3 4",
                }}
              />

              {/* Soft glow duplicate behind the main line */}
              <Area
                type="monotone"
                dataKey="reps"
                stroke="#10b981"
                strokeWidth={6}
                strokeOpacity={0.18}
                fill="none"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />

              {/* Main line with area gradient fill */}
              <Area
                type="monotone"
                dataKey="reps"
                stroke="url(#pcLineGrad)"
                strokeWidth={2.5}
                fill="url(#pcAreaFill)"
                dot={false}
                activeDot={<GlowDot />}
                animationDuration={1400}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
