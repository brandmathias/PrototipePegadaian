"use client";

import Image from "next/image";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type PieceShape = "dot" | "diamond" | "pill";
type StageVariant = "orbit" | "trail" | "spark";
type BurstVariant = "flare" | "spark" | "stream";

type StageConfettiPiece = {
  color: string;
  delay: number;
  driftX: string;
  driftY: string;
  duration: number;
  height: number;
  left: string;
  opacity: string;
  rotateEnd: string;
  rotateStart: string;
  shape: PieceShape;
  top: string;
  variant: StageVariant;
  width: number;
};

type BurstConfettiPiece = {
  color: string;
  delay: number;
  duration: number;
  endX: string;
  endY: string;
  height: number;
  opacity: string;
  originX: string;
  originY: string;
  peakX: string;
  peakY: string;
  rotateEnd: string;
  rotateStart: string;
  shape: PieceShape;
  variant: BurstVariant;
  width: number;
};

type SparkPoint = {
  delay: number;
  left: string;
  size: number;
  top: string;
};

const STAGE_COLORS = ["#d4af37", "#0f6d4c", "#f6cf6b", "#fff1c4", "#1e8d64"];

function formatFixed(value: number, digits = 4) {
  return value.toFixed(digits);
}

function formatPercent(value: number) {
  return `${formatFixed(value)}%`;
}

function formatPx(value: number) {
  return `${formatFixed(value)}px`;
}

function formatViewport(value: number, unit: "vh" | "vw") {
  return `${formatFixed(value)}${unit}`;
}

function formatOpacity(value: number) {
  return value.toFixed(2);
}

const HERO_SPARKS: SparkPoint[] = Array.from({ length: 12 }, (_, index) => {
  const angle = ((index / 12) * Math.PI * 2) - Math.PI / 2;
  const radiusX = index % 2 === 0 ? 41 : 35;
  const radiusY = index % 3 === 0 ? 33 : 28;

  return {
    delay: index * -240,
    left: formatPercent(50 + Math.cos(angle) * radiusX),
    size: index % 4 === 0 ? 9 : index % 3 === 0 ? 7 : 6,
    top: formatPercent(48 + Math.sin(angle) * radiusY),
  };
});

function polarPercentX(angle: number, radius: number) {
  return formatPercent(50 + Math.cos(angle) * radius);
}

function polarPercentY(angle: number, radius: number) {
  return formatPercent(48 + Math.sin(angle) * radius);
}

