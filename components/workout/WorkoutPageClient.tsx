"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  ArrowLeftRight,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Ghost,
} from "lucide-react";
import PoseCamera from "@/components/workout/PoseCamera";
import { EXERCISES as EXERCISE_LIBRARY } from "@/lib/exercises";
import type { SessionState, Stage, Feedback } from "@/components/workout/types";
import type { AIFeedback } from "@/lib/poseUtils";
import { saveSession } from "@/lib/workoutStorage";
import WorkoutSummaryModal, { type SummaryData } from "@/components/workout/WorkoutSummaryModal";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { loadGhost } from "@/lib/ghostMode";

// ─── Constants ────────────────────────────────────────────────────────────────

const EXERCISE_NAMES = EXERCISE_LIBRARY.map((e) => e.name);

// Feedback messages that represent genuine form problems worth reporting to Gemini
const FORM_ISSUE_SIGNALS = new Set([
  "Control Your Movement",
  "Keep Both Arms Even",
  "Curl Higher",
  "Balance Your Weight",
  "Go a Little Lower",
  "Go Lower",
  "Lock Out Your Arms",
]);

// Subset that specifically indicates bilateral asymmetry
const IMBALANCE_SIGNALS = new Set([
  "Keep Both Arms Even",
  "Balance Your Weight",
]);

const TARGET_REPS = 15;

const DOWN_FEEDBACK: Feedback[] = [
  { text: "Go Lower", type: "warning" },
  { text: "Keep Back Straight", type: "warning" },
  { text: "Bend Deeper", type: "warning" },
];

const UP_FEEDBACK: Feedback[] = [
  { text: "Good Rep!", type: "success" },
  { text: "Perfect Form", type: "success" },
  { text: "Keep It Up!", type: "success" },
];

