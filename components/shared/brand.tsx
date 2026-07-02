import type { CSSProperties } from "react";
import Image from "next/image";

import {
  BRAND_ICON_SRC,
  BRAND_NAME,
  BRAND_NAME_IMAGE_SRC
} from "@/lib/brand";
import { cn } from "@/lib/utils";

export {
  BRAND_ICON_SRC,
  BRAND_NAME,
  BRAND_NAME_IMAGE_SRC,
  BRAND_SHARE_IMAGE_SRC,
  BRAND_SHORT_NAME,
  BRAND_TAGLINE
} from "@/lib/brand";

type BrandTone = "default" | "inverse" | "gold";

type BrandMarkProps = {
  className?: string;
  large?: boolean;
  title?: string;
  tone?: BrandTone;
};

export function BrandMark({ className, large = false, title = "" }: BrandMarkProps) {
  const size = large ? 60 : 40;

  return (
    <Image
      alt={title}
      aria-hidden={title ? undefined : true}
      className={cn("h-10 w-10 shrink-0 object-contain", className)}
      draggable={false}
      fetchPriority="low"
      height={size}
      loading="eager"
      src={BRAND_ICON_SRC}
      width={size}
    />
  );
}

type BrandLockupProps = {
  className?: string;
  large?: boolean;
  markClassName?: string;
  nameClassName?: string;
  showName?: boolean;
  stacked?: boolean;
  style?: CSSProperties;
  tone?: BrandTone;
};

export function BrandLockup({
  className,
  large = false,
  markClassName,
  nameClassName,
  showName = true,
  stacked: _stacked = false,
  style,
  tone: _tone = "default"
}: BrandLockupProps) {
  return (
    <span
      aria-label={showName ? BRAND_NAME : undefined}
      className={cn("inline-flex min-w-0 select-none items-center gap-2.5", className)}
      role={showName ? "img" : undefined}
      style={style}
    >
      <BrandMark className={markClassName} large={large} />
      {showName ? (
        <Image
          alt=""
          aria-hidden="true"
          className={cn("h-7 w-auto max-w-[12rem] shrink object-contain", nameClassName)}
          draggable={false}
          fetchPriority="high"
          height={large ? 49 : 28}
          loading="eager"
          src={BRAND_NAME_IMAGE_SRC}
          width={large ? 207 : 118}
        />
      ) : null}
    </span>
  );
}
