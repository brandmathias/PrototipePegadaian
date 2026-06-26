import type { CSSProperties } from "react";
import Image from "next/image";

import {
  BRAND_ICON_HEIGHT,
  BRAND_ICON_SRC,
  BRAND_ICON_WIDTH,
  BRAND_NAME,
  BRAND_NAME_IMAGE_HEIGHT,
  BRAND_NAME_IMAGE_SRC,
  BRAND_NAME_IMAGE_WIDTH
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
  title?: string;
  tone?: BrandTone;
};

export function BrandMark({ className, title = "" }: BrandMarkProps) {
  return (
    <Image
      alt={title}
      aria-hidden={title ? undefined : true}
      className={cn("h-10 w-10 shrink-0 object-contain", className)}
      draggable={false}
      height={40}
      sizes="40px"
      src={BRAND_ICON_SRC}
      priority
      width={40}
    />
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
      <BrandMark className={markClassName} />
      {showName ? (
        <Image
          alt=""
          aria-hidden="true"
          className={cn("h-7 w-auto max-w-[12rem] shrink object-contain", nameClassName)}
          draggable={false}
          height={28}
          sizes="192px"
          src={BRAND_NAME_IMAGE_SRC}
          priority
          width={118}
        />
      ) : null}
    </span>
  );
}
