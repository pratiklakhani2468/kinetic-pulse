"use client";

// ─── Abstract AI visuals for each feature card ────────────────────────────────
// Three distinct SVG compositions — no human figures, pure geometry.

export type Visual3Variant = 1 | 2 | 3;

interface Props {
  variant: Visual3Variant;
  color: string;
  hovered?: boolean;
}

// ─── Keyframes injected once ──────────────────────────────────────────────────
const STYLES = `
  @keyframes v3-orbit {
    from { transform: rotate(0deg);   }
    to   { transform: rotate(360deg); }
  }
  @keyframes v3-orbit-ccw {
    from { transform: rotate(0deg);    }
    to   { transform: rotate(-360deg); }
  }
  @keyframes v3-ecg {
    0%   { stroke-dashoffset: 520; opacity: 0; }
    8%   { opacity: 1; }
    88%  { opacity: 1; }
    100% { stroke-dashoffset: 0; opacity: 0; }
  }
  @keyframes v3-dot-chase {
    0%   { offset-distance: 0%;    opacity: 0; }
    5%   { opacity: 1; }
    90%  { opacity: 1; }
    100% { offset-distance: 100%; opacity: 0; }
  }
  @keyframes v3-bar-1 { 0%,100%{height:36px} 50%{height:44px} }
  @keyframes v3-bar-2 { 0%,100%{height:52px} 50%{height:60px} }
  @keyframes v3-bar-3 { 0%,100%{height:68px} 50%{height:76px} }
  @keyframes v3-bar-4 { 0%,100%{height:80px} 50%{height:88px} }
  @keyframes v3-bar-5 { 0%,100%{height:56px} 50%{height:64px} }
  @keyframes v3-trend {
    from { stroke-dashoffset: 180; }
    to   { stroke-dashoffset: 0;   }
  }
  @keyframes v3-ring-expand {
    0%   { r: 12; opacity: 0.6; }
    100% { r: 46; opacity: 0;   }
  }
  @keyframes v3-pulse-dot {
    0%,100% { opacity: 1;   transform: scale(1);   }
    50%      { opacity: 0.4; transform: scale(1.5); }
  }
  @keyframes v3-dash-spin {
    to { stroke-dashoffset: -60; }
  }
`;

// ─── Variant 1: Target / Form Analysis ───────────────────────────────────────
// Crosshair + concentric rings + orbiting dot. Implies precision scanning.

function Variant1({ color, hovered }: { color: string; hovered?: boolean }) {
  const c = 100; const cy = 68;
  const dur = hovered ? "2s" : "4s";

  return (
    <svg viewBox="0 0 200 136" className="w-full h-full" fill="none">
      {/* Subtle grid */}
      {[32, 66, 100, 134, 168].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="136" stroke={`${color}08`} strokeWidth="0.5" />
      ))}
      {[22, 46, 68, 90, 114].map(y => (
        <line key={y} x1="0" y1={y} x2="200" y2={y} stroke={`${color}08`} strokeWidth="0.5" />
      ))}

      {/* Crosshair lines */}
      <line x1={c} y1="8"  x2={c} y2="50"  stroke={`${color}30`} strokeWidth="0.75" />
      <line x1={c} y1="86" x2={c} y2="128" stroke={`${color}30`} strokeWidth="0.75" />
      <line x1="28" y1={cy} x2="66"  y2={cy} stroke={`${color}30`} strokeWidth="0.75" />
      <line x1="134" y1={cy} x2="172" y2={cy} stroke={`${color}30`} strokeWidth="0.75" />

      {/* Pulsing rings */}
      {[28, 20, 12].map((r, i) => (
        <circle key={r} cx={c} cy={cy} r={r}
          stroke={`${color}${i === 0 ? "40" : i === 1 ? "28" : "16"}`}
          strokeWidth={i === 0 ? "1" : "0.75"} />
      ))}

      {/* Radar expand ring */}
      <circle cx={c} cy={cy} r="12" stroke={`${color}60`} strokeWidth="1" fill="none"
        style={{ animation: `v3-ring-expand 2.5s ${hovered ? "0.6s" : "1.5s"} ease-out infinite` }} />

      {/* Rotating dashed arc — outer */}
      <g style={{
        transformOrigin: `${c}px ${cy}px`,
        transformBox: "fill-box",
        animation: `v3-orbit ${dur} linear infinite`,
      }}>
        <circle cx={c} cy={cy} r="46"
          stroke={`${color}35`} strokeWidth="0.75"
          strokeDasharray="14 22" strokeLinecap="round" />
      </g>

      {/* Rotating dashed arc — inner, counter */}
      <g style={{
        transformOrigin: `${c}px ${cy}px`,
        transformBox: "fill-box",
        animation: `v3-orbit-ccw ${hovered ? "3s" : "6s"} linear infinite`,
      }}>
        <circle cx={c} cy={cy} r="36"
          stroke={`${color}25`} strokeWidth="0.75"
          strokeDasharray="8 18" strokeLinecap="round" />
      </g>

      {/* Orbiting bright dot on outer ring */}
      <g style={{
        transformOrigin: `${c}px ${cy}px`,
        transformBox: "fill-box",
        animation: `v3-orbit ${dur} linear infinite`,
      }}>
        <circle cx={c} cy={cy - 46} r="2.5"
          fill={color}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      </g>

      {/* Centre dot */}
      <circle cx={c} cy={cy} r="4" fill={color}
        style={{
          filter: `drop-shadow(0 0 6px ${color})`,
          animation: "v3-pulse-dot 2.4s ease-in-out infinite",
          transformOrigin: `${c}px ${cy}px`,
          transformBox: "fill-box",
        }} />
    </svg>
  );
}

