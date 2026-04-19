"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/components/ui/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-[0.12em] text-xs rounded-full transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        lime:   "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97]",
        ghost:  "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20",
        glass:  "bg-[#1a1a1a] border border-white/[0.08] text-white/60 hover:bg-[#222] hover:text-white hover:border-white/[0.14]",
      },
      size: {
        sm:  "h-7 px-3 text-[10px]",
        md:  "h-9 px-4",
        lg:  "h-11 px-6 text-sm",
      },
    },
    defaultVariants: { variant: "ghost", size: "md" },
  }
);

export interface LiquidGlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const LiquidGlassButton = forwardRef<HTMLButtonElement, LiquidGlassButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

LiquidGlassButton.displayName = "LiquidGlassButton";
export { LiquidGlassButton, buttonVariants };
