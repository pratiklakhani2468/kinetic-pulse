"use client";

import { useRef, useState, useCallback, CSSProperties } from "react";
import Visual3, { Visual3Variant } from "./Visual3";

export interface AnimatedCardProps {
  variant: Visual3Variant;
  color: string;
  index: number;
  title: string;
  description: string;
  label: string; // e.g. "01"
}

export default function AnimatedCard({
  variant,
  color,
  index,
  title,
  description,
  label,
}: AnimatedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt]       = useState({ x: 0, y: 0 });
  const [shine, setShine]     = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = (e.clientX - rect.left) / rect.width;   // 0–1
    const ny = (e.clientY - rect.top)  / rect.height;  // 0–1
    setTilt({
      x:  (ny - 0.5) * 10,   // rotateX: mouse above centre tilts top towards viewer
      y: -(nx - 0.5) * 10,   // rotateY: mouse right → rotate right side away
    });
    setShine({ x: nx * 100, y: ny * 100 });
  }, []);

  const onMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  }, []);

  const onMouseEnter = useCallback(() => setHovered(true), []);

  const cardStyle: CSSProperties = {
    transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${hovered ? -6 : 0}px)`,
    transition: hovered
      ? "transform 0.12s ease, box-shadow 0.3s ease, border-color 0.3s ease"
      : "transform 0.65s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease, border-color 0.4s ease",
    boxShadow: hovered
      ? `0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px ${color}22, 0 0 40px ${color}10`
      : "0 4px 24px rgba(0,0,0,0.4)",
    borderColor: hovered ? `${color}30` : "rgba(255,255,255,0.06)",
    // Reveal animation stagger
    animation: `lp-fade-up 0.8s cubic-bezier(0.16,1,0.3,1) ${index * 100}ms both`,
  };

  const shineStyle: CSSProperties = {
    background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.04) 0%, transparent 55%)`,
    opacity: hovered ? 1 : 0,
    transition: "opacity 0.3s ease",
  };

  const accentLineStyle: CSSProperties = {
    background: `linear-gradient(90deg, ${color}, transparent)`,
    width: hovered ? "48px" : "24px",
    transition: "width 0.4s cubic-bezier(0.16,1,0.3,1)",
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="relative rounded-2xl border bg-[#090909] overflow-hidden cursor-default"
      style={cardStyle}
    >
      {/* Mouse-tracking specular shimmer */}
      <div className="absolute inset-0 pointer-events-none z-10 rounded-2xl" style={shineStyle} />

      {/* Top edge accent line that glows on hover */}
      <div className="absolute top-0 left-6 h-px z-10" style={accentLineStyle} />

      {/* Visual area */}
      <div className="relative w-full" style={{ height: 160 }}>
        {/* Subtle coloured glow behind visual */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 80%, ${color}0a 0%, transparent 65%)`,
            transition: "opacity 0.4s ease",
            opacity: hovered ? 1 : 0.5,
          }}
        />
        <Visual3 variant={variant} color={color} hovered={hovered} />
      </div>

      {/* Divider */}
      <div className="mx-6 h-px" style={{ background: `linear-gradient(90deg, ${color}18, transparent)` }} />

      {/* Content */}
      <div className="px-6 pt-5 pb-7">
        {/* Number label */}
        <span
          className="block text-[10px] font-bold tracking-[0.35em] uppercase mb-3"
          style={{ color: `${color}60` }}
        >
          {label}
        </span>

        {/* Title */}
        <h3
          className="text-white font-black uppercase leading-[0.95] tracking-tight mb-3"
          style={{ fontSize: "clamp(1.25rem, 2.2vw, 1.6rem)" }}
        >
          {title}
        </h3>

        {/* Description */}
        <p className="text-[#3a3a3a] text-[13px] leading-relaxed mb-5">
          {description}
        </p>

        {/* Bottom link */}
        <div className="flex items-center gap-2">
          <div className="h-px flex-shrink-0" style={accentLineStyle} />
          <span
            className="text-[10px] font-bold tracking-[0.28em] uppercase transition-colors duration-300"
            style={{ color: hovered ? `${color}90` : "#2a2a2a" }}
          >
            Explore
          </span>
        </div>
      </div>
    </div>
  );
}
