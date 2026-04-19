import { Activity, Gauge, ArrowUp, ArrowDown } from "lucide-react";
import type { SessionState, Stage } from "@/components/workout/types";

interface Props {
  exercise: string;
  reps: number;
  targetReps: number;
  formAccuracy: number;
  stage: Stage;
  session: SessionState;
}

export default function StatsPanel({
  exercise,
  reps,
  targetReps,
  formAccuracy,
  stage,
  session,
}: Props) {
  const setProgress = Math.round((reps / targetReps) * 100);
  const paceLabel =
    formAccuracy >= 92 ? "Elite" : formAccuracy >= 82 ? "Strong" : "Building";
  const isRunning = session === "running";

  return (
    <div className="w-72 xl:w-80 flex flex-col gap-3">
      {/* Exercise name */}
      <div className="bg-[#1a1a12] border border-[#2a2a1a] rounded-2xl px-5 py-4">
        <p className="text-[#6b7280] text-[10px] tracking-widest uppercase mb-1">
          Current Exercise
        </p>
        <h2 className="text-emerald font-black italic text-xl uppercase tracking-tight leading-tight">
          {exercise}
        </h2>
      </div>

      {/* Rep counter — dominant element */}
      <div className="bg-[#1a1a12] border border-[#2a2a1a] rounded-2xl px-5 py-5 flex-1 flex flex-col">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <p className="text-[#6b7280] text-[10px] tracking-widest uppercase mb-2">
              Reps Completed
            </p>
            <span
              className="text-white font-black leading-none select-none tabular-nums"
              style={{ fontSize: "clamp(96px, 10vw, 148px)" }}
            >
              {reps}
            </span>
            <p className="text-[#3d3d30] text-sm font-semibold mt-1">
              / {targetReps} target
            </p>
          </div>
        </div>

        {/* Movement Stage indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border font-bold text-xs tracking-widest uppercase transition-all ${
            stage === "UP"
              ? "bg-[#4a8cff]/15 border-[#4a8cff]/40 text-[#4a8cff]"
              : "bg-[#1a1a12] border-[#2a2a1a] text-[#3d3d30]"
          }`}>
            <ArrowUp size={12} />
            UP
          </div>
          <div className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border font-bold text-xs tracking-widest uppercase transition-all ${
            stage === "DOWN"
              ? "bg-[#ff7043]/15 border-[#ff7043]/40 text-[#ff7043]"
              : "bg-[#1a1a12] border-[#2a2a1a] text-[#3d3d30]"
          }`}>
            <ArrowDown size={12} />
            DOWN
          </div>
        </div>

        {/* Set progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6b7280] tracking-widest uppercase font-medium">
              Set Progress
            </span>
            <span className="text-white font-bold">{setProgress}%</span>
          </div>
          <div className="h-1.5 bg-[#252518] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${setProgress}%`,
                background: "linear-gradient(90deg, #4a8cff 0%, #4ade80 60%, #10b981 100%)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Form Accuracy */}
      <div className="bg-[#1a1a12] border border-[#2a2a1a] rounded-2xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[#6b7280] text-[10px] tracking-widest uppercase mb-1">
            Form Accuracy
          </p>
          <p className="text-white font-black text-3xl leading-none">
            {isRunning ? formAccuracy : "—"}
            {isRunning && (
              <span className="text-lg font-bold text-[#9ca3af]">%</span>
            )}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          formAccuracy >= 90 ? "bg-emerald/15" : "bg-[#ff7043]/15"
        }`}>
          <Activity size={18} className={formAccuracy >= 90 ? "text-emerald" : "text-[#ff7043]"} />
        </div>
      </div>

      {/* Pace Stability */}
      <div className="bg-[#1a1a12] border border-[#2a2a1a] rounded-2xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[#6b7280] text-[10px] tracking-widest uppercase mb-1">
            Pace Stability
          </p>
          <p className={`font-black text-2xl leading-none ${
            !isRunning
              ? "text-[#3d3d30]"
              : paceLabel === "Elite"
              ? "text-[#4a8cff]"
              : paceLabel === "Strong"
              ? "text-emerald"
              : "text-[#ff7043]"
          }`}>
            {isRunning ? paceLabel : "—"}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#4a8cff]/15 flex items-center justify-center">
          <Gauge size={18} className="text-[#4a8cff]" />
        </div>
      </div>
    </div>
  );
}
