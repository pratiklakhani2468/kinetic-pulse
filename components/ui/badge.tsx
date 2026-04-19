"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/components/ui/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.15em] uppercase",
  {
    variants: {
      variant: {
        lime:   "bg-emerald/10 text-emerald border border-emerald/20",
        blue:   "bg-[#4a8cff]/10 text-[#4a8cff] border border-[#4a8cff]/20",
        orange: "bg-[#ff7043]/10 text-[#ff7043] border border-[#ff7043]/20",
        purple: "bg-[#9b6dfa]/10 text-[#9b6dfa] border border-[#9b6dfa]/20",
        ghost:  "bg-white/5 text-white/40 border border-white/10",
      },
    },
    defaultVariants: { variant: "ghost" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
