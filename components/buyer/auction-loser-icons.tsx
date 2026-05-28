import type { SVGProps } from "react";

type LoserIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function BaseIcon({
  children,
  size = 24,
  strokeWidth = 2,
  ...props
}: LoserIconProps) {
  return (
    <svg
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowRightIcon(props: LoserIconProps) {
  return (
    <BaseIcon {...props}>
      <line x1="5" x2="19" y1="12" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </BaseIcon>
  );
}

export function CalendarIcon(props: LoserIconProps) {
  return (
    <BaseIcon {...props}>
      <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </BaseIcon>
  );
}

export function ChevronLeftIcon(props: LoserIconProps) {
  return (
    <BaseIcon {...props}>
      <polyline points="15 18 9 12 15 6" />
    </BaseIcon>
  );
}

export function ChevronRightIcon(props: LoserIconProps) {
  return (
    <BaseIcon {...props}>
      <polyline points="9 18 15 12 9 6" />
    </BaseIcon>
  );
}

export function ClockIcon(props: LoserIconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </BaseIcon>
  );
}

export function GavelIcon(props: LoserIconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m13.5 5.2 5.3 5.3" />
      <path d="m10.4 8.3 5.3 5.3" />
      <path d="m4.1 19.9 6.4-6.4" />
      <path d="m8.2 4.9 6.8 6.8" />
      <path d="m6.1 7 4.8-4.8 3.4 3.4-4.8 4.8" />
      <path d="m14.3 13.1 4.8-4.8 2.7 2.7-4.8 4.8" />
      <path d="M3 21h8.4" />
    </BaseIcon>
  );
}

export function FrownIcon(props: LoserIconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 15s1.5-2 4-2 4 2 4 2" />
      <line x1="9" x2="9.01" y1="9" y2="9" />
      <line x1="15" x2="15.01" y1="9" y2="9" />
    </BaseIcon>
  );
}

export function HeartIcon(props: LoserIconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </BaseIcon>
  );
}

export function InfoIcon(props: LoserIconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="16" y2="12" />
      <line x1="12" x2="12.01" y1="8" y2="8" />
    </BaseIcon>
  );
}

export function PartyIcon(props: LoserIconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5.8 11.3 3 21l9.7-2.8" />
      <path d="m4.7 15.2 4.1 4.1" />
      <path d="M11 4h.01" />
      <path d="M18 5h.01" />
      <path d="M16 11h.01" />
      <path d="M13.6 7.4 17 4" />
      <path d="M15.2 13.2 20 11" />
      <path d="M8.8 10.4c1.6-.8 3.4-.5 4.6.7s1.5 3 .7 4.6" />
    </BaseIcon>
  );
}
