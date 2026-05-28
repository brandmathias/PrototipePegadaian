import type { SVGProps } from "react";

type WinnerIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function BaseIcon({
  children,
  size = 24,
  strokeWidth = 2,
  ...props
}: WinnerIconProps) {
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

export function ArrowRightIcon(props: WinnerIconProps) {
  return (
    <BaseIcon {...props}>
      <line x1="5" x2="19" y1="12" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </BaseIcon>
  );
}

export function AwardIcon(props: WinnerIconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8" r="5" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      <polyline points="9 8 11 10 15 6" />
    </BaseIcon>
  );
}

export function BellIcon(props: WinnerIconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </BaseIcon>
  );
}

export function BriefcaseIcon(props: WinnerIconProps) {
  return (
    <BaseIcon {...props}>
      <rect height="14" rx="2" ry="2" width="20" x="2" y="7" />
      <path d="M16 21V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v16" />
    </BaseIcon>
  );
}

export function CalendarIcon(props: WinnerIconProps) {
  return (
    <BaseIcon {...props}>
      <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </BaseIcon>
  );
}

export function CheckCircleIcon(props: WinnerIconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </BaseIcon>
  );
}

export function ChevronRightIcon(props: WinnerIconProps) {
  return (
    <BaseIcon {...props}>
      <polyline points="9 18 15 12 9 6" />
    </BaseIcon>
  );
}

export function ClockIcon(props: WinnerIconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </BaseIcon>
  );
}

export function FileTextIcon(props: WinnerIconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </BaseIcon>
  );
}

export function TagIcon(props: WinnerIconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82z" />
      <line x1="7" x2="7.01" y1="7" y2="7" />
    </BaseIcon>
  );
}
