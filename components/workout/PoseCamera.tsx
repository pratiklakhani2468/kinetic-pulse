"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Zap, CheckCircle, AlertCircle, CameraOff } from "lucide-react";
import type { SessionState, Feedback, Stage } from "@/components/workout/types";
import {
  calculateAngle,
  detectCurlRep,
  detectSquatRep,
  getAIFeedback,
  getSquatFeedback,
  LANDMARKS,
  type CurlStage,
  type SquatStage,
  type AIFeedback,
} from "@/lib/poseUtils";
import {
  saveGhost,
  loadGhost,
  findGhostFrame,
  compressLandmarks,
  type GhostFrame,
  type GhostLandmark,
} from "@/lib/ghostMode";

// ─── MediaPipe types (minimal — avoids SSR issues) ───────────────────────────

interface NormalizedLandmark {
  x: number;          // [0, 1] relative to frame width
  y: number;          // [0, 1] relative to frame height
  z: number;
  visibility?: number;
}

interface PoseResults {
  poseLandmarks?: NormalizedLandmark[];
}

// ─── Skeleton connections (MediaPipe Pose 33-landmark model) ─────────────────
//
// Only body joints — skip face micro-landmarks (0-10) for cleanliness.

const CONNECTIONS: [number, number][] = [
  // Shoulders
  [11, 12],
  // Left arm
  [11, 13], [13, 15],
  // Right arm
  [12, 14], [14, 16],
  // Torso
  [11, 23], [12, 24], [23, 24],
  // Left leg
  [23, 25], [25, 27],
  // Right leg
  [24, 26], [26, 28],
  // Feet
  [27, 29], [29, 31], [27, 31],
  [28, 30], [30, 32], [28, 32],
];

const JOINT_INDICES = new Set(CONNECTIONS.flat());

// ─── Drawing ──────────────────────────────────────────────────────────────────
//
// Canvas x-coords are mirrored (1 - lm.x) so they align with the
// CSS-mirrored webcam feed (react-webcam `mirrored` prop).

