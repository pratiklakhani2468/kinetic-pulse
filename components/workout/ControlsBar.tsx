import { RotateCcw, Play, Pause, Dumbbell, ArrowLeftRight, CheckCircle } from "lucide-react";
import type { SessionState } from "@/components/workout/types";

interface Props {
  session: SessionState;
  hasReps: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSimulateRep: () => void;
  onSwitchExercise: () => void;
  onFinish: () => void;
}

export default function ControlsBar({
  session,
  hasReps,
  onStart,
  onPause,
  onReset,
  onSimulateRep,
  onSwitchExercise,
  onFinish,
}: Props) {
  const isRunning = session === "running";
  const isIdle = session === "idle";

  return (
    <div className="bg-[#0f0f0d] border-t border-[#1e1e18] px-6 py-3">
      <div className="flex items-center justify-between max-w-3xl mx-auto">

        {/* Left: Reset */}
        <button
          onClick={onReset}
          disabled={isIdle}
          className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-[#9ca3af] hover:text-white"
        >
          <RotateCcw size={14} />
          Reset
        </button>

        {/* Center: Primary + Simulate Rep */}
        <div className="flex items-center gap-3">
          {/* Start / Pause */}
          <button
            onClick={isRunning ? onPause : onStart}
            className={`flex items-center gap-2.5 px-7 py-2.5 rounded-full font-bold text-sm tracking-widest uppercase transition-all ${
              isRunning
                ? "bg-white/10 hover:bg-white/15 text-white border border-white/20"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            {isRunning ? (
              <>
                <Pause size={14} fill="currentColor" strokeWidth={0} />
                Pause
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" strokeWidth={0} />
                {session === "paused" ? "Resume" : "Start Session"}
              </>
            )}
          </button>

          {/* Simulate Rep — only active when running */}
          <button
            onClick={onSimulateRep}
            disabled={!isRunning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm tracking-widest uppercase border transition-all disabled:opacity-30 disabled:cursor-not-allowed border-emerald/40 text-emerald hover:bg-emerald/10"
          >
            <Dumbbell size={14} />
            Simulate Rep
          </button>
        </div>

        {/* Right: Finish Workout or Switch */}
        {hasReps ? (
          <button
            onClick={onFinish}
            className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase transition-colors text-emerald hover:text-emerald/80"
          >
            <CheckCircle size={14} />
            Finish
          </button>
        ) : (
          <button
            onClick={onSwitchExercise}
            className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase transition-colors text-[#9ca3af] hover:text-white"
          >
            Switch
            <ArrowLeftRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
