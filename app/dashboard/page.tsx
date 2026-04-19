"use client";

import Link from "next/link";
import { useWorkoutStats } from "@/lib/useWorkoutStats";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  Dumbbell,
  Repeat,
  CalendarDays,
  Zap,
  PlayCircle,
  BarChart3,
  Lightbulb,
  Activity,
  LucideIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { RecentActivityItem } from "@/lib/useWorkoutStats";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveUserName(
  displayName: string | null,
  email: string | null
): string {
  if (displayName?.trim()) {
    return displayName.trim().split(/\s+/)[0];
  }
  if (email) {
    const local   = email.split("@")[0];
    const letters = local.match(/^[a-zA-Z]+/);
    if (letters?.[0]) {
      const raw = letters[0];
      return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    }
    return local;
  }
  return "Athlete";
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatRelativeDate(date: Date): string {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff  = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── StatsCard ────────────────────────────────────────────────────────────────

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent: "emerald" | "blue" | "orange" | "purple";
}

const accentStyles: Record<StatsCardProps["accent"], string> = {
  emerald: "bg-emerald/10 text-emerald",
  blue:    "bg-blue-accent/10 text-blue-accent",
  orange:  "bg-orange-accent/10 text-orange-accent",
  purple:  "bg-purple-accent/10 text-purple-accent",
};

function StatsCard({ icon: Icon, label, value, accent }: StatsCardProps) {
  return (
    <div className="bg-card border border-border/40 rounded-lg p-6 hover:border-border/80 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${accentStyles[accent]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

// ─── ActivityRow ──────────────────────────────────────────────────────────────

function ActivityRow({ item }: { item: RecentActivityItem }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/20 hover:border-border/40 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald/10 flex items-center justify-center flex-shrink-0">
          <Activity className="h-5 w-5 text-emerald" />
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">{item.exercise}</p>
          <p className="text-xs text-muted-foreground">{formatRelativeDate(item.date)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-foreground">{item.reps} reps</p>
        <p className="text-xs text-muted-foreground">{formatDuration(item.duration)}</p>
      </div>
    </div>
  );
}

// ─── Build weekly chart from recent activities ─────────────────────────────

function buildChartData(activities: RecentActivityItem[]) {
  const days  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dayKey  = d.toLocaleDateString();
    const dayName = days[d.getDay()];
    const reps = activities
      .filter((a) => a.date.toLocaleDateString() === dayKey)
      .reduce((sum, a) => sum + a.reps, 0);
    const duration = activities
      .filter((a) => a.date.toLocaleDateString() === dayKey)
      .reduce((sum, a) => sum + Math.round(a.duration / 60), 0);
    return { date: dayName, reps, duration };
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { loading: authLoading, user } = useRequireAuth();
  const stats                          = useWorkoutStats();

  if (authLoading) return null;

  const userName = resolveUserName(
    user?.displayName ?? null,
    user?.email ?? null
  );
  const chartData = buildChartData(stats.recentActivities);

  return (
    <div className="p-8 space-y-8">

          {/* Page header */}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back,{" "}
              <span className="text-primary">{userName}</span>!
            </h1>
            <p className="text-muted-foreground">
              Here&apos;s your fitness overview for this week.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              icon={Dumbbell}
              label="Total Workouts"
              value={stats.loading ? "…" : stats.totalWorkouts}
              accent="emerald"
            />
            <StatsCard
              icon={Repeat}
              label="Total Reps"
              value={stats.loading ? "…" : stats.totalReps}
              accent="blue"
            />
            <StatsCard
              icon={CalendarDays}
              label="Active Days"
              value={stats.loading ? "…" : stats.activeDays}
              accent="orange"
            />
            <StatsCard
              icon={Zap}
              label="Last Workout"
              value={stats.loading ? "…" : stats.lastWorkout}
              accent="purple"
            />
          </div>

          {/* Chart + sidebar widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance chart */}
            <div className="lg:col-span-2 bg-card border border-border/40 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  Performance Trends
                </h3>
                <span className="px-3 py-1 rounded-lg text-sm bg-emerald/10 text-emerald border border-emerald/30">
                  7 Days
                </span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0 0)" />
                    <XAxis dataKey="date" stroke="oklch(0.65 0 0)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="oklch(0.65 0 0)" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.15 0 0)",
                        border: "1px solid oklch(0.25 0 0)",
                        borderRadius: "0.5rem",
                        color: "oklch(0.95 0 0)",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="reps"
                      stroke="oklch(0.63 0.223 160)"
                      strokeWidth={2}
                      dot={{ fill: "oklch(0.63 0.223 160)", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="duration"
                      stroke="oklch(0.55 0.18 250)"
                      strokeWidth={2}
                      dot={{ fill: "oklch(0.55 0.18 250)", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* AI Insights */}
              <div className="bg-purple-accent/10 border border-purple-accent/30 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-accent/20 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="h-5 w-5 text-purple-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">AI Insights</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {stats.totalWorkouts > 0
                        ? `You've completed ${stats.totalWorkouts} workout${stats.totalWorkouts !== 1 ? "s" : ""} across ${stats.activeDays} active day${stats.activeDays !== 1 ? "s" : ""}. Keep up the momentum!`
                        : "Start your first workout session to unlock personalized AI insights and recommendations."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-foreground">
                  Quick Actions
                </h3>
                <Link href="/workout" className="block">
                  <button className="w-full flex items-center justify-start gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    <PlayCircle className="h-5 w-5" />
                    Start Workout
                  </button>
                </Link>
                <Link href="/training" className="block">
                  <button className="w-full flex items-center justify-start gap-2 px-4 py-3 rounded-lg border border-border/40 text-foreground text-sm font-medium hover:bg-card transition-colors">
                    <BarChart3 className="h-5 w-5" />
                    Browse Exercises
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border/40 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Recent Activity
            </h3>
            {stats.loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-muted/30 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : stats.recentActivities.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No workouts yet. Start your first session!
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivities.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
    </div>
  );
}
