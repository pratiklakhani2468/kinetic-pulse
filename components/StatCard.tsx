import { Zap, Target, Flame, Dumbbell } from "lucide-react";

type IconType = "zap" | "target" | "flame" | "dumbbell";
type ColorType = "purple" | "blue" | "orange" | "lime";

interface StatCardProps {
  icon: IconType;
  label: string;
  badge: string;
  badgeColor: ColorType;
  value: string;
  unit: string;
  progress: number;
  progressColor: ColorType;
  isLoading?: boolean;
}

const icons = {
  zap: Zap,
  target: Target,
  flame: Flame,
  dumbbell: Dumbbell,
};

const colorMap: Record<
  ColorType,
  { badge: string; icon: string; progress: string; bar: string }
> = {
  purple: {
    badge: "text-[#9b6dfa] bg-[#9b6dfa]/10",
    icon: "text-[#9b6dfa]",
    progress: "text-[#9ca3af]",
    bar: "bg-[#9b6dfa]",
  },
  blue: {
    badge: "text-[#4a8cff] bg-[#4a8cff]/10",
    icon: "text-[#4a8cff]",
    progress: "text-[#9ca3af]",
    bar: "bg-[#4a8cff]",
  },
  orange: {
    badge: "text-[#ff7043] bg-[#ff7043]/10",
    icon: "text-[#ff7043]",
    progress: "text-[#9ca3af]",
    bar: "bg-[#ff7043]",
  },
  lime: {
    badge: "text-emerald bg-emerald/10",
    icon: "text-emerald",
    progress: "text-[#9ca3af]",
    bar: "bg-emerald",
  },
};

export default function StatCard({
  icon,
  label,
  badge,
  badgeColor,
  value,
  unit,
  progress,
  progressColor,
  isLoading = false,
}: StatCardProps) {
  const Icon = icons[icon];
  const colors = colorMap[badgeColor];
  const barColors = colorMap[progressColor];

  return (
    <div className="bg-[#141414] border border-[#222] rounded-2xl p-4 flex flex-col gap-3 hover:border-[#2a2a2a] transition-colors">
      {/* Top row: icon + badge */}
      <div className="flex items-center justify-between">
        <div className={`p-1.5 rounded-lg bg-[#1c1c1c]`}>
          <Icon size={14} className={colors.icon} strokeWidth={2} />
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-1 rounded-full ${colors.badge}`}
        >
          {badge}
        </span>
      </div>

      {/* Label */}
      <p className="text-[#6b7280] text-xs font-medium tracking-wide uppercase">
        {label}
      </p>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        {isLoading ? (
          <span className="inline-block w-16 h-9 bg-[#222] rounded-lg animate-pulse" />
        ) : (
          <>
            <span className="text-4xl font-bold text-white leading-none">{value}</span>
            <span className="text-[#6b7280] text-sm font-medium">{unit}</span>
          </>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColors.bar}`}
            style={{ width: isLoading ? "0%" : `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
