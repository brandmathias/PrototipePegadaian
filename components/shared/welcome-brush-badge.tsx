import { Hand } from "lucide-react";

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
      className={`group relative inline-flex items-center w-fit self-start ${className}`}
      aria-label={text}
    >
      {/* Left icon circle with gradient and white outline ring */}
      <div className="relative z-20 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-emerald-500 to-emerald-700 text-white shadow-[0_6px_16px_rgba(0,103,71,0.22)] ring-[3.5px] ring-white/95">
        <div className="relative origin-bottom animate-wave-hand">
          <Hand
            size={18}
            strokeWidth={2.4}
          />
          {/* wave lines next to the hand to symbolize waving/welcome */}
          <svg
            className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 text-emerald-200 opacity-80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
          >
            <path d="M4 6c1 1.5 1 3.5 0 5" />
            <path d="M8 8c.8 1 .8 2 0 3" />
          </svg>
        </div>
      </div>

      {/* Brush container */}
      <div className="relative -ml-5 flex min-h-[44px] items-center px-10 py-2 sm:py-2.5">
        {/* SVG brush stroke with high-fidelity displacement texture filter */}
        <svg
          className="absolute inset-0 z-0 h-full w-full overflow-visible"
          viewBox="0 0 340 62"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="brushGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#006747" />
              <stop offset="48%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064E3B" />
            </linearGradient>

            {/* Displacement filter to create rough, textured paint brush edges */}
            <filter id="brushTexture" x="-10%" y="-20%" width="120%" height="140%">
              {/* Generate fractal noise texture */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.05"
                numOctaves="4"
                result="noise"
              />
              {/* Displace the clean vector edge using the noise */}
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="7"
                xChannelSelector="R"
                yChannelSelector="G"
                result="displaced"
              />
              {/* Apply premium drop shadow mapping the displaced brush shape */}
              <feDropShadow
                dx="0"
                dy="6"
                stdDeviation="5"
                floodColor="#004d34"
                floodOpacity="0.16"
              />
            </filter>
          </defs>

          {/* Main brush body path */}
          <path
            className="origin-left animate-brush-reveal"
            filter="url(#brushTexture)"
            fill="url(#brushGradient)"
            d="M18 13 C52 6, 94 8, 134 10 C180 12, 236 4, 303 12 C326 15, 337 24, 329 35 C322 47, 291 50, 246 48 C196 46, 158 56, 101 50 C66 47, 31 53, 13 42 C-1 34, 2 19, 18 13 Z"
          />

          {/* Secondary background stroke layer for painterly depth */}
          <path
            className="origin-left animate-brush-reveal"
            filter="url(#brushTexture)"
            fill="#064E3B"
            opacity="0.25"
            d="M25 43 C70 48, 111 39, 163 43 C214 47, 270 40, 318 43 C270 51, 211 54, 152 50 C98 46, 60 55, 25 43 Z"
          />
        </svg>

        {/* Text using the Kalam Google Font */}
        <span className="relative z-10 whitespace-nowrap font-handwritten text-[22px] font-medium leading-none tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)] md:text-[25px]">
          {text}
        </span>

        {/* Springy animated amber underline accent under the text inside the brush */}
        <div className="absolute bottom-1.5 left-14 z-10 origin-left animate-brush-reveal">
          <span className="block h-[3px] w-32 origin-left rounded-full bg-amber-400 shadow-[0_2px_8px_rgba(245,158,11,0.35)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-x-115 group-hover:bg-amber-300 group-hover:shadow-[0_2px_12px_rgba(251,191,36,0.6)]" />
        </div>

        {/* Hand-drawn 3-stroke sparkle/burst icon sitting exactly on the outer top-right boundary line of the green brush */}
        {/* Outer wrapper manages the load pop-in, inner SVG manages infinite rotation/twinkle */}
        <div className="absolute right-[18px] -top-2.5 z-20 animate-soft-pop">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="animate-sparkle-twinkle text-amber-400 overflow-visible"
          >
            <path
              d="M8 18 L2 10"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M9 17 L17 6"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M10 19 L20 16"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
