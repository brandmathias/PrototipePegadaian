import type { CSSProperties } from "react";

import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

export { BRAND_NAME, BRAND_SHORT_NAME, BRAND_TAGLINE } from "@/lib/brand";

type BrandTone = "default" | "inverse" | "gold";

type BrandMarkProps = {
  className?: string;
  title?: string;
  tone?: BrandTone;
};

const toneColors: Record<BrandTone, { green: string; gold: string; dark: string; light: string }> = {
  default: {
    dark: "#06402b",
    gold: "#d49a21",
    green: "#006747",
    light: "#fff9ea"
  },
  gold: {
    dark: "#06402b",
    gold: "#e2ad36",
    green: "#005b3f",
    light: "#fff6df"
  },
  inverse: {
    dark: "#d7ffe9",
    gold: "#e8b64d",
    green: "#ffffff",
    light: "#073c2a"
  }
};

export function BrandMark({ className, title = BRAND_NAME, tone = "default" }: BrandMarkProps) {
  const colors = toneColors[tone];

  return (
    <svg
      aria-hidden={title ? undefined : true}
      className={cn("h-10 w-10 shrink-0", className)}
      fill="none"
      role={title ? "img" : undefined}
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M63.6 8.2L69.2 24.9L85.9 30.5L69.2 36.1L63.6 52.8L58 36.1L41.3 30.5L58 24.9L63.6 8.2Z"
        fill={colors.gold}
      />
      <path
        d="M22 47H49.4L57.1 37.2H70.8L78.6 47H106"
        stroke={colors.green}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="8"
      />
      <path d="M51.2 47H76.8V59.2H68.9V97.8H59.1V59.2H51.2V47Z" fill={colors.green} />
      <path
        d="M41.7 51.4L23.7 86.9M41.7 51.4L59.7 86.9M86.3 51.4L68.3 86.9M86.3 51.4L104.3 86.9"
        stroke={colors.green}
        strokeLinecap="round"
        strokeWidth="4.6"
      />
      <path
        d="M18 87.2H64C62.1 97.5 53.6 104.8 41 104.8C28.4 104.8 19.9 97.5 18 87.2Z"
        fill={colors.green}
      />
      <path
        d="M64 87.2H110C108.1 97.5 99.6 104.8 87 104.8C74.4 104.8 65.9 97.5 64 87.2Z"
        fill={colors.green}
      />
      <path d="M19.8 87.2H62.2M65.8 87.2H108.2" stroke={colors.gold} strokeLinecap="round" strokeWidth="4.6" />
      <path d="M43.4 34.9H84.6" stroke={colors.green} strokeLinecap="round" strokeWidth="6.6" />
      <path d="M47.5 114.2H80.5" stroke={colors.green} strokeLinecap="round" strokeWidth="8" />
      <path d="M35.7 121H92.3" stroke={colors.green} strokeLinecap="round" strokeWidth="6.6" />
      <path d="M50.5 112H77.5" stroke={colors.gold} strokeLinecap="round" strokeWidth="3.8" />
      <path
        d="M46.1 64.5L59.5 51.1L77.3 68.9L63.9 82.3L46.1 64.5Z"
        fill={colors.gold}
        stroke={colors.light}
        strokeLinejoin="round"
        strokeWidth="2.8"
      />
      <path
        d="M37 74.4L45.7 65.7L60.1 80.1L51.4 88.8L37 74.4Z"
        fill={colors.green}
        stroke={colors.light}
        strokeLinejoin="round"
        strokeWidth="2.6"
      />
      <path d="M34.7 76.5L27.9 83.3" stroke={colors.green} strokeLinecap="round" strokeWidth="5.4" />
      <path d="M80.3 65.5L86.9 58.9" stroke={colors.gold} strokeLinecap="round" strokeWidth="5.4" />
      <circle cx="22" cy="47" fill={colors.gold} r="5.5" stroke={colors.light} strokeWidth="2.4" />
      <circle cx="106" cy="47" fill={colors.gold} r="5.5" stroke={colors.light} strokeWidth="2.4" />
    </svg>
  );
}

type BrandLockupProps = {
  className?: string;
  markClassName?: string;
  nameClassName?: string;
  showName?: boolean;
  stacked?: boolean;
  style?: CSSProperties;
  tone?: BrandTone;
};

export function BrandLockup({
  className,
  markClassName,
  nameClassName,
  showName = true,
  stacked = false,
  style,
  tone = "default"
}: BrandLockupProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)} style={style}>
      <BrandMark className={markClassName} tone={tone} />
      {showName ? (
        <span
          className={cn(
            "min-w-0 truncate font-serif font-bold leading-none tracking-[-0.045em]",
            stacked && "flex flex-col gap-0.5 leading-[0.86]",
            nameClassName
          )}
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {stacked ? (
            <>
              <span>Ruang</span>
              <span>Agunan</span>
            </>
          ) : (
            BRAND_NAME
          )}
        </span>
      ) : null}
    </span>
  );
}
