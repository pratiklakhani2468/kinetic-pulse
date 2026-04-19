"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Play,
  Pause,
  RotateCcw,
  Dumbbell,
  CheckCircle,
  ArrowLeftRight,
  ArrowUp,
  ArrowDown,
  Users,
  Trophy,
  Flame,
  Copy,
  Check,
} from "lucide-react";
import PoseCamera from "@/components/workout/PoseCamera";
import { EXERCISES as EXERCISE_LIBRARY } from "@/lib/exercises";
import type { SessionState, Stage, Feedback } from "@/components/workout/types";
import type { AIFeedback } from "@/lib/poseUtils";
import { saveSession } from "@/lib/workoutStorage";
import WorkoutSummaryModal, { type SummaryData } from "@/components/workout/WorkoutSummaryModal";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  joinRoom,
  leaveRoom,
  updateReps,
  updateStatus,
  subscribeToRoom,
  getRoomMeta,
  type Participant,
} from "@/lib/rooms";

// ─── Constants ────────────────────────────────────────────────────────────────

const TARGET_REPS = 15;

const DOWN_FEEDBACK: Feedback[] = [
  { text: "Go Lower",            type: "warning" },
  { text: "Keep Back Straight",  type: "warning" },
  { text: "Bend Deeper",         type: "warning" },
];
const UP_FEEDBACK: Feedback[] = [
  { text: "Good Rep!",    type: "success" },
  { text: "Perfect Form", type: "success" },
  { text: "Keep It Up!",  type: "success" },
];
const RESET_FEEDBACK: Feedback = { text: "Start your set", type: "idle" };

// ─── Participant card ─────────────────────────────────────────────────────────