const STAGE_CONFETTI_PIECES: StageConfettiPiece[] = [
  ...Array.from({ length: 20 }, (_, index) => {
    const angle = ((index / 20) * Math.PI * 2) - Math.PI / 2;
    const radiusX = 34 + (index % 3) * 3.8;
    const radiusY = 27 + (index % 3) * 3.2;
    const shape: PieceShape =
      index % 5 === 0 ? "pill" : index % 3 === 0 ? "diamond" : "dot";
    const variant: StageVariant = "orbit";

    return {
      color: STAGE_COLORS[index % STAGE_COLORS.length],
      delay: index * -180,
      driftX: formatPx(Math.cos(angle) * (14 + (index % 3) * 4)),
      driftY: formatPx(Math.sin(angle) * (12 + (index % 4) * 3) - 8),
      duration: 3600 + (index % 5) * 240,
      height: shape === "pill" ? 22 : shape === "diamond" ? 13 : 9,
      left: polarPercentX(angle, radiusX),
      opacity: formatOpacity(0.78 + (index % 4) * 0.05),
      rotateEnd: `${32 + index * 14}deg`,
      rotateStart: `${-24 + index * 7}deg`,
      shape,
      top: polarPercentY(angle, radiusY),
      variant,
      width: shape === "pill" ? 8 : shape === "diamond" ? 13 : 9,
    };
  }),
  ...Array.from({ length: 14 }, (_, index) => {
    const angle = ((index / 14) * Math.PI * 2) - Math.PI / 2 + 0.18;
    const radiusX = 23 + (index % 2) * 4.5;
    const radiusY = 18 + (index % 3) * 3;
    const shape: PieceShape = "dot";
    const variant: StageVariant = "spark";

    return {
      color: STAGE_COLORS[(index + 2) % STAGE_COLORS.length],
      delay: index * -220,
      driftX: formatPx(Math.cos(angle) * (10 + (index % 3) * 3)),
      driftY: formatPx(Math.sin(angle) * (10 + (index % 2) * 4) - 6),
      duration: 3000 + (index % 4) * 210,
      height: index % 3 === 0 ? 9 : 7,
      left: polarPercentX(angle, radiusX),
      opacity: formatOpacity(0.72 + (index % 5) * 0.05),
      rotateEnd: `${18 + index * 11}deg`,
      rotateStart: `${-16 + index * 5}deg`,
      shape,
      top: polarPercentY(angle, radiusY),
      variant,
      width: index % 3 === 0 ? 9 : 7,
    };
  }),
  ...Array.from({ length: 12 }, (_, index) => {
    const trailAngles = [-130, -108, -82, -58, -28, -6, 18, 44, 72, 98, 122, 148];
    const angle = (trailAngles[index] * Math.PI) / 180;
    const radiusX = 39 + (index % 2) * 4;
    const radiusY = 31 + (index % 3) * 2.5;
    const shape: PieceShape = index % 3 === 0 ? "diamond" : "pill";
    const variant: StageVariant = "trail";

    return {
      color: STAGE_COLORS[(index + 1) % STAGE_COLORS.length],
      delay: index * -260,
      driftX: formatPx(Math.cos(angle) * (22 + (index % 3) * 5)),
      driftY: formatPx(Math.sin(angle) * (16 + (index % 2) * 5) - 10),
      duration: 4300 + (index % 5) * 230,
      height: index % 4 === 0 ? 34 : index % 2 === 0 ? 28 : 18,
      left: polarPercentX(angle, radiusX),
      opacity: formatOpacity(0.76 + (index % 4) * 0.05),
      rotateEnd: `${42 + index * 12}deg`,
      rotateStart: `${-34 + index * 8}deg`,
      shape,
      top: polarPercentY(angle, radiusY),
      variant,
      width: index % 3 === 0 ? 10 : 8,
    };
  }),
];

const BURST_COLORS = ["#d4af37", "#0f6d4c", "#f6cf6b", "#fff1c4", "#1e8d64"];

const BURST_EMITTERS = [
  { angle: 82, count: 14, spread: 58, x: 8, y: 12 },
  { angle: 98, count: 14, spread: 58, x: 92, y: 12 },
  { angle: 90, count: 18, spread: 74, x: 50, y: 6 },
  { angle: -58, count: 18, spread: 54, x: 10, y: 88 },
  { angle: -122, count: 18, spread: 54, x: 90, y: 88 },
  { angle: -90, count: 26, spread: 84, x: 50, y: 94 },
  { angle: 0, count: 14, spread: 72, x: 2, y: 52 },
  { angle: 180, count: 14, spread: 72, x: 98, y: 52 },
  { angle: -84, count: 18, spread: 64, x: 32, y: 60 },
  { angle: -96, count: 18, spread: 64, x: 68, y: 60 },
];

