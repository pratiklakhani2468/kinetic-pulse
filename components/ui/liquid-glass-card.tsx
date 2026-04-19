"use client";

import { forwardRef } from "react";
import { cn } from "@/components/ui/utils";

export interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accent color for the top edge glow — any CSS color */
  accentColor?: string;
  /** Whether the card should have a hover lift effect */
  hoverable?: boolean;
}

const LiquidGlassCard = forwardRef<HTMLDivElement, LiquidGlassCardProps>(
  ({ className, accentColor = "#10b981", hoverable = true, style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-2xl overflow-hidden",
          "bg-[#0e0e0e] border border-white/[0.06]",
          "backdrop-blur-sm",
          hoverable && "transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.10] hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)]",
          className
        )}
        style={style}
        {...props}
      >
        {/* Top-edge accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent 0%, ${accentColor}60 40%, ${accentColor}60 60%, transparent 100%)` }}
        />
        {/* Subtle inner glow at top */}
        <div
          className="absolute top-0 left-0 right-0 h-20 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${accentColor}08 0%, transparent 70%)` }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

LiquidGlassCard.displayName = "LiquidGlassCard";
export { LiquidGlassCard };
