"use client";

import { useRouter } from "next/navigation";
import type { Exercise } from "@/lib/exercises";

export default function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/workout?exercise=${encodeURIComponent(exercise.id)}`)}
      className="group text-left bg-[#141414] border border-[#222] rounded-2xl overflow-hidden hover:border-emerald/40 transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-300 scale-100 group-hover:scale-105"
          style={{ backgroundImage: `url('${exercise.image}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <p
          className="text-[10px] font-bold tracking-[0.2em] uppercase"
          style={{ color: exercise.muscleColor }}
        >
          {exercise.muscle}
        </p>
        <h3 className="text-white font-black text-xl leading-tight">
          {exercise.name}
        </h3>
        <p className="text-[#6b7280] text-xs leading-relaxed">
          {exercise.description}
        </p>

        {/* Intensity */}
        <div className="flex items-center justify-between pt-2 border-t border-[#222]">
          <span className="text-[#4b5563] text-[10px] tracking-[0.15em] uppercase font-medium">
            Intensity
          </span>
          <span className="text-white text-[10px] font-bold tracking-widest">
            Level {String(exercise.level).padStart(2, "0")}
          </span>
        </div>
      </div>
    </button>
  );
}
