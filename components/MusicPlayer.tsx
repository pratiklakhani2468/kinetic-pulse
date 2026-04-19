"use client";

import { useState } from "react";
import { SkipBack, Play, Pause, SkipForward, Music } from "lucide-react";

export default function MusicPlayer() {
  const [playing, setPlaying] = useState(true);

  return (
    <div
      className="rounded-2xl p-3 flex items-center gap-3"
      style={{
        background:    "rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
        border:        "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Album art */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #9b6dfa 0%, #4a8cff 100%)",
          boxShadow:  "0 0 12px rgba(155,109,250,0.3)",
        }}
      >
        <Music size={14} className="text-white" />
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p className="text-white/25 text-[9px] font-bold tracking-[0.25em] uppercase">
          Now Playing
        </p>
        <p className="text-white/80 text-[12px] font-semibold truncate mt-0.5">
          Kinetic Beats Vol. 4
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button className="text-white/25 hover:text-white/70 transition-colors">
          <SkipBack size={13} />
        </button>
        <button
          onClick={() => setPlaying(!playing)}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background: "#10b981",
            boxShadow:  "0 0 12px rgba(16,185,129,0.3)",
          }}
        >
          {playing ? (
            <Pause size={11} className="text-black" fill="black" strokeWidth={0} />
          ) : (
            <Play size={11} className="text-black" fill="black" strokeWidth={0} />
          )}
        </button>
        <button className="text-white/25 hover:text-white/70 transition-colors">
          <SkipForward size={13} />
        </button>
      </div>
    </div>
  );
}
