// ─── Workout session persistence (localStorage + Firestore) ──────────────────

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface SavedSession {
  id: string;       // unique — ISO timestamp at save time
  exercise: string; // display name e.g. "Bicep Curls"
  exerciseId: string;
  reps: number;
  duration: number; // seconds
  date: string;     // ISO date string
}

const STORAGE_KEY = "kinetic_sessions";

// ─── localStorage ─────────────────────────────────────────────────────────────

export function loadSessions(): SavedSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedSession[]) : [];
  } catch {
    return [];
  }
}

function writeLocalStorage(session: Omit<SavedSession, "id">): void {
  if (typeof window === "undefined") return;
  const sessions = loadSessions();
  sessions.unshift({ ...session, id: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// ─── Firestore ────────────────────────────────────────────────────────────────

async function writeFirestore(session: Omit<SavedSession, "id">, userId?: string): Promise<void> {
  const ref = await addDoc(collection(db, "workouts"), {
    exercise:  session.exercise,
    reps:      session.reps,
    duration:  session.duration,
    timestamp: serverTimestamp(),
    ...(userId ? { userId } : {}),
  });
  console.log("[Firestore] workout saved →", ref.id);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function saveSession(session: Omit<SavedSession, "id">, userId?: string): void {
  // 1. Write localStorage synchronously (always works offline)
  writeLocalStorage(session);

  // 2. Write Firestore asynchronously — non-blocking, errors logged
  writeFirestore(session, userId).catch((err) =>
    console.error("[Firestore] failed to save workout:", err)
  );
}