const BURST_CONFETTI_PIECES: BurstConfettiPiece[] = BURST_EMITTERS.flatMap(
  (emitter, emitterIndex) =>
    Array.from({ length: emitter.count }, (_, index) => {
      const progress =
        emitter.count === 1 ? 0.5 : index / (emitter.count - 1);
      const angleDeg =
        emitter.angle -
        emitter.spread / 2 +
        progress * emitter.spread +
        ((index % 3) - 1) * 4;
      const angle = (angleDeg * Math.PI) / 180;
      const variant: BurstVariant =
        index % 5 === 0 ? "stream" : index % 3 === 0 ? "spark" : "flare";
      const peakDistance = 12 + (index % 5) * 5 + emitterIndex * 1.6;
      const endDistance = peakDistance + 20 + (index % 4) * 6;
      const lift = 22 + (index % 4) * 6 + emitterIndex * 1.8;

      return {
        color: BURST_COLORS[(index + emitterIndex) % BURST_COLORS.length],
        delay: emitterIndex * 60 + index * 20,
        duration: 4500 + emitterIndex * 120 + (index % 4) * 190,
        endX: formatViewport(Math.cos(angle) * endDistance, "vw"),
        endY: formatViewport(
          24 + Math.abs(Math.sin(angle)) * 34 + (index % 4) * 6,
          "vh"
        ),
        height:
          variant === "stream"
            ? 34 + (index % 3) * 8
            : variant === "spark"
              ? 10 + (index % 3) * 2
              : 18 + (index % 4) * 4,
        opacity: formatOpacity(variant === "spark" ? 0.82 : 0.96),
        originX: formatViewport(emitter.x, "vw"),
        originY: formatViewport(emitter.y, "vh"),
        peakX: formatViewport(Math.cos(angle) * peakDistance, "vw"),
        peakY: formatViewport(Math.sin(angle) * lift, "vh"),
        rotateEnd: `${angleDeg + 150 + (index % 4) * 18}deg`,
        rotateStart: `${angleDeg - 28 - (index % 3) * 8}deg`,
        shape:
          variant === "spark"
            ? "dot"
            : variant === "stream"
              ? "pill"
              : index % 2 === 0
                ? "diamond"
                : "pill",
        variant,
        width:
          variant === "stream"
            ? 8 + (index % 2) * 2
            : variant === "spark"
              ? 10 + (index % 2) * 2
              : 12 + (index % 3) * 2,
      };
    })
);

type AuctionWinnerHeroStageProps = {
  trophySrc: string;
};

