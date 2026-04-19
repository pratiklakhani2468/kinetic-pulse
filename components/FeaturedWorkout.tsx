import { Play, Clock, Flame, ChevronRight } from "lucide-react";

export default function FeaturedWorkout() {
  return (
    <div className="relative rounded-2xl overflow-hidden h-64"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80')`,
        }}
      />

      {/* Layered dark overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />

      {/* Top row */}
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
        <span
          className="text-black text-[10px] font-black px-3 py-1 rounded-full tracking-[0.18em] uppercase"
          style={{ background: "#10b981" }}
        >
          Elite Strength
        </span>
        <span className="text-white/35 text-[11px] font-medium">
          Recommended for your cycle
        </span>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h2 className="text-white text-[22px] font-black tracking-tight uppercase leading-tight mb-1.5">
          Neural Drive: Squat Protocol
        </h2>
        <p className="text-white/45 text-[13px] mb-4 max-w-lg leading-relaxed">
          A specialized protocol designed by Dr. Aris to maximize CNS recruitment
          while maintaining recovery elasticity.
        </p>

        <div className="flex items-center gap-3">
          {/* Primary CTA */}
          <button
            className="flex items-center gap-2 text-black font-bold text-[13px] px-5 py-2.5 rounded-xl transition-all duration-200"
            style={{
              background:  "#10b981",
              boxShadow:   "0 0 20px rgba(16,185,129,0.25)",
            }}
          >
            <Play size={12} fill="black" strokeWidth={0} />
            Start Workout
          </button>

          {/* Secondary CTA */}
          <button className="flex items-center gap-1.5 text-white/45 hover:text-white/80 text-[12px] font-medium transition-colors">
            View Details <ChevronRight size={12} />
          </button>

          {/* Meta */}
          <div className="ml-auto flex items-center gap-4 text-[12px]">
            <span className="flex items-center gap-1.5 text-white/40">
              <Clock size={12} style={{ color: "#4a8cff" }} />
              52 mins
            </span>
            <span className="flex items-center gap-1.5 text-white/40">
              <Flame size={12} style={{ color: "#ff7043" }} />
              ~480 kcal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
