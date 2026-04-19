import Link from "next/link";

export default function WorkoutNavbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-[#1e1e18] bg-[#0f0f0d]">
      <Link
        href="/dashboard"
        className="text-white font-black italic text-sm tracking-widest uppercase"
      >
        THE KINETIC ATELIER
      </Link>

      <div className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-widest text-[#9ca3af]">
        {["WORKOUTS", "COACHING", "INTELLIGENCE", "SHOP"].map((item) => (
          <button
            key={item}
            className="hover:text-white transition-colors"
          >
            {item}
          </button>
        ))}
      </div>

      <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs tracking-widest px-4 py-2 rounded-full transition-colors">
        JOIN NOW
      </button>
    </nav>
  );
}