const RESET_FEEDBACK: Feedback = { text: "Start your set", type: "idle" };

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkoutPageClient() {
  const { user } = useRequireAuth();
  const searchParams = useSearchParams();
  const exerciseParam = searchParams.get("exercise");
  const initialIndex = exerciseParam
    ? Math.max(0, EXERCISE_LIBRARY.findIndex((e) => e.id === exerciseParam))
    : 0;

  const [session, setSession]           = useState<SessionState>("idle");
  const [reps, setReps]                 = useState(0);
  const [stage, setStage]               = useState<Stage>("UP");
  const [feedback, setFeedback]         = useState<Feedback>(RESET_FEEDBACK);
  const [exerciseIndex, setExerciseIndex] = useState(initialIndex);
  const [formAccuracy, setFormAccuracy] = useState(94);
  const [summary, setSummary]           = useState<SummaryData | null>(null);
  const [elapsed, setElapsed]           = useState(0);
  const [ghostMode, setGhostMode]       = useState(false);
  const [hasGhostData, setHasGhostData] = useState(false);

  // Refs that mirror mutable values for safe synchronous reads inside callbacks
  const halfRepsRef       = useRef(0);
  const repsRef           = useRef(0);
  const formAccuracyRef   = useRef(94);
  const sessionRef        = useRef<SessionState>("idle");
  const exerciseIndexRef  = useRef(exerciseIndex);
  const sessionStartRef   = useRef<number | null>(null);
  const savedThisSession  = useRef(false);
  const timerRef          = useRef<ReturnType<typeof setInterval> | null>(null);

  // Issue frequency map — counts how often each form-problem message fires.
  // Reset on session reset.  Top 3 are sent to Gemini at session end.
  const issueFrqRef  = useRef<Map<string, number>>(new Map());
  const imbalanceRef = useRef(false);

  // exerciseIndexRef kept in sync via effect (changes are infrequent)
  useEffect(() => { exerciseIndexRef.current = exerciseIndex; }, [exerciseIndex]);

  // ── Check ghost data availability whenever exercise changes ───────────────
  useEffect(() => {
    const ex = EXERCISE_LIBRARY[exerciseIndex];
    const data = loadGhost(ex.id);
    setHasGhostData(data !== null);
    // If the exercise changed while ghost mode was on and the new exercise
    // has no recording, turn ghost mode off automatically.
    if (data === null) setGhostMode(false);
  }, [exerciseIndex]);

  // ── Elapsed timer ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (session === "running") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [session]);

  // ── Save helper ───────────────────────────────────────────────────────────

  const persistSession = useCallback((currentReps: number, currentExerciseIndex: number) => {
    if (currentReps === 0 || savedThisSession.current) return;
    const duration = sessionStartRef.current
      ? Math.round((Date.now() - sessionStartRef.current) / 1000)
      : 0;
    const ex = EXERCISE_LIBRARY[currentExerciseIndex];
    saveSession({
      exercise:   ex.name,
      exerciseId: ex.id,
      reps:       currentReps,
      duration,
      date:       new Date().toISOString(),
    }, user?.uid);
    savedThisSession.current = true;
  }, []);

  // Save on page close / navigation away
  useEffect(() => {
    function handleUnload() {
      persistSession(repsRef.current, exerciseIndexRef.current);
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [persistSession]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStart = useCallback(() => {
    sessionRef.current       = "running";
    sessionStartRef.current  = Date.now();
    savedThisSession.current = false;
    setSession("running");
    setFeedback({ text: "Session active — begin your movement!", type: "idle" });
  }, []);

  const handlePause = useCallback(() => {
    sessionRef.current = "paused";
    setSession("paused");
  }, []);

  const handleReset = useCallback(() => {
    persistSession(repsRef.current, exerciseIndexRef.current);
    halfRepsRef.current     = 0;
    repsRef.current         = 0;
    sessionRef.current      = "idle";
    sessionStartRef.current = null;
    // Clear issue tracking for the new session
    issueFrqRef.current.clear();
    imbalanceRef.current = false;
    setReps(0);
    setSession("idle");
    setStage("UP");
    setFeedback(RESET_FEEDBACK);
    setFormAccuracy(94);
    setElapsed(0);
  }, [persistSession]);

  const handleFinish = useCallback(() => {
    const currentReps = repsRef.current;
    const currentIdx  = exerciseIndexRef.current;
    const duration    = sessionStartRef.current
      ? Math.round((Date.now() - sessionStartRef.current) / 1000)
      : 0;

    persistSession(currentReps, currentIdx);

    sessionRef.current = "paused";
    setSession("paused");

    // Derive the 3 most-frequent form issues to send to the AI coach
    const topIssues = [...issueFrqRef.current.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([text]) => text);

    setSummary({
      exercise:     EXERCISE_LIBRARY[currentIdx].name,
      reps:         currentReps,
      duration,
      formAccuracy: formAccuracyRef.current,
      issues:       topIssues,
      imbalance:    imbalanceRef.current,
    });
  }, [persistSession]);

  const handleSwitchExercise = useCallback(() => {
    handleReset();
    setExerciseIndex((i) => (i + 1) % EXERCISE_NAMES.length);
  }, [handleReset]);

  // ── Pose detection callbacks ──────────────────────────────────────────────

  const handlePoseRep = useCallback(() => {
    const newReps = Math.min(repsRef.current + 1, TARGET_REPS);
    repsRef.current = newReps;
    setReps(newReps);
    const acc = Math.floor(86 + Math.random() * 12);
    formAccuracyRef.current = acc;
    setFormAccuracy(acc);
    setFeedback(UP_FEEDBACK[Math.floor(Math.random() * UP_FEEDBACK.length)]);
  }, []);

  const handlePoseStage = useCallback((newStage: Stage) => {
    setStage(newStage);
  }, []);

  const handlePoseFeedback = useCallback((fb: AIFeedback) => {
    setFeedback({ text: fb.text, type: fb.type });

    // Count form-problem signals for the end-of-session AI report.
    // Only warnings in the FORM_ISSUE_SIGNALS set are meaningful problems.
    if (fb.type === "warning" && FORM_ISSUE_SIGNALS.has(fb.text)) {
      issueFrqRef.current.set(
        fb.text,
        (issueFrqRef.current.get(fb.text) ?? 0) + 1,
      );
      if (IMBALANCE_SIGNALS.has(fb.text)) {
        imbalanceRef.current = true;
      }
    }
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────

  const isRunning  = session === "running";
  const isIdle     = session === "idle";
  const exercise   = EXERCISE_LIBRARY[exerciseIndex];
  const setProgress = Math.round((reps / TARGET_REPS) * 100);
  const elapsedMin = Math.floor(elapsed / 60);
  const elapsedSec = String(elapsed % 60).padStart(2, "0");

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="p-6 space-y-4">

        {/* Page header */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Workout Session</h1>
          <p className="text-muted-foreground text-sm">Real-time pose detection and guidance</p>
        </div>

        {/* ── Main grid: 2-col left (camera + metrics) / 1-col right (controls) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── LEFT: Camera + Metrics ──────────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Camera — parent must be flex so PoseCamera's flex-1 fills the height */}
            <div className="bg-card border border-border/40 rounded-xl overflow-hidden flex-1">
              <div className="relative flex w-full h-[60vh] min-h-[420px] overflow-hidden">
                <PoseCamera
                  session={session}
                  feedback={feedback}
                  exerciseId={exercise.id}
                  ghostMode={ghostMode}
                  onRep={handlePoseRep}
                  onStageChange={handlePoseStage}
                  onFeedback={handlePoseFeedback}
                />
              </div>
            </div>

            {/* Metrics row — flush under camera */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border/40 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-0.5">Form Accuracy</p>
                  <p className="text-2xl font-bold text-emerald">
                    {isRunning ? `${formAccuracy}%` : "—"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-emerald" />
                </div>
              </div>
              <div className="bg-card border border-border/40 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-0.5">Session Time</p>
                  <p className="text-2xl font-bold text-blue-accent">
                    {elapsedMin}:{elapsedSec}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-accent/10 flex items-center justify-center flex-shrink-0">
                  <Play className="h-5 w-5 text-blue-accent" />
                </div>
              </div>
            </div>

            {/* Live analysis panel — fills remaining left-column space */}
            <div className="bg-card border border-border/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Live Analysis
                </p>
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald"
                    style={{ animation: isRunning ? "lp-dot-pulse 2s infinite" : "none" }}
                  />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {isRunning ? "Active" : "Idle"}
                  </span>
                </span>
              </div>

              {/* Stage + feedback in one compact block */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Phase</p>
                  <p className={`text-sm font-bold ${stage === "DOWN" ? "text-orange-accent" : "text-blue-accent"}`}>
                    {stage === "DOWN" ? "↓ Lowering" : "↑ Rising"}
                  </p>
                </div>
                <div className="bg-background rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Reps</p>
                  <p className="text-sm font-bold text-foreground">
                    {reps} <span className="text-muted-foreground font-normal">/ {TARGET_REPS}</span>
                  </p>
                </div>
              </div>

              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Feedback</p>
                <p className={`text-sm font-medium transition-colors ${
                  feedback.type === "success" ? "text-emerald" :
                  feedback.type === "warning" ? "text-orange-accent" :
                  "text-muted-foreground"
                }`}>
                  {feedback.text}
                </p>
              </div>
            </div>

          </div>

          {/* ── RIGHT: Controls ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Exercise + Reps + Progress */}
            <div className="bg-card border border-border/40 rounded-xl p-4 space-y-4">

              {/* Exercise header */}
              <div>
                <h2 className="text-base font-semibold text-foreground leading-tight">
                  {exercise.name}
                </h2>
                <p className="text-xs text-muted-foreground">{exercise.muscle}</p>
              </div>

              {/* Rep counter */}
              <div className="bg-background rounded-lg py-4 px-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Reps Completed</p>
                <p className="text-6xl font-black text-emerald leading-none">{reps}</p>
                <p className="text-xs text-muted-foreground mt-1">/ {TARGET_REPS} target</p>
              </div>

              {/* Progress bar */}
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

              {/* Stage indicator */}
              <div className="grid grid-cols-2 gap-2">
                <div className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-bold uppercase transition-all ${
                  stage === "UP"
                    ? "bg-blue-accent/10 border-blue-accent/30 text-blue-accent"
                    : "bg-background border-border/40 text-muted-foreground"
                }`}>
                  <ArrowUp className="h-3 w-3" />
                  UP
                </div>
                <div className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-bold uppercase transition-all ${
                  stage === "DOWN"
                    ? "bg-orange-accent/10 border-orange-accent/30 text-orange-accent"
                    : "bg-background border-border/40 text-muted-foreground"
                }`}>
                  <ArrowDown className="h-3 w-3" />
                  DOWN
                </div>
              </div>

              {/* Start / Pause + Reset */}
              <div className="flex gap-2">
                <button
                  onClick={isRunning ? handlePause : handleStart}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isRunning
                      ? "bg-orange-accent/90 hover:bg-orange-accent text-white"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                >
                  {isRunning ? (
                    <><Pause className="h-4 w-4" />Pause</>
                  ) : (
                    <><Play className="h-4 w-4 fill-current" />{session === "paused" ? "Resume" : "Start"}</>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  disabled={isIdle}
                  className="flex items-center justify-center px-3 py-2.5 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:bg-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              {/* Ghost Mode */}
              <button
                onClick={() => setGhostMode((v) => !v)}
                disabled={!hasGhostData}
                title={hasGhostData ? "Toggle ghost skeleton from your previous session" : "No previous session recorded for this exercise"}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  ghostMode
                    ? "bg-cyan-400/10 border-cyan-400/40 text-cyan-400 hover:bg-cyan-400/20"
                    : "border-border/40 text-muted-foreground hover:text-foreground hover:bg-card"
                }`}
              >
                <Ghost className="h-4 w-4" />
                Ghost Mode {ghostMode ? "ON" : "OFF"}
              </button>

              {/* Complete or Switch */}
              {reps > 0 ? (
                <button
                  onClick={handleFinish}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-emerald/30 text-sm font-semibold text-emerald hover:bg-emerald/10 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  Complete Workout
                </button>
              ) : (
                <button
                  onClick={handleSwitchExercise}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-border/40 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Switch Exercise
                </button>
              )}
            </div>

            {/* Real-time feedback */}
            <div className="bg-card border border-border/40 rounded-xl p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Real-time Feedback</p>
              <p className={`text-sm font-medium transition-colors ${
                feedback.type === "success" ? "text-emerald" :
                feedback.type === "warning" ? "text-orange-accent" :
                "text-muted-foreground"
              }`}>
                {feedback.text}
              </p>
            </div>

            {/* Exercise tips */}
            <div className="bg-card border border-border/40 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Exercise Tips</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-emerald mt-0.5 flex-shrink-0">•</span>
                  <span>{exercise.description}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-accent mt-0.5 flex-shrink-0">•</span>
                  <span>Maintain proper form throughout each rep</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-orange-accent mt-0.5 flex-shrink-0">•</span>
                  <span>Control the movement on both up and down phases</span>
                </li>
              </ul>
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
