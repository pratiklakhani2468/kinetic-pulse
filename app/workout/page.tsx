import { Suspense } from "react";
import WorkoutPageClient from "@/components/workout/WorkoutPageClient";

export default function WorkoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-[#0f0f0d] items-center justify-center">
          <span className="text-[#6b7280] text-sm tracking-widest uppercase">
            Loading…
          </span>
        </div>
      }
    >
      <WorkoutPageClient />
    </Suspense>
  );
}
