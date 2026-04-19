"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EXERCISES } from "@/lib/exercises";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { createRoom } from "@/lib/rooms";
import { Zap, Play, Users, Plus, ArrowRight, X, Loader2 } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDifficulty(level: number): string {
  if (level <= 2) return "Beginner";
  if (level === 3) return "Intermediate";
  if (level === 4) return "Advanced";
  return "Expert";
}

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner:     "bg-emerald/10 text-emerald border border-emerald/20",
  Intermediate: "bg-blue-accent/10 text-blue-accent border border-blue-accent/20",
  Advanced:     "bg-orange-accent/10 text-orange-accent border border-orange-accent/20",
  Expert:       "bg-purple-accent/10 text-purple-accent border border-purple-accent/20",
};

// ─── Join Room Modal ──────────────────────────────────────────────────────────

function JoinRoomModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleJoin() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError("Enter a room code."); return; }
    // Room IDs from Firestore are 20-char strings — the "code" we show is first 8 chars.
    // Users enter those first 8 chars; we resolve server-side by fetching rooms.
    // For simplicity: users paste the full ID or the 8-char prefix-search approach.
    // The safest UX: show the full room ID in the invite, accept it as-is.
    router.push(`/room/${trimmed}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Join a Room</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Enter the room code shared by the host to join their live session.
        </p>

        <div className="space-y-2">
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }}
            placeholder="Room code…"
            className="w-full bg-background border border-border/40 rounded-lg px-4 py-3 text-foreground font-mono tracking-widest text-center text-lg placeholder:text-muted-foreground/40 focus:outline-none focus:border-emerald/40 transition-colors"
            maxLength={28}
            autoFocus
          />
          {error && <p className="text-xs text-orange-accent">{error}</p>}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border/40 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors"
          >
            Join <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrainingPage() {
  const { loading } = useRequireAuth();
  const router = useRouter();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [creatingRoomFor, setCreatingRoomFor] = useState<string | null>(null);

  if (loading) return null;

  async function handleCreateRoom(exerciseId: string) {
    setCreatingRoomFor(exerciseId);
    try {
      const roomId = await createRoom(exerciseId);
      router.push(`/room/${roomId}`);
    } catch (err) {
      console.error("Failed to create room:", err);
      setCreatingRoomFor(null);
    }
  }

  return (
    <>
      <div className="p-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">Exercise Library</h1>
            <p className="text-muted-foreground">
              Curated movements engineered for maximum performance.
            </p>
          </div>

          {/* Live Rooms quick actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/40 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-emerald/30 transition-all"
            >
              <Users className="h-4 w-4" />
              Join Room
            </button>
          </div>
        </div>

        {/* Live Rooms banner */}
        <div className="relative overflow-hidden rounded-xl bg-card border border-emerald/20 p-5">
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 0% 50%, rgba(16,185,129,0.06) 0%, transparent 60%)" }}
          />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald/10 border border-emerald/20 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-emerald" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-sm font-bold text-foreground">Live Workout Rooms</h2>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald/10 border border-emerald/20 text-[9px] font-bold text-emerald tracking-widest uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                    New
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Train with friends in real time — see each other&apos;s reps update live.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald/30 text-sm font-semibold text-emerald hover:bg-emerald/10 transition-all flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
              Join Room
            </button>
          </div>
        </div>

        {/* Exercise grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXERCISES.map((exercise) => {
            const difficulty = getDifficulty(exercise.level);
            const isCreating = creatingRoomFor === exercise.id;
            return (
              <div
                key={exercise.id}
                className="bg-card border border-border/40 rounded-xl p-5 flex flex-col hover:border-emerald/40 transition-all"
              >
                {/* Icon + badge */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${exercise.muscleColor}18` }}
                  >
                    <Zap className="h-6 w-6" style={{ color: exercise.muscleColor }} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${DIFFICULTY_STYLES[difficulty]}`}>
                    {difficulty}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-base font-bold text-foreground mb-0.5">
                  {exercise.name}
                </h3>

                {/* Muscle */}
                <p
                  className="text-xs font-semibold mb-2"
                  style={{ color: exercise.muscleColor }}
                >
                  {exercise.muscle}
                </p>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-4">
                  {exercise.description}
                </p>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {/* Solo */}
                  <button
                    onClick={() =>
                      router.push(`/workout?exercise=${encodeURIComponent(exercise.id)}`)
                    }
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border/40 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:border-border/70 transition-all"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Solo
                  </button>

                  {/* Create Room */}
                  <button
                    onClick={() => handleCreateRoom(exercise.id)}
                    disabled={isCreating}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-emerald/30 text-sm font-medium text-emerald hover:bg-emerald/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isCreating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Users className="h-3.5 w-3.5" />
                    )}
                    {isCreating ? "Creating…" : "Room"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Recommended Session — full width */}
        <div className="bg-card border border-border/40 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-bold tracking-widest uppercase text-emerald mb-1">
                AI Analysis
              </p>
              <h2 className="text-foreground font-bold text-lg mb-2">
                Recommended Session
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                Based on your recent recovery metrics, we suggest a high-intensity
                posterior focus today to maximize hypertrophy.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="bg-muted/20 rounded-xl px-4 py-2.5 border border-border/20">
                  <p className="text-muted-foreground text-[9px] tracking-widest uppercase">Volume</p>
                  <p className="text-foreground font-bold text-sm mt-0.5">12.4k lbs</p>
                </div>
                <div className="bg-muted/20 rounded-xl px-4 py-2.5 border border-border/20">
                  <p className="text-muted-foreground text-[9px] tracking-widest uppercase">Duration</p>
                  <p className="text-foreground font-bold text-sm mt-0.5">45 min</p>
                </div>
              </div>
            </div>

            {/* Readiness ring */}
            <div className="flex-shrink-0 ml-6 flex flex-col items-center">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="oklch(0.25 0 0)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="oklch(0.63 0.223 160)" strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 40 * 0.88} ${2 * Math.PI * 40}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-emerald font-black text-lg leading-none">88%</span>
                </div>
              </div>
              <p className="text-muted-foreground text-[9px] tracking-widest uppercase mt-2">
                Readiness
              </p>
            </div>
          </div>
        </div>
      </div>

      {showJoinModal && <JoinRoomModal onClose={() => setShowJoinModal(false)} />}
    </>
  );
}