function drawPose(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  w: number,
  h: number
): void {
  ctx.clearRect(0, 0, w, h);

  const px = (lm: NormalizedLandmark) => (1 - lm.x) * w;
  const py = (lm: NormalizedLandmark) => lm.y * h;
  const visible = (lm: NormalizedLandmark) => (lm.visibility ?? 1) >= 0.4;

  // Connections
  ctx.strokeStyle = "rgba(74, 222, 128, 0.85)";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";

  for (const [a, b] of CONNECTIONS) {
    const la = landmarks[a];
    const lb = landmarks[b];
    if (!la || !lb || !visible(la) || !visible(lb)) continue;
    ctx.beginPath();
    ctx.moveTo(px(la), py(la));
    ctx.lineTo(px(lb), py(lb));
    ctx.stroke();
  }

  // Joints
  for (const idx of JOINT_INDICES) {
    const lm = landmarks[idx];
    if (!lm || !visible(lm)) continue;
    ctx.beginPath();
    ctx.arc(px(lm), py(lm), 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(74, 222, 128, 0.95)";
    ctx.fill();
  }
}

// ─── Ghost skeleton drawing ───────────────────────────────────────────────────
//
// Same CONNECTIONS / JOINT_INDICES as the live skeleton, but rendered with
// a translucent cyan overlay so it's visually distinct.

function drawGhost(
  ctx: CanvasRenderingContext2D,
  landmarks: GhostLandmark[],
  w: number,
  h: number
): void {
  const px = (lm: GhostLandmark) => (1 - lm.x) * w;
  const py = (lm: GhostLandmark) => lm.y * h;
  const visible = (lm: GhostLandmark) => lm.v >= 0.4;

  ctx.save();
  ctx.globalAlpha = 0.35;

  // Connections
  ctx.strokeStyle = "rgba(0, 200, 255, 0.9)";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";

  for (const [a, b] of CONNECTIONS) {
    const la = landmarks[a];
    const lb = landmarks[b];
    if (!la || !lb || !visible(la) || !visible(lb)) continue;
    ctx.beginPath();
    ctx.moveTo(px(la), py(la));
    ctx.lineTo(px(lb), py(lb));
    ctx.stroke();
  }

  // Joints
  for (const idx of JOINT_INDICES) {
    const lm = landmarks[idx];
    if (!lm || !visible(lm)) continue;
    ctx.beginPath();
    ctx.arc(px(lm), py(lm), 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 200, 255, 0.95)";
    ctx.fill();
  }

  ctx.restore();
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  session: SessionState;
  feedback: Feedback;
  exerciseId?: string;
  /** Show a translucent ghost skeleton from the previous best session */
  ghostMode?: boolean;
  /** Called once per completed rep */
  onRep?: () => void;
  /** Called whenever the movement stage changes */
  onStageChange?: (stage: Stage) => void;
  /** Called with AI coaching feedback (throttled to avoid flicker) */
  onFeedback?: (fb: AIFeedback) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PoseCamera({ session, feedback, exerciseId = "bicep-curls", ghostMode = false, onRep, onStageChange, onFeedback }: Props) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const poseRef   = useRef<any>(null);

  // Stage lives in refs — read inside the rAF loop without stale closures
  const curlStageRef  = useRef<CurlStage>("DOWN");
  const squatStageRef = useRef<SquatStage>("UP");

  // Keep callbacks and props in refs so the onResults closure always reads the latest version
  const onRepRef         = useRef(onRep);
  const onStageChangeRef = useRef(onStageChange);
  const onFeedbackRef    = useRef(onFeedback);
  const exerciseIdRef    = useRef(exerciseId);
  const ghostModeRef     = useRef(ghostMode);
  useEffect(() => { onRepRef.current = onRep; },               [onRep]);
  useEffect(() => { onStageChangeRef.current = onStageChange; }, [onStageChange]);
  useEffect(() => { onFeedbackRef.current = onFeedback; },     [onFeedback]);
  useEffect(() => { exerciseIdRef.current = exerciseId; },     [exerciseId]);
  useEffect(() => { ghostModeRef.current = ghostMode; },       [ghostMode]);

  // ── Ghost Mode: recording + playback refs ────────────────────────────────
  const ghostFramesRef     = useRef<GhostFrame[] | null>(null);   // loaded previous session
  const recordingFramesRef = useRef<GhostFrame[]>([]);             // frames captured this session
  const lastRecordMsRef    = useRef<number>(0);                    // throttle ~10 fps
  const sessionStartMsRef  = useRef<number>(0);                    // wall-clock start of this session

  // Feedback stability — candidate must hold steady for FEEDBACK_HOLD_MS before committing
  const FEEDBACK_HOLD_MS = 300;
  const pendingFeedbackRef = useRef<{ text: string; type: "success" | "warning"; since: number } | null>(null);
  const committedFeedbackRef = useRef<string>("");

  // Angle smoothing — rolling buffer of last 5 raw angles
  const ANGLE_BUFFER_SIZE = 7;
  const angleBufferRef = useRef<number[]>([]);

  // Rep debounce — prevent duplicate counts from rapid angle fluctuations
  const REP_COOLDOWN_MS = 850;
  const lastRepTimeRef = useRef<number>(0);

  const [camReady,  setCamReady]  = useState(false);
  const [camError,  setCamError]  = useState(false);
  const [poseReady, setPoseReady] = useState(false);

  const isActive = session === "running";
  const isIdle   = session === "idle";

  // ── Ghost Mode: detect session start / stop transitions ───────────────────

  const prevIsActiveRef = useRef(false);
  useEffect(() => {
    const wasActive = prevIsActiveRef.current;
    prevIsActiveRef.current = isActive;

    if (isActive && !wasActive) {
      // Session just started — reset recording buffer, capture start time,
      // and pre-load the ghost frames from the previous best session.
      recordingFramesRef.current = [];
      lastRecordMsRef.current    = 0;
      sessionStartMsRef.current  = Date.now();
      ghostFramesRef.current     = loadGhost(exerciseIdRef.current);
      console.log(
        "[GhostMode] Session started. Ghost loaded:",
        ghostFramesRef.current ? `${ghostFramesRef.current.length} frames` : "none"
      );
    } else if (!isActive && wasActive) {
      // Session just ended — persist the frames we recorded so they become
      // the ghost for the next session.
      if (recordingFramesRef.current.length > 0) {
        saveGhost(exerciseIdRef.current, recordingFramesRef.current);
        console.log(
          "[GhostMode] Saved",
          recordingFramesRef.current.length,
          "frames for",
          exerciseIdRef.current
        );
      }
    }
  }, [isActive]);

  // ── Sync canvas size to its CSS dimensions ────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function sync() {
      if (!canvas) return;
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // ── Initialise MediaPipe Pose (dynamic import — client only) ──────────────

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Dynamic import prevents SSR errors
        const { Pose } = await import("@mediapipe/pose");

        const pose = new Pose({
          // locateFile tells MediaPipe where to fetch WASM + model files
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults((results: PoseResults) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          const landmarks = results.poseLandmarks;

          if (landmarks) {
            // ── Draw skeleton ─────────────────────────────────────────────
            drawPose(ctx, landmarks, canvas.width, canvas.height);

            // ── Record frame for ghost (throttled to ~10 fps) ─────────────
            const nowMs = Date.now();
            const startMs = sessionStartMsRef.current;
            const elapsed = startMs > 0 ? nowMs - startMs : 0;
            if (elapsed > 0 && nowMs - lastRecordMsRef.current >= 100) {
              lastRecordMsRef.current = nowMs;
              recordingFramesRef.current.push({
                t: elapsed,
                lm: compressLandmarks(landmarks),
              });
            }

            // ── Draw ghost skeleton ───────────────────────────────────────
            const ghostFrames = ghostFramesRef.current;
            if (ghostModeRef.current && ghostFrames && elapsed > 0) {
              const ghostFrame = findGhostFrame(ghostFrames, elapsed);
              if (ghostFrame) {
                drawGhost(ctx, ghostFrame.lm, canvas.width, canvas.height);
              }
            }

            // ── Select landmarks by exercise ──────────────────────────────
            const isSquat = exerciseIdRef.current === "squats";

            const ptA = landmarks[isSquat ? LANDMARKS.RIGHT_HIP   : LANDMARKS.RIGHT_SHOULDER];
            const ptB = landmarks[isSquat ? LANDMARKS.RIGHT_KNEE  : LANDMARKS.RIGHT_ELBOW];
            const ptC = landmarks[isSquat ? LANDMARKS.RIGHT_ANKLE : LANDMARKS.RIGHT_WRIST];

            const MIN_VISIBILITY = 0.6;
            const allVisible =
              (ptA?.visibility ?? 0) >= MIN_VISIBILITY &&
              (ptB?.visibility ?? 0) >= MIN_VISIBILITY &&
              (ptC?.visibility ?? 0) >= MIN_VISIBILITY;

            if (allVisible) {
              const rawAngle = calculateAngle(ptA, ptB, ptC);

              // ── Smooth angle via rolling average ──────────────────────────
              const buf = angleBufferRef.current;
              buf.push(rawAngle);
              if (buf.length > ANGLE_BUFFER_SIZE) buf.shift();
              const angle = buf.reduce((s, v) => s + v, 0) / buf.length;

              // ── Rep detection (exercise-specific) ─────────────────────────
              let repCounted = false;
              if (isSquat) {
                const { newStage, repCounted: counted } = detectSquatRep(angle, squatStageRef.current);
                if (newStage !== squatStageRef.current) {
                  squatStageRef.current = newStage;
                  const uiStage: Stage = newStage === "UP" ? "UP" : "DOWN";
                  onStageChangeRef.current?.(uiStage);
                }
                repCounted = counted;
              } else {
                const { newStage, repCounted: counted } = detectCurlRep(angle, curlStageRef.current);
                if (newStage !== curlStageRef.current) {
                  curlStageRef.current = newStage;
                  const uiStage: Stage = newStage === "UP" ? "UP" : "DOWN";
                  onStageChangeRef.current?.(uiStage);
                }
                repCounted = counted;
              }

              // Debug — logs angle + current stage every frame so you can
              // verify thresholds in the browser console (DOWN > 150°, UP < 60°).
              console.log(
                "ANGLE:", Math.round(angle),
                "| STAGE:", isSquat ? squatStageRef.current : curlStageRef.current,
                repCounted ? "| ✓ REP" : ""
              );

              if (repCounted) {
                const now = Date.now();
                if (now - lastRepTimeRef.current >= REP_COOLDOWN_MS) {
                  lastRepTimeRef.current = now;
                  onRepRef.current?.();
                }
              }

              // ── AI coaching feedback (consistency gate) ───────────────────
              // A candidate must hold steady for FEEDBACK_HOLD_MS before
              // being committed — rapid switches reset the timer silently.
              const aiFb = isSquat
                ? getSquatFeedback(angle, squatStageRef.current)
                : getAIFeedback(angle, curlStageRef.current);
              const now = Date.now();
              const pending = pendingFeedbackRef.current;

              if (pending && pending.text === aiFb.text) {
                if (now - pending.since >= FEEDBACK_HOLD_MS &&
                    committedFeedbackRef.current !== aiFb.text) {
                  committedFeedbackRef.current = aiFb.text;
                  onFeedbackRef.current?.(aiFb);
                }
              } else {
                pendingFeedbackRef.current = { ...aiFb, since: now };
              }
            }
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        });

        if (!cancelled) {
          poseRef.current = pose;
          setPoseReady(true);
        }
      } catch (err) {
        console.error("MediaPipe Pose init failed:", err);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // ── Detection loop — runs every animation frame ───────────────────────────

  const startLoop = useCallback(() => {
    async function loop() {
      const video = webcamRef.current?.video;
      const pose  = poseRef.current;

      if (video && pose && video.readyState >= 2) {
        try {
          await pose.send({ image: video });
        } catch {
          // Frame send errors are transient — ignore and continue
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // Reset curl stage, angle buffer and clear canvas when stopping
    curlStageRef.current  = "DOWN";
    squatStageRef.current = "UP";
    angleBufferRef.current = [];
    lastRepTimeRef.current = 0;
    pendingFeedbackRef.current = null;
    committedFeedbackRef.current = "";
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Start / stop loop based on session state and readiness
  useEffect(() => {
    if (isActive && poseReady && camReady) {
      startLoop();
    } else {
      stopLoop();
    }
    return stopLoop;
  }, [isActive, poseReady, camReady, startLoop, stopLoop]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleUserMedia  = useCallback(() => { setCamReady(true);  setCamError(false); }, []);
  const handleMediaError = useCallback(() => { setCamError(true);  setCamReady(false); }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative flex-1 rounded-2xl overflow-hidden bg-[#0e0e0c]">

      {/* Live webcam feed */}
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored
        videoConstraints={{ facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }}
        onUserMedia={handleUserMedia}
        onUserMediaError={handleMediaError}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: camReady ? 1 : 0 }}
      />

      {/* Canvas — pose landmarks are drawn here */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
      />

      {/* Camera error */}
      {camError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20">
          <CameraOff size={32} className="text-[#4b5563]" />
          <p className="text-[#4b5563] text-sm font-medium">Camera unavailable</p>
          <p className="text-[#3d3d3d] text-xs">Check browser permissions and reload</p>
        </div>
      )}

      {/* Initialising */}
      {!camReady && !camError && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 z-20">
          <span className="w-2 h-2 rounded-full bg-emerald/50 animate-pulse" />
          <span className="text-[#4b5563] text-xs tracking-widest uppercase">
            Initialising camera…
          </span>
        </div>
      )}

      {/* Gradient — keeps badges readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 z-20 pointer-events-none" />

      {/* LIVE AI TRACKING badge */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className={`flex items-center gap-2 backdrop-blur-sm border rounded-full px-4 py-1.5 transition-colors ${
          isActive
            ? "bg-black/60 border-emerald/30"
            : "bg-black/40 border-white/10"
        }`}>
          <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald animate-pulse" : "bg-[#4b5563]"}`} />
          <Zap size={12} className={isActive ? "text-emerald" : "text-[#4b5563]"} />
          <span className={`text-xs font-bold tracking-widest uppercase ${isActive ? "text-emerald" : "text-[#4b5563]"}`}>
            {isActive
              ? poseReady ? "Live AI Tracking" : "Loading Pose Model…"
              : "AI Tracking Paused"}
          </span>
        </div>
      </div>

      {/* Ghost Mode indicator */}
      {ghostMode && (
        <div className="absolute top-4 right-4 z-30">
          <div className="flex items-center gap-2 bg-black/60 border border-cyan-400/30 backdrop-blur-sm rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold tracking-widest uppercase text-cyan-400">
              Ghost
            </span>
          </div>
        </div>
      )}

      {/* Feedback badge */}
      {!isIdle && feedback.type !== "idle" && (
        <div className="absolute top-4 left-4 z-30">
          <div className={`flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm border text-sm font-semibold ${
            feedback.type === "success"
              ? "bg-black/60 border-[#4ade80]/40 text-[#4ade80]"
              : "bg-black/60 border-[#fbbf24]/40 text-[#fbbf24]"
          }`}>
            {feedback.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {feedback.text}
          </div>
        </div>
      )}

      {/* Idle overlay */}
      {isIdle && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border-2 border-emerald/50 flex items-center justify-center mx-auto mb-3">
              <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[18px] border-l-[#10b981] ml-1" />
            </div>
            <p className="text-white/60 text-sm font-medium tracking-wide">
              Press Start to begin tracking
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