export function AuctionWinnerHeroStage({
  trophySrc,
}: AuctionWinnerHeroStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [isBurstActive, setIsBurstActive] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const writeMotionVars = (x: number, y: number) => {
    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    stage.style.setProperty("--winner-trophy-x", `${x * 14}px`);
    stage.style.setProperty("--winner-trophy-y", `${y * 10}px`);
    stage.style.setProperty("--winner-trophy-tilt", `${x * 2.1}deg`);
    stage.style.setProperty("--winner-confetti-x", `${x * -18}px`);
    stage.style.setProperty("--winner-confetti-y", `${y * -15}px`);
    stage.style.setProperty("--winner-ring-x", `${x * 12}px`);
    stage.style.setProperty("--winner-ring-y", `${y * 10}px`);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    pointerRef.current = { x, y };

    if (frameRef.current !== null) {
      return;
    }

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      writeMotionVars(pointerRef.current.x, pointerRef.current.y);
    });
  };

  const handlePointerLeave = () => {
    pointerRef.current = { x: 0, y: 0 };
    writeMotionVars(0, 0);
  };

  useEffect(() => {
    setIsMounted(true);

    const burstTimer = window.setTimeout(() => {
      setIsBurstActive(false);
    }, 5000);

    return () => {
      window.clearTimeout(burstTimer);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <div
      className="winner-hero-stage relative z-30 min-h-[19rem] select-none md:min-h-[23rem]"
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      ref={stageRef}
    >
      {isMounted && isBurstActive
        ? createPortal(
            <div
              aria-hidden="true"
              className="winner-party-burst pointer-events-none fixed inset-0 overflow-hidden"
            >
              {BURST_CONFETTI_PIECES.map((piece, index) => (
                <span
                  className={`winner-party-piece winner-party-piece-${piece.shape} winner-party-piece-${piece.variant}`}
                  key={`${piece.originX}-${piece.originY}-${index}`}
                  style={
                    {
                      "--winner-burst-end-x": piece.endX,
                      "--winner-burst-end-y": piece.endY,
                      "--winner-burst-opacity": piece.opacity,
                      "--winner-burst-origin-x": piece.originX,
                      "--winner-burst-origin-y": piece.originY,
                      "--winner-burst-peak-x": piece.peakX,
                      "--winner-burst-peak-y": piece.peakY,
                      "--winner-burst-rotate-end": piece.rotateEnd,
                      "--winner-burst-rotate-start": piece.rotateStart,
                      animationDelay: `${piece.delay}ms`,
                      animationDuration: `${piece.duration}ms`,
                      backgroundColor: piece.color,
                      height: `${piece.height}px`,
                      width: `${piece.width}px`,
                    } as CSSProperties
                  }
                />
              ))}
            </div>,
            document.body
          )
        : null}

      <div className="absolute left-1/2 top-[53%] h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 md:h-[24.5rem] md:w-[24.5rem]">
        <div className="winner-hero-halo absolute inset-[7%] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(240,199,90,0.22),rgba(48,148,96,0.16)_38%,transparent_70%)]" />
        <div className="winner-hero-ring winner-hero-ring-outer absolute inset-[3%] rounded-full border border-[#d4af37]/20" />
        <div className="winner-hero-ring winner-hero-ring-mid absolute inset-[13%] rounded-full border border-[#f2ca66]/18" />
        <div className="winner-hero-ring winner-hero-ring-inner absolute inset-[24%] rounded-full border border-[#d9c17a]/16" />

        <div
          aria-hidden="true"
          className="winner-stage-confetti pointer-events-none absolute -inset-[8%]"
        >
          {STAGE_CONFETTI_PIECES.map((piece, index) => (
            <span
              className={`winner-stage-confetti-piece winner-stage-confetti-piece-${piece.shape} winner-stage-confetti-piece-${piece.variant}`}
              key={`${piece.left}-${piece.top}-${index}`}
              style={
                {
                  "--winner-piece-drift-x": piece.driftX,
                  "--winner-piece-drift-y": piece.driftY,
                  "--winner-piece-opacity": piece.opacity,
                  "--winner-piece-rotate-end": piece.rotateEnd,
                  "--winner-piece-rotate-start": piece.rotateStart,
                  animationDelay: `${piece.delay}ms`,
                  animationDuration: `${piece.duration}ms`,
                  backgroundColor: piece.color,
                  height: `${piece.height}px`,
                  left: piece.left,
                  top: piece.top,
                  width: `${piece.width}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        {HERO_SPARKS.map((spark, index) => (
          <span
            aria-hidden="true"
            className="winner-hero-spark absolute rounded-full bg-[#f8d779] shadow-[0_0_24px_rgba(248,215,121,0.72)]"
            key={`${spark.left}-${spark.top}-${index}`}
            style={{
              animationDelay: `${spark.delay}ms`,
              height: `${spark.size}px`,
              left: spark.left,
              top: spark.top,
              width: `${spark.size}px`,
            }}
          />
        ))}

        <div className="absolute left-1/2 top-[71%] z-[12] w-[45%] -translate-x-1/2 -translate-y-1/2">
          <div className="winner-trophy-shadow h-10 w-full rounded-full bg-black/28 blur-2xl" />
        </div>

        <div className="absolute left-1/2 top-[54%] z-[18] w-[78%] -translate-x-1/2 -translate-y-1/2 md:w-[80%]">
          <Image
            alt="Piala pemenang lelang Pegadaian"
            className="winner-trophy-float relative h-auto w-full drop-shadow-[0_34px_46px_rgba(0,0,0,0.42)]"
            height={1254}
            priority
            sizes="(max-width: 768px) 82vw, 420px"
            src={trophySrc}
            width={1254}
          />
        </div>
      </div>
    </div>
  );
}
