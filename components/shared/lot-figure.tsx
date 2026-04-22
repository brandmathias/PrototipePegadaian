import { Gem, Laptop, Car, Coins, Package } from "lucide-react";

import { cn } from "@/lib/utils";

type LotFigureProps = {
  category: string;
  className?: string;
};

const categoryMap = {
  Perhiasan: {
    icon: Gem,
    tone: "from-[#0a5d2d] via-[#0d6b35] to-[#735c00]"
  },
  Elektronik: {
    icon: Laptop,
    tone: "from-[#143b2a] via-[#006432] to-[#224f6d]"
  },
  Kendaraan: {
    icon: Car,
    tone: "from-[#1f3326] via-[#004a23] to-[#4e5d1d]"
  },
  "Logam Mulia": {
    icon: Coins,
    tone: "from-[#735c00] via-[#9c7a00] to-[#004a23]"
  },
  Lainnya: {
    icon: Package,
    tone: "from-[#244236] via-[#355f4f] to-[#735c00]"
  }
} as const;

export function LotFigure({ category, className }: LotFigureProps) {
  const config = categoryMap[category as keyof typeof categoryMap] ?? categoryMap.Lainnya;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br p-6 text-white",
        config.tone,
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,214,91,0.24),transparent_30%)]" />
      <div className="relative flex h-full min-h-40 flex-col justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">
          {category}
        </span>
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="h-2 w-20 rounded-full bg-white/20" />
            <div className="h-2 w-28 rounded-full bg-white/15" />
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <Icon className="size-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
