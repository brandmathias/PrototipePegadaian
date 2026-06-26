import { Hand, Sparkles } from "lucide-react";

type WelcomeBrushBadgeProps = {
  text?: string;
  className?: string;
};

export default function WelcomeBrushBadge({
  text = "Selamat datang kembali,",
  className = "",
}: WelcomeBrushBadgeProps) {
  return (
    <div
      className={`group relative inline-flex items-center ${className}`}
      aria-label={text}
    >
      {/* Left icon circle */}
      <div className="relative z-20 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white shadow-[0_10px_24px_rgba(0,103,71,0.25)] ring-4 ring-white/80">
        <Hand
          size={20}
          strokeWidth={2.5}
          className="origin-bottom animate-wave-hand"
        />
      </div>

      {/* Brush container */}
      <div className="relative -ml-5 flex min-h-12 items-center px-9 py-2.5">
        {/* SVG brush stroke: scalable, selectable text remains real text */}
        <svg
          className="absolute inset-0 z-0 h-full w-full overflow-visible"
          viewBox="0 0 340 62"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="brushGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#006747" />
              <stop offset="52%" stopColor="#047857" />
              <stop offset="100%" stopColor="#065F46" />
            </linearGradient>

            <filter id="brushShadow" x="-10%" y="-30%" width="120%" height="180%">
              <feDropShadow
                dx="0"
                dy="7"
                stdDeviation="6"
                floodColor="#006747"
                floodOpacity="0.18"
              />
            </filter>
          </defs>

          <path
            className="origin-left animate-brush-reveal"
            filter="url(#brushShadow)"
            fill="url(#brushGradient)"
            d="M18 13 C52 6, 94 8, 134 10 C180 12, 236 4, 303 12 C326 15, 337 24, 329 35 C322 47, 291 50, 246 48 C196 46, 158 56, 101 50 C66 47, 31 53, 13 42 C-1 34, 2 19, 18 13 Z"
          />

          {/* Small rough edge details */}
          <path
            className="origin-left animate-brush-reveal"
            fill="#0B5F43"
            opacity="0.35"
            d="M25 43 C70 48, 111 39, 163 43 C214 47, 270 40, 318 43 C270 51, 211 54, 152 50 C98 46, 60 55, 25 43 Z"
          />
        </svg>

        {/* Text */}
        <span className="relative z-10 whitespace-nowrap font-handwritten text-[21px] font-semibold italic leading-none tracking-wide text-white drop-shadow-sm md:text-[24px]">
          {text}
        </span>

        {/* Amber underline accent */}
        <span className="absolute bottom-1 left-14 z-10 h-[3px] w-32 origin-left rounded-full bg-amber-400/95 shadow-[0_2px_8px_rgba(245,158,11,0.35)] transition-transform duration-500 group-hover:scale-x-110" />
      </div>

      {/* Decorative marks */}
      <Sparkles
        size={18}
        strokeWidth={2.4}
        className="absolute -right-5 -top-3 z-20 animate-soft-pop text-amber-400"
        aria-hidden="true"
      />
      <span
        className="absolute -right-8 top-5 z-20 h-2 w-2 animate-soft-pop rounded-full bg-emerald-400"
        aria-hidden="true"
      />
      <span
        className="absolute -left-2 -top-2 z-10 h-2 w-2 animate-soft-pop rounded-full bg-lime-300"
        aria-hidden="true"
      />
    </div>
  );
}
