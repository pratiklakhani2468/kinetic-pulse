"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { ChevronRight, Download, Dumbbell } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "Strength" | "Cardio" | "Mobility";

interface Session {
  id: string;
  date: string;
  day: string;
  category: Category;
  name: string;
  exercise: string;
  duration: string;
  reps: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<Category, string> = {
  Strength: "#10b981",
  Cardio:   "#4a8cff",
  Mobility: "#9b6dfa",
};

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function firestoreDocToSession(id: string, data: Record<string, unknown>): Session & { _ts: number } {
  const ts   = data.timestamp as { seconds?: number } | null | undefined;
  const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(0);

  return {
    id,
    date:     date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    day:      date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    category: "Strength",
    name:     "AI Tracked Session",
    exercise: (data.exercise as string) ?? "Unknown",
    duration: formatDuration(data.duration as number),
    reps:     (data.reps as number) ?? 0,
    _ts:      ts?.seconds ?? 0,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading,  setLoading]  = useState(true);

  // ── Fetch from Firestore ───────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchWorkouts() {
      try {
        const snap = await getDocs(collection(db, "workouts"));
        console.log("[Analytics] total docs in collection:", snap.size);

        const userRows = snap.docs
          .map((doc) => ({
            data:    doc.data() as Record<string, unknown>,
            session: firestoreDocToSession(doc.id, doc.data() as Record<string, unknown>),
          }))
          .filter(({ data }) => (data.userId as string | undefined) === user!.uid)
          .map(({ session }) => session)
          .sort((a, b) => b._ts - a._ts)
          .map(({ _ts: _ignored, ...rest }) => rest as Session);

        console.log("[Analytics] workouts for this user:", userRows.length);
        setSessions(userRows);
      } catch (err) {
        console.error("[Analytics] Firestore fetch failed:", err);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkouts();
  }, [user, authLoading]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalSessions = sessions.length;
  const totalReps     = sessions.reduce((s, r) => s + r.reps, 0);
  const uniqueDays    = new Set(sessions.map((s) => s.date)).size;

  const STAT_CARDS = [
    { label: "Total Sessions",  value: String(totalSessions),  sub: "AI tracked",          color: "#10b981" },
    { label: "Total Reps",      value: totalReps > 999 ? `${(totalReps / 1000).toFixed(1)}k` : String(totalReps), sub: "across all sessions", color: "#4a8cff" },
    { label: "Active Days",     value: String(uniqueDays),     sub: "days with a workout", color: "#9b6dfa" },
    { label: "Exercises Done",  value: String(new Set(sessions.map((s) => s.exercise)).size), sub: "unique exercises", color: "#ff7043" },
  ];

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const exportData = () => {
    const headers = ["Date", "Exercise", "Duration", "Reps"];
    const rows = sessions.map((s) => [s.date, s.exercise, s.duration, String(s.reps)]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "workout-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div>
        <p className="text-[#6b7280] text-[10px] tracking-[0.3em] uppercase mb-1">
          Performance Dashboard
        </p>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">
          Training History
        </h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, sub, color }) => (
          <div key={label} className="bg-[#141414] border border-[#222] rounded-2xl p-4">
            <p className="text-[#6b7280] text-[10px] tracking-widest uppercase mb-3">{label}</p>
            <p className="text-white font-black text-3xl leading-none">
              {loading ? <span className="inline-block w-8 h-7 bg-[#222] rounded animate-pulse" /> : value}
            </p>
            <p className="mt-2 text-xs font-semibold" style={{ color }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Activity Archive */}
      <div>
        {/* Archive header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-black text-xl uppercase tracking-tight">
            Activity Archive
          </h2>
          <button
            onClick={exportData}
            disabled={sessions.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#141414] border border-[#222] text-[#6b7280] hover:text-white text-xs font-semibold tracking-widest uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>

        {/* Session list — loading / empty / data */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[72px] bg-[#141414] border border-[#1e1e1e] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-[#1a1a1a] border border-[#222] flex items-center justify-center mb-4">
              <Dumbbell size={22} className="text-[#333]" />
            </div>
            <p className="text-white font-bold text-sm">No workouts yet</p>
            <p className="text-[#4b5563] text-xs mt-1">Complete a workout to see it here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// ─── Session Row ──────────────────────────────────────────────────────────────

function SessionRow({ session }: { session: Session }) {
  const color = CATEGORY_COLORS[session.category];

  return (
    <div className="flex items-center gap-4 bg-[#141414] border border-[#1e1e1e] rounded-2xl px-5 py-4 hover:border-[#2a2a2a] transition-all group cursor-pointer">

      {/* Date */}
      <div className="w-14 flex-shrink-0 text-center">
        <p className="text-[#6b7280] text-[10px] tracking-widest uppercase">{session.date}</p>
        <p className="text-white font-black text-lg leading-none mt-0.5">{session.day}</p>
      </div>

      {/* Divider */}
      <div className="w-px h-10 bg-[#222] flex-shrink-0" />

      {/* Session info */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-0.5" style={{ color }}>
          {session.category}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-white font-semibold text-sm truncate">{session.name}</p>
          <span className="flex-shrink-0 text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-emerald/10 text-emerald border border-emerald/20">
            Live
          </span>
        </div>
        <p className="text-[#4b5563] text-xs mt-0.5">{session.exercise}</p>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
        <div className="text-center">
          <p className="text-[#4b5563] text-[9px] tracking-widest uppercase">Duration</p>
          <p className="text-white font-bold text-sm mt-0.5">{session.duration}</p>
        </div>
        <div className="text-center">
          <p className="text-[#4b5563] text-[9px] tracking-widest uppercase">Reps</p>
          <p className="text-white font-bold text-sm mt-0.5">{session.reps}</p>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight size={16} className="text-[#333] group-hover:text-[#6b7280] transition-colors flex-shrink-0" />
    </div>
  );
}