// ─── Variant 2: ECG / Real-Time Tracking ─────────────────────────────────────
// A looping ECG waveform with a chasing dot. Implies live monitoring.

function Variant2({ color, hovered }: { color: string; hovered?: boolean }) {
  // ECG path: flat → spike up → spike down → flat
  const path = "M 0,68 L 30,68 L 45,68 L 52,20 L 60,100 L 68,40 L 76,68 L 200,68";
  const spd = hovered ? "1.6s" : "2.8s";

  return (
    <svg viewBox="0 0 200 136" className="w-full h-full" fill="none">
      {/* Grid lines — horizontal */}
      {[28, 52, 68, 84, 108].map(y => (
        <line key={y} x1="0" y1={y} x2="200" y2={y}
          stroke={`${color}06`} strokeWidth="0.5" />
      ))}

      {/* Horizontal baseline */}
      <line x1="0" y1="68" x2="200" y2="68" stroke={`${color}12`} strokeWidth="0.75" />

      {/* Ghost / faded previous trace */}
      <path d={path} stroke={`${color}12`} strokeWidth="1.5" strokeLinecap="round"
        strokeLinejoin="round" />

      {/* Animated ECG trace */}
      <path d={path}
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="520"
        style={{
          animation: `v3-ecg ${spd} linear infinite`,
          filter: `drop-shadow(0 0 3px ${color}80)`,
        }} />

      {/* Small sample dots on baseline */}
      {[16, 48, 92, 130, 165].map((x, i) => (
        <circle key={x} cx={x} cy="68" r="1.5"
          fill={`${color}40`}
          style={{ animation: `v3-pulse-dot 2s ${i * 0.3}s ease-in-out infinite` }} />
      ))}

      {/* "LIVE" indicator */}
      <circle cx="176" cy="20" r="4" fill={color}
        style={{ animation: `v3-pulse-dot 1.2s ease-in-out infinite`,
          filter: `drop-shadow(0 0 5px ${color})`,
          transformOrigin: "176px 20px", transformBox: "fill-box",
        }} />
    </svg>
  );
}

// ─── Variant 3: Bar chart / Performance Insights ──────────────────────────────
// Ascending bars with an animated trend line. Implies growth & data.

function Variant3({ color, hovered }: { color: string; hovered?: boolean }) {
  const bars = [
    { x: 28,  pct: 0.44, anim: "v3-bar-1" },
    { x: 64,  pct: 0.63, anim: "v3-bar-2" },
    { x: 100, pct: 0.82, anim: "v3-bar-3" },
    { x: 136, pct: 0.95, anim: "v3-bar-4" },
    { x: 172, pct: 0.68, anim: "v3-bar-5" },
  ];
  const base = 108; // bottom y of bars
  const maxH = 88;

  // Trend line connecting top-centres of bars
  const pts = bars.map(b => `${b.x},${base - b.pct * maxH}`).join(" L ");

  return (
    <svg viewBox="0 0 200 136" className="w-full h-full" fill="none">
      {/* Horizontal guide lines */}
      {[28, 52, 76, 100].map(y => (
        <line key={y} x1="16" y1={y} x2="184" y2={y}
          stroke={`${color}07`} strokeWidth="0.5" strokeDasharray="3 5" />
      ))}

      {/* Bottom axis */}
      <line x1="16" y1={base} x2="184" y2={base}
        stroke={`${color}18`} strokeWidth="0.75" />

      {/* Bars — filled rect with rounded top */}
      {bars.map(({ x, pct }) => {
        const h = pct * maxH;
        const y = base - h;
        return (
          <g key={x}>
            {/* Background bar track */}
            <rect x={x - 10} y={base - maxH} width="20" height={maxH}
              fill={`${color}06`} rx="3" />
            {/* Filled bar */}
            <rect x={x - 10} y={y} width="20" height={h}
              fill={`${color}22`} rx="3" />
            {/* Top cap highlight */}
            <rect x={x - 10} y={y} width="20" height="3"
              fill={color} rx="1.5"
              style={{ filter: `drop-shadow(0 0 4px ${color}80)` }} />
          </g>
        );
      })}

      {/* Trend line */}
      <polyline points={pts}
        stroke={`${color}50`} strokeWidth="1.5" strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="180"
        style={{
          animation: `v3-trend ${hovered ? "1.2s" : "2s"} ease-out forwards`,
        }} />

      {/* Top dot on each bar */}
      {bars.map(({ x, pct }) => (
        <circle key={x} cx={x} cy={base - pct * maxH} r="2.5"
          fill={color}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      ))}
    </svg>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function Visual3({ variant, color, hovered }: Props) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="w-full h-full">
        {variant === 1 && <Variant1 color={color} hovered={hovered} />}
        {variant === 2 && <Variant2 color={color} hovered={hovered} />}
        {variant === 3 && <Variant3 color={color} hovered={hovered} />}
      </div>
    </>
  );
}
