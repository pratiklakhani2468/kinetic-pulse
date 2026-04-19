"use client";

/**
 * Skeleton — hand-drawn pose figure.
 * Supports squat / standing variants, ghost rendering (translucent white),
 * and an optional glow SVG filter.
 *
 * Faithfully ported from the HTML design's Skeleton component.
 */

interface SkeletonProps {
  accent?: string;
  variant?: "squat" | "standing";
  ghost?: boolean;
  glow?: boolean;
  strokeW?: number;
}

type Point = [number, number];

interface Pose {
  head: Point; neck: Point;
  lSh: Point;  rSh: Point;
  lEl: Point;  rEl: Point;
  lWr: Point;  rWr: Point;
  hip: Point;
  lHip: Point; rHip: Point;
  lKn: Point;  rKn: Point;
  lAn: Point;  rAn: Point;
}

const POSES: Record<"squat" | "standing", Pose> = {
  squat: {
    head: [200, 88],  neck: [200, 132],
    lSh:  [162, 148], rSh:  [238, 148],
    lEl:  [132, 208], rEl:  [268, 208],
    lWr:  [122, 262], rWr:  [278, 262],
    hip:  [200, 250],
    lHip: [176, 250], rHip: [224, 250],
    lKn:  [152, 342], rKn:  [248, 342],
    lAn:  [148, 428], rAn:  [252, 428],
  },
  standing: {
    head: [200, 80],  neck: [200, 128],
    lSh:  [166, 144], rSh:  [234, 144],
    lEl:  [150, 208], rEl:  [250, 208],
    lWr:  [144, 270], rWr:  [256, 270],
    hip:  [200, 256],
    lHip: [180, 256], rHip: [220, 256],
    lKn:  [184, 350], rKn:  [216, 350],
    lAn:  [186, 440], rAn:  [214, 440],
  },
};

export default function Skeleton({
  accent = "#22C55E",
  variant = "squat",
  ghost = false,
  glow = true,
  strokeW = 2.5,
}: SkeletonProps) {
  const p = POSES[variant];
  const filterId = `gl-${variant}-${ghost ? "g" : "l"}`;

  const bones: [Point, Point][] = [
    [p.neck, p.head],
    [p.lSh,  p.rSh],
    [p.neck, p.hip],
    [p.lSh,  p.lEl], [p.lEl, p.lWr],
    [p.rSh,  p.rEl], [p.rEl, p.rWr],
    [p.lHip, p.rHip],
    [p.lHip, p.lKn], [p.lKn, p.lAn],
    [p.rHip, p.rKn], [p.rKn, p.rAn],
  ];

  const joints: Point[] = Object.values(p) as Point[];
  const color = ghost ? "#ffffff" : accent;
  const op    = ghost ? 0.25 : 1;

  return (
    <svg viewBox="0 0 400 500" className="w-full h-full" aria-hidden>
      <defs>
        {glow && !ghost && (
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <g opacity={op} filter={glow && !ghost ? `url(#${filterId})` : undefined}>
        {bones.map(([a, b], i) => (
          <line
            key={i}
            x1={a[0]} y1={a[1]}
            x2={b[0]} y2={b[1]}
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        ))}
        {joints.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4.5" fill={color} />
        ))}
      </g>
    </svg>
  );
}
