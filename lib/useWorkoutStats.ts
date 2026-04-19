"use client";

// ─── Firestore workout stats hook ─────────────────────────────────────────────

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

export interface RecentActivityItem {
  id: string;
  exercise: string;
  duration: number; // seconds
  reps: number;
  date: Date;
}

export interface WorkoutStats {
  loading: boolean;
  error: string | null;
  totalWorkouts: number;
  totalReps: number;
  activeDays: number;        // unique calendar days with at least one workout
  lastWorkout: string;       // e.g. "Today", "Yesterday", "Apr 7"
  recentActivities: RecentActivityItem[];
}

const EMPTY: WorkoutStats = {
  loading: false,
  error: null,
  totalWorkouts: 0,
  totalReps: 0,
  activeDays: 0,
  lastWorkout: "—",
  recentActivities: [],
};

function formatLastWorkout(date: Date): string {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs   = today.getTime() - d.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function useWorkoutStats(): WorkoutStats {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<WorkoutStats>({ ...EMPTY, loading: true });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setStats({ ...EMPTY, loading: false });
      return;
    }

    async function fetch() {
      try {
        // No where/orderBy — fetch all docs to avoid Firestore composite index requirement.
        // Filter and sort in JS below.
        const snap = await getDocs(collection(db, "workouts"));

        if (snap.empty) {
          setStats({ ...EMPTY, loading: false });
          return;
        }

        // Map, filter to this user, convert timestamp without .toDate()
        const docs = snap.docs
          .map((doc) => {
            const d = doc.data() as {
              userId?: string;
              exercise?: string;
              reps?: number;
              duration?: number;
              timestamp?: { seconds: number } | null;
            };
            const date = d.timestamp?.seconds
              ? new Date(d.timestamp.seconds * 1000)
              : new Date(0);
            return {
              id:       doc.id,
              userId:   d.userId ?? "",
              exercise: d.exercise ?? "Unknown",
              reps:     d.reps     ?? 0,
              duration: d.duration ?? 0,
              date,
            };
          })
          // Filter to the signed-in user only
          .filter((d) => d.userId === user!.uid)
          // Sort newest-first in JS
          .sort((a, b) => b.date.getTime() - a.date.getTime());

        if (docs.length === 0) {
          setStats({ ...EMPTY, loading: false });
          return;
        }

        const totalWorkouts = docs.length;
        const totalReps     = docs.reduce((s, d) => s + d.reps, 0);

        // Unique calendar days
        const uniqueDays = new Set(
          docs.map((d) => d.date.toLocaleDateString("en-US"))
        ).size;

        const lastWorkout = formatLastWorkout(docs[0].date);

        // Most recent 5 for the activity feed
        const recentActivities: RecentActivityItem[] = docs.slice(0, 5).map((d) => ({
          id:       d.id,
          exercise: d.exercise,
          duration: d.duration,
          reps:     d.reps,
          date:     d.date,
        }));

        setStats({
          loading: false,
          error: null,
          totalWorkouts,
          totalReps,
          activeDays: uniqueDays,
          lastWorkout,
          recentActivities,
        });
      } catch (err) {
        console.error("[Firestore] useWorkoutStats error:", err);
        setStats({ ...EMPTY, loading: false, error: "Failed to load stats." });
      }
    }

    fetch();
  }, [user, authLoading]);

  return stats;
}
