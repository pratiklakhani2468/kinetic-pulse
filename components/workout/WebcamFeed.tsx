"use client";

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import Webcam from "react-webcam";
import { Zap, CheckCircle, AlertCircle, CameraOff } from "lucide-react";
import type { SessionState, Feedback } from "@/components/workout/types";

// ─── Public handle (for future AI integration) ───────────────────────────────

export interface WebcamFeedHandle {
  /** The <video> element — pass to MediaPipe/TensorFlow when integrating */
  videoElement: HTMLVideoElement | null;
  /** The canvas element — draw pose landmarks here */
  canvasElement: HTMLCanvasElement | null;
  /** 2D rendering context, ready to use */
  canvasCtx: CanvasRenderingContext2D | null;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  session: SessionState;
  feedback: Feedback;
}

// ─── Component ───────────────────────────────────────────────────────────────

const WebcamFeed = forwardRef<WebcamFeedHandle, Props>(function WebcamFeed(
  { session, feedback },
  ref
) {
  const webcamRef  = useRef<Webcam>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [camError, setCamError]   = useState(false);
  const [camReady, setCamReady]   = useState(false);

  const isActive = session === "running";
  const isIdle   = session === "idle";

  // Sync canvas size to its display size whenever the window resizes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      if (!canvas) return;
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Expose video + canvas refs to parent for future AI integration
  useImperativeHandle(ref, () => ({
    get videoElement() {
      return (webcamRef.current?.video ?? null) as HTMLVideoElement | null;
    },
    get canvasElement() {
      return canvasRef.current;
    },
    get canvasCtx() {
      return canvasRef.current?.getContext("2d") ?? null;
    },
  }));

  const handleUserMedia = useCallback(() => {
    setCamReady(true);
    setCamError(false);
  }, []);

  const handleError = useCallback(() => {
    setCamError(true);
    setCamReady(false);
  }, []);

  return (
    <div className="relative flex-1 rounded-2xl overflow-hidden bg-[#0e0e0c]">

      {/* ── Live webcam feed ──────────────────────────────────────── */}
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored
        videoConstraints={{ facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }}
        onUserMedia={handleUserMedia}
        onUserMediaError={handleError}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: camReady ? 1 : 0 }}
      />

      {/* ── Canvas overlay — pose landmarks go here ───────────────── */}
      {/*    z-10: above webcam, below UI badges                      */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
      />

      {/* ── Fallback: camera unavailable ──────────────────────────── */}
      {camError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0e0e0c] z-10">
          <CameraOff size={32} className="text-[#4b5563]" />
          <p className="text-[#4b5563] text-sm font-medium">Camera unavailable</p>
          <p className="text-[#3d3d3d] text-xs">Check browser permissions and reload</p>
        </div>
      )}

      {/* ── Loading state while camera initialises ────────────────── */}
      {!camReady && !camError && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 z-10">
          <span className="w-2 h-2 rounded-full bg-emerald/50 animate-pulse" />
          <span className="text-[#4b5563] text-xs tracking-widest uppercase">Initialising camera…</span>
        </div>
      )}

      {/* ── Dark gradient — makes UI badges readable ──────────────── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 z-20 pointer-events-none" />

      {/* ── LIVE AI TRACKING badge ────────────────────────────────── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className={`flex items-center gap-2 backdrop-blur-sm border rounded-full px-4 py-1.5 transition-colors ${
          isActive
            ? "bg-black/60 border-emerald/30"
            : "bg-black/40 border-white/10"
        }`}>
          <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald animate-pulse" : "bg-[#4b5563]"}`} />
          <Zap size={12} className={isActive ? "text-emerald" : "text-[#4b5563]"} />
          <span className={`text-xs font-bold tracking-widest uppercase ${isActive ? "text-emerald" : "text-[#4b5563]"}`}>
            {isActive ? "Live AI Tracking" : "AI Tracking Paused"}
          </span>
        </div>
      </div>

      {/* ── Feedback badge ────────────────────────────────────────── */}
      {!isIdle && feedback.type !== "idle" && (
        <div className="absolute top-4 left-4 z-30">
          <div className={`flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm border text-sm font-semibold ${
            feedback.type === "success"
              ? "bg-black/60 border-[#4ade80]/40 text-[#4ade80]"
              : "bg-black/60 border-[#fbbf24]/40 text-[#fbbf24]"
          }`}>
            {feedback.type === "success"
              ? <CheckCircle size={14} />
              : <AlertCircle size={14} />}
            {feedback.text}
          </div>
        </div>
      )}

      {/* ── Idle overlay ──────────────────────────────────────────── */}
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
});

export default WebcamFeed;