function ParticipantCard({
  p,
  isMe,
  isLeader,
  rank,
}: {
  p: Participant;
  isMe: boolean;
  isLeader: boolean;
  rank: number;
}) {
  return (
    <div
      className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all ${
        isMe
          ? "bg-emerald/8 border-emerald/30"
          : "bg-card border-border/30"
      }`}
    >
      {/* Rank */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
          rank === 1
            ? "bg-amber-400/20 text-amber-400"
            : rank === 2
            ? "bg-slate-400/20 text-slate-400"
            : rank === 3
            ? "bg-orange-700/20 text-orange-700"
            : "bg-muted/20 text-muted-foreground"
        }`}
      >
        {rank}
      </div>

      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
          isMe ? "bg-emerald/20 text-emerald" : "bg-muted/20 text-muted-foreground"
        }`}
      >
        {p.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`text-sm font-semibold truncate ${isMe ? "text-emerald" : "text-foreground"}`}>
            {p.name}
          </p>
          {isMe && (
            <span className="text-[9px] font-bold tracking-widest uppercase text-emerald/60 flex-shrink-0">
              you
            </span>
          )}
          {isLeader && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-400 flex-shrink-0">
              <Flame className="h-2.5 w-2.5" />
              Leader
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground capitalize">{p.status}</p>
      </div>

      {/* Reps */}
      <div className="text-right flex-shrink-0">
        <p
          className={`text-xl font-black leading-none tabular-nums ${
            isMe ? "text-emerald" : "text-foreground"
          }`}
        >
          {p.reps}
        </p>
        <p className="text-[9px] text-muted-foreground">reps</p>
      </div>
    </div>
  );
}

// ─── Per-tab identity ─────────────────────────────────────────────────────────
//
// Each browser tab gets a unique ID from sessionStorage.
// sessionStorage is isolated per tab (unlike localStorage, which is shared
// across all tabs of the same origin), so two tabs of the same Firebase
// account get separate Firestore participant documents.
//
// WHY useEffect, not useState lazy-initializer:
//   Next.js renders "use client" components on the server too (SSR).
//   On the server typeof window === "undefined", so sessionStorage is
//   inaccessible. A lazy initializer passed to useState runs during the
//   server render and returns "". React then hydrates the client using those
//   server-generated values — the initializer is NOT re-run on the client.
//   Result: tabId stays "" after hydration → the join guard (!tabId) fires →
//   the participant is never written to Firestore.
//
//   Moving the read into a useEffect guarantees it only ever runs on the
//   client (after hydration) where sessionStorage is available.

// ─── Main room page ───────────────────────────────────────────────────────────

export default function RoomPage() {
  const { user, loading } = useRequireAuth();
  const params  = useParams();
  const router  = useRouter();
  const roomId  = params.roomId as string;

  // ── Per-tab unique identity ────────────────────────────────────────────────
  // Start with empty strings (safe for SSR). A useEffect populates them from
  // sessionStorage on the client after hydration — see comment block above.
  const [tabId,   setTabId]   = useState("");
  const [tabName, setTabName] = useState("");

  useEffect(() => {
    // Runs only on the client — sessionStorage is always available here.
    let id = sessionStorage.getItem("roomTabId") ?? "";
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("roomTabId", id);
    }

    let name = sessionStorage.getItem("roomTabName") ?? "";
    if (!name) {
      name = `User-${id.slice(0, 4).toUpperCase()}`;
      sessionStorage.setItem("roomTabName", name);
    }

    console.log("USER ID:", id, "| NAME:", name);
    setTabId(id);
    setTabName(name);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — runs once on mount

  // ── Room state ─────────────────────────────────────────────────────────────

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [exerciseName, setExerciseName] = useState("Workout");
  const [roomReady, setRoomReady]       = useState(false);
  const [copied, setCopied]             = useState(false);
  const hasJoined = useRef(false);

  // ── Workout state ──────────────────────────────────────────────────────────

  const [session, setSession]         = useState<SessionState>("idle");
  const [reps, setReps]               = useState(0);
  const [stage, setStage]             = useState<Stage>("UP");
  const [feedback, setFeedback]       = useState<Feedback>(RESET_FEEDBACK);
  const [formAccuracy, setFormAccuracy] = useState(94);
  const [summary, setSummary]         = useState<SummaryData | null>(null);
  const [elapsed, setElapsed]         = useState(0);
  const [exerciseIndex, setExerciseIndex] = useState(0);

  const halfRepsRef      = useRef(0);
  const repsRef          = useRef(0);
  const formAccuracyRef  = useRef(94);
  const sessionRef       = useRef<SessionState>("idle");
  const exerciseIndexRef = useRef(0);
  const sessionStartRef  = useRef<number | null>(null);
  const savedThisSession = useRef(false);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { exerciseIndexRef.current = exerciseIndex; }, [exerciseIndex]);

  // ── Join / leave room ──────────────────────────────────────────────────────
  // Guard on `loading` (auth not yet resolved) and `tabId` (identity not ready).
  // We do NOT wait for `user` to be the participant key — we use the per-tab ID
  // so two tabs of the same Firebase account get separate Firestore documents.

  useEffect(() => {
    if (loading || !tabId || hasJoined.current) return;
    hasJoined.current = true;

    async function enter() {
      // Fetch room meta to resolve the exercise type
      const meta = await getRoomMeta(roomId);
      if (meta) {
        const ex = EXERCISE_LIBRARY.find((e) => e.id === meta.exerciseType);
        setExerciseName(ex?.name ?? meta.exerciseType);
        const idx = EXERCISE_LIBRARY.findIndex((e) => e.id === meta.exerciseType);
        if (idx >= 0) {
          setExerciseIndex(idx);
          exerciseIndexRef.current = idx;
        }
      }
      // Use the per-tab ID as the participant document key
      await joinRoom(roomId, tabId, tabName);
      setRoomReady(true);
    }

    enter();

    return () => {
      leaveRoom(roomId, tabId);
    };
  }, [loading, tabId, tabName, roomId]);

  // ── Subscribe to participants ──────────────────────────────────────────────

  useEffect(() => {
    const unsub = subscribeToRoom(roomId, setParticipants);
    return unsub;
  }, [roomId]);

  // ── Elapsed timer ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (session === "running") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [session]);

  // ── Sync reps to Firestore ─────────────────────────────────────────────────

  useEffect(() => {
    if (!tabId || !roomReady) return;
    updateReps(roomId, tabId, reps).catch(() => {});
  }, [reps, tabId, roomId, roomReady]);

  // ── Sync status to Firestore ───────────────────────────────────────────────

  useEffect(() => {
    if (!tabId || !roomReady) return;
    const status = session === "running" ? "active" : "resting";
    updateStatus(roomId, tabId, status).catch(() => {});
  }, [session, tabId, roomId, roomReady]);

  // ── Save + persist ─────────────────────────────────────────────────────────

  const persistSession = useCallback((currentReps: number, currentIdx: number) => {
    if (currentReps === 0 || savedThisSession.current) return;
    const duration = sessionStartRef.current
      ? Math.round((Date.now() - sessionStartRef.current) / 1000)
      : 0;
    const ex = EXERCISE_LIBRARY[currentIdx];
    saveSession({ exercise: ex.name, exerciseId: ex.id, reps: currentReps, duration, date: new Date().toISOString() }, user?.uid);
    savedThisSession.current = true;
  }, [user?.uid]);

  useEffect(() => {
    const handleUnload = () => persistSession(repsRef.current, exerciseIndexRef.current);
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [persistSession]);

  // ── Workout handlers ───────────────────────────────────────────────────────

  const handleStart = useCallback(() => {
    sessionRef.current = "running"; sessionStartRef.current = Date.now(); savedThisSession.current = false;
    setSession("running"); setFeedback({ text: "Session active!", type: "idle" });
  }, []);

  const handlePause = useCallback(() => {
    sessionRef.current = "paused"; setSession("paused");
  }, []);

  const handleReset = useCallback(() => {
    persistSession(repsRef.current, exerciseIndexRef.current);
    halfRepsRef.current = 0; repsRef.current = 0;
    sessionRef.current = "idle"; sessionStartRef.current = null;
    setReps(0); setSession("idle"); setStage("UP"); setFeedback(RESET_FEEDBACK);
    setFormAccuracy(94); setElapsed(0);
  }, [persistSession]);

  const handleSimulateRep = useCallback(() => {
    if (sessionRef.current !== "running") return;
    halfRepsRef.current += 1;
    const count = halfRepsRef.current;
    const newStage: Stage = count % 2 === 1 ? "DOWN" : "UP";
    setStage(newStage);
    if (newStage === "DOWN") {
      setFeedback(DOWN_FEEDBACK[Math.floor((count - 1) / 2) % DOWN_FEEDBACK.length]);
    } else {
      const newReps = Math.min(repsRef.current + 1, TARGET_REPS);
      repsRef.current = newReps; setReps(newReps);
      const acc = Math.floor(86 + Math.random() * 12);
      formAccuracyRef.current = acc; setFormAccuracy(acc);
      setFeedback(UP_FEEDBACK[Math.floor(count / 2 - 1) % UP_FEEDBACK.length]);
    }
  }, []);

  const handleFinish = useCallback(() => {
    const currentReps = repsRef.current; const currentIdx = exerciseIndexRef.current;
    const duration = sessionStartRef.current ? Math.round((Date.now() - sessionStartRef.current) / 1000) : 0;
    persistSession(currentReps, currentIdx);
    sessionRef.current = "paused"; setSession("paused");
    setSummary({ exercise: EXERCISE_LIBRARY[currentIdx].name, reps: currentReps, duration, formAccuracy: formAccuracyRef.current });
  }, [persistSession]);

  const handleSwitchExercise = useCallback(() => {
    handleReset(); setExerciseIndex((i) => (i + 1) % EXERCISE_LIBRARY.length);
  }, [handleReset]);

  const handlePoseRep = useCallback(() => {
    const newReps = Math.min(repsRef.current + 1, TARGET_REPS);
    repsRef.current = newReps; setReps(newReps);
    const acc = Math.floor(86 + Math.random() * 12);
    formAccuracyRef.current = acc; setFormAccuracy(acc);
    setFeedback(UP_FEEDBACK[Math.floor(Math.random() * UP_FEEDBACK.length)]);
  }, []);

  const handlePoseStage  = useCallback((s: Stage)    => setStage(s), []);
  const handlePoseFeedback = useCallback((fb: AIFeedback) => setFeedback({ text: fb.text, type: fb.type }), []);

  // ── Derived ────────────────────────────────────────────────────────────────

  const isRunning   = session === "running";
  const isIdle      = session === "idle";
  const exercise    = EXERCISE_LIBRARY[exerciseIndex];
  const setProgress = Math.round((reps / TARGET_REPS) * 100);
  const elapsedMin  = Math.floor(elapsed / 60);
  const elapsedSec  = String(elapsed % 60).padStart(2, "0");

  const leaderId   = participants[0]?.id; // already sorted desc by reps
  const myRoomReps = participants.find((p) => p.id === tabId)?.reps ?? 0;

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !roomReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald/30 border-t-emerald/80 animate-spin" />
          <p className="text-muted-foreground text-sm tracking-widest uppercase text-[10px]">
            Joining room…
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/training"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Training
            </Link>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Live Room
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald/10 border border-emerald/20 text-emerald text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                Live
              </span>
            </h1>
            <p className="text-muted-foreground text-sm">{exerciseName} · {participants.length} {participants.length === 1 ? "athlete" : "athletes"}</p>
          </div>

          {/* Room code chip */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border/40 hover:border-emerald/30 transition-all group"
            title="Click to copy room code"
          >
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground tracking-widest uppercase">Room Code</p>
              <p className="text-sm font-bold text-foreground font-mono">{roomId.slice(0, 8).toUpperCase()}</p>
            </div>
            {copied
              ? <Check className="h-4 w-4 text-emerald flex-shrink-0" />
              : <Copy className="h-4 w-4 text-muted-foreground group-hover:text-emerald flex-shrink-0 transition-colors" />
            }
          </button>
        </div>

        {/* Main grid — camera (left) + room panel (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Camera column (2/3) ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Camera */}
            <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
              <div className="relative flex aspect-video overflow-hidden">
                <PoseCamera
                  session={session}
                  feedback={feedback}
                  exerciseId={exercise.id}
                  onRep={handlePoseRep}
                  onStageChange={handlePoseStage}
                  onFeedback={handlePoseFeedback}
                />
              </div>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border/40 rounded-lg p-4 text-center">
                <p className="text-muted-foreground text-xs mb-1">My Reps</p>
                <p className="text-3xl font-black text-emerald leading-none">{reps}</p>
              </div>
              <div className="bg-card border border-border/40 rounded-lg p-4 text-center">
                <p className="text-muted-foreground text-xs mb-1">Form</p>
                <p className="text-3xl font-black text-blue-accent leading-none">
                  {isRunning ? `${formAccuracy}%` : "—"}
                </p>
              </div>
              <div className="bg-card border border-border/40 rounded-lg p-4 text-center">
                <p className="text-muted-foreground text-xs mb-1">Time</p>
                <p className="text-3xl font-black text-purple-accent leading-none">
                  {elapsedMin}:{elapsedSec}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-card border border-border/40 rounded-xl p-4 space-y-3">

              {/* Stage indicator */}
              <div className="grid grid-cols-2 gap-2">
                <div className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-bold uppercase transition-all ${
                  stage === "UP" ? "bg-blue-accent/10 border-blue-accent/30 text-blue-accent" : "bg-background border-border/40 text-muted-foreground"
                }`}>
                  <ArrowUp className="h-3.5 w-3.5" />UP
                </div>
                <div className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-bold uppercase transition-all ${
                  stage === "DOWN" ? "bg-orange-accent/10 border-orange-accent/30 text-orange-accent" : "bg-background border-border/40 text-muted-foreground"
                }`}>
                  <ArrowDown className="h-3.5 w-3.5" />DOWN
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Set Progress</span>
                  <span className="font-bold text-foreground">{setProgress}%</span>
                </div>
                <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${setProgress}%`,
                      background: "linear-gradient(90deg, oklch(0.55 0.18 250) 0%, oklch(0.63 0.223 160) 100%)",
                    }}
                  />
                </div>
              </div>

              {/* Feedback */}
              <div className="bg-background rounded-lg px-4 py-3 border border-border/40">
                <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">Feedback</p>
                <p className={`text-sm font-medium transition-colors ${
                  feedback.type === "success" ? "text-emerald" :
                  feedback.type === "warning" ? "text-orange-accent" :
                  "text-muted-foreground"
                }`}>{feedback.text}</p>
              </div>

              {/* Buttons row */}
              <div className="flex gap-2">
                <button
                  onClick={isRunning ? handlePause : handleStart}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isRunning
                      ? "bg-orange-accent/90 hover:bg-orange-accent text-white"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                >
                  {isRunning
                    ? <><Pause className="h-4 w-4" />Pause</>
                    : <><Play className="h-4 w-4 fill-current" />{session === "paused" ? "Resume" : "Start"}</>
                  }
                </button>
                <button
                  onClick={handleReset}
                  disabled={isIdle}
                  className="flex items-center justify-center px-4 py-2.5 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:bg-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSimulateRep}
                  disabled={!isRunning}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-border/40 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Dumbbell className="h-3.5 w-3.5" />Simulate Rep
                </button>
                {reps > 0 ? (
                  <button
                    onClick={handleFinish}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-emerald/30 text-xs font-semibold text-emerald hover:bg-emerald/10 transition-colors"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />Finish
                  </button>
                ) : (
                  <button
                    onClick={handleSwitchExercise}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-border/40 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />Switch
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Room panel (1/3) ─────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Your position summary */}
            <div className="bg-card border border-border/40 rounded-xl p-5">
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase mb-3">
                Your Stats
              </p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-5xl font-black text-emerald leading-none">{myRoomReps}</p>
                  <p className="text-xs text-muted-foreground mt-1">reps synced</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-foreground leading-none">
                    #{participants.findIndex((p) => p.id === tabId) + 1 || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">rank</p>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-card border border-border/40 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <h3 className="font-semibold text-foreground text-sm">Leaderboard</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{participants.length}</span>
                </div>
              </div>

              <div className="space-y-2">
                {/* Debug — remove after confirming multi-participant sync works */}
                {console.log("RENDERING PARTICIPANTS:", participants) as never}

                {participants.length === 0 ? (
                  <p className="text-center text-muted-foreground text-xs py-6">
                    Waiting for athletes to join…
                  </p>
                ) : (
                  participants.map((p, i) => (
                    <ParticipantCard
                      key={p.id}
                      p={p}
                      isMe={p.id === tabId}
                      isLeader={p.id === leaderId && p.reps > 0}
                      rank={i + 1}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Share panel */}
            <div className="bg-card border border-border/40 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Invite Athletes</h3>
              <p className="text-xs text-muted-foreground">
                Share the room code below. Anyone can join at{" "}
                <span className="text-foreground font-medium">Training → Join Room</span>.
              </p>
              <div className="flex items-center gap-2 bg-background rounded-lg px-4 py-3 border border-border/40">
                <code className="flex-1 text-sm font-mono text-foreground tracking-wider">
                  {roomId.slice(0, 8).toUpperCase()}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="text-muted-foreground hover:text-emerald transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary modal */}
      {summary && (
        <WorkoutSummaryModal
          data={summary}
          onClose={() => setSummary(null)}
        />
      )}
    </>
  );
}
