"use client";

import Image from "next/image";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type PieceShape = "dot" | "diamond" | "sliver";
type StageVariant = "orbit" | "trail" | "spark";
type BurstVariant = "stream" | "ember" | "mist";

type StagePiece = {
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

type BurstPiece = {
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

const STAGE_COLORS = ["#f1d8dc", "#d8dfe7", "#f7f3f4", "#9ea9b6", "#d9afb8"];
const BURST_COLORS = ["#f0d6da", "#d2dae3", "#fff7f7", "#aeb9c5", "#e3b7be"];

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

function polarPercentX(angle: number, radius: number) {
  return formatPercent(50 + Math.cos(angle) * radius);
}

function polarPercentY(angle: number, radius: number) {
  return formatPercent(50 + Math.sin(angle) * radius);
}

const HERO_SPARKS: SparkPoint[] = Array.from({ length: 16 }, (_, index) => {
  const angle = ((index / 16) * Math.PI * 2) - Math.PI / 2;
  const radiusX = index % 2 === 0 ? 36 : 30;
  const radiusY = index % 3 === 0 ? 33 : 26;

  return {
    delay: index * -210,
    left: formatPercent(50 + Math.cos(angle) * radiusX),
    size: index % 5 === 0 ? 8 : index % 3 === 0 ? 6 : 5,
    top: formatPercent(50 + Math.sin(angle) * radiusY),
  };
});

const STAGE_PIECES: StagePiece[] = [
  ...Array.from({ length: 20 }, (_, index) => {
    const angle = ((index / 20) * Math.PI * 2) - Math.PI / 2;
    const radiusX = 34 + (index % 3) * 3.8;
    const radiusY = 28 + (index % 4) * 3.1;
    const shape: PieceShape =
      index % 5 === 0 ? "dot" : index % 2 === 0 ? "sliver" : "diamond";
    const variant: StageVariant = "orbit";

    return {
      color: STAGE_COLORS[index % STAGE_COLORS.length],
      delay: index * -180,
      driftX: formatPx(Math.cos(angle) * (5 + (index % 3) * 2.2)),
      driftY: formatPx(18 + Math.abs(Math.sin(angle)) * (24 + (index % 4) * 4.8)),
      duration: 4500 + (index % 5) * 260,
      height: shape === "sliver" ? 28 : shape === "diamond" ? 13 : 7,
      left: polarPercentX(angle, radiusX),
      opacity: formatOpacity(0.44 + (index % 4) * 0.08),
      rotateEnd: `${16 + index * 11}deg`,
      rotateStart: `${-18 + index * 4}deg`,
      shape,
      top: polarPercentY(angle, radiusY),
      variant,
      width: shape === "sliver" ? 6 : shape === "diamond" ? 11 : 7,
    };
  }),
  ...Array.from({ length: 14 }, (_, index) => {
    const angle = ((index / 14) * Math.PI * 2) - Math.PI / 2 + 0.14;
    const radiusX = 24 + (index % 2) * 5;
    const radiusY = 19 + (index % 3) * 3.2;
    const variant: StageVariant = "spark";

    return {
      color: STAGE_COLORS[(index + 2) % STAGE_COLORS.length],
      delay: index * -230,
      driftX: formatPx(Math.cos(angle) * (3 + (index % 3) * 1.4)),
      driftY: formatPx(12 + Math.abs(Math.sin(angle)) * (18 + (index % 2) * 4.2)),
      duration: 2700 + (index % 4) * 180,
      height: index % 3 === 0 ? 8 : 6,
      left: polarPercentX(angle, radiusX),
      opacity: formatOpacity(0.32 + (index % 5) * 0.07),
      rotateEnd: `${16 + index * 10}deg`,
      rotateStart: `${-10 + index * 4}deg`,
      shape: "dot" as const,
      top: polarPercentY(angle, radiusY),
      variant,
      width: index % 3 === 0 ? 8 : 6,
    };
  }),
  ...Array.from({ length: 14 }, (_, index) => {
    const trailAngles = [-154, -128, -102, -78, -52, -28, -6, 18, 42, 68, 96, 122, 148, 174];
    const angle = (trailAngles[index] * Math.PI) / 180;
    const shape: PieceShape = index % 4 === 0 ? "diamond" : "sliver";
    const variant: StageVariant = "trail";

    return {
      color: STAGE_COLORS[(index + 1) % STAGE_COLORS.length],
      delay: index * -250,
      driftX: formatPx(Math.cos(angle) * (6 + (index % 3) * 2)),
      driftY: formatPx(24 + Math.abs(Math.sin(angle)) * (28 + (index % 2) * 6)),
      duration: 5000 + (index % 5) * 260,
      height: index % 4 === 0 ? 34 : index % 2 === 0 ? 24 : 20,
      left: polarPercentX(angle, 39 + (index % 2) * 4),
      opacity: formatOpacity(0.38 + (index % 4) * 0.07),
      rotateEnd: `${30 + index * 10}deg`,
      rotateStart: `${-26 + index * 6}deg`,
      shape,
      top: polarPercentY(angle, 32 + (index % 3) * 2.4),
      variant,
      width: index % 3 === 0 ? 8 : 5,
    };
  }),
];

const BURST_EMITTERS = [
  { angle: 108, count: 22, spread: 18, x: 6, y: -8 },
  { angle: 98, count: 26, spread: 20, x: 22, y: -8 },
  { angle: 92, count: 28, spread: 18, x: 38, y: -8 },
  { angle: 88, count: 30, spread: 18, x: 50, y: -9 },
  { angle: 84, count: 28, spread: 18, x: 62, y: -8 },
  { angle: 78, count: 26, spread: 20, x: 78, y: -8 },
  { angle: 70, count: 22, spread: 18, x: 94, y: -8 },
  { angle: 28, count: 14, spread: 22, x: -3, y: 14 },
  { angle: 152, count: 14, spread: 22, x: 103, y: 14 },
];

const BURST_PIECES: BurstPiece[] = BURST_EMITTERS.flatMap((emitter, emitterIndex) =>
  Array.from({ length: emitter.count }, (_, index) => {
    const progress = emitter.count === 1 ? 0.5 : index / (emitter.count - 1);
    const angleDeg = emitter.angle - emitter.spread / 2 + progress * emitter.spread + ((index % 3) - 1) * 5;
    const angle = (angleDeg * Math.PI) / 180;
    const variant: BurstVariant = index % 4 === 0 ? "mist" : index % 5 === 0 ? "ember" : "stream";
    const peakDistance = 4 + (index % 5) * 1.8 + emitterIndex * 0.45;
    const endDistance = peakDistance + 7 + (index % 4) * 2.8;
    const fallDepth = 58 + (index % 5) * 10 + emitterIndex * 1.6;

    return {
      color: BURST_COLORS[(index + emitterIndex) % BURST_COLORS.length],
      delay: emitterIndex * 55 + index * 14,
      duration: 4200 + emitterIndex * 90 + (index % 4) * 160,
      endX: formatViewport(Math.cos(angle) * endDistance, "vw"),
      endY: formatViewport(fallDepth, "vh"),
      height: variant === "mist" ? 34 + (index % 3) * 10 : variant === "ember" ? 9 + (index % 3) * 2 : 22 + (index % 4) * 6,
      opacity: formatOpacity(variant === "ember" ? 0.62 : variant === "mist" ? 0.42 : 0.82),
      originX: formatViewport(emitter.x, "vw"),
      originY: formatViewport(emitter.y, "vh"),
      peakX: formatViewport(Math.cos(angle) * peakDistance, "vw"),
      peakY: formatViewport(6 + Math.abs(Math.sin(angle)) * 8 + (index % 3) * 3, "vh"),
      rotateEnd: `${angleDeg + 108 + (index % 4) * 10}deg`,
      rotateStart: `${angleDeg - 16 - (index % 3) * 7}deg`,
      shape: variant === "ember" ? "dot" : variant === "mist" ? "sliver" : index % 3 === 0 ? "diamond" : "sliver",
      variant,
      width: variant === "mist" ? 4 + (index % 2) * 1 : variant === "ember" ? 7 + (index % 2) * 2 : 6 + (index % 3) * 2,
    };
  })
);

type AuctionLoserHeroStageProps = {
  gavelSrc: string;
};

export function AuctionLoserHeroStage({ gavelSrc }: AuctionLoserHeroStageProps) {
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

    stage.style.setProperty("--loser-gavel-x", `${x * 11}px`);
    stage.style.setProperty("--loser-gavel-y", `${y * 9}px`);
    stage.style.setProperty("--loser-gavel-tilt", `${x * 1.8}deg`);
    stage.style.setProperty("--loser-stage-x", `${x * -14}px`);
    stage.style.setProperty("--loser-stage-y", `${y * -12}px`);
    stage.style.setProperty("--loser-ring-x", `${x * 9}px`);
    stage.style.setProperty("--loser-ring-y", `${y * 8}px`);
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
      className="loser-hero-stage relative z-30 min-h-[19rem] select-none md:min-h-[23rem]"
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      ref={stageRef}
    >
      {isMounted && isBurstActive
        ? createPortal(
            <div
              aria-hidden="true"
              className="loser-party-burst pointer-events-none fixed inset-0 overflow-hidden"
            >
              {BURST_PIECES.map((piece, index) => (
                <span
                  className={`loser-party-piece loser-party-piece-${piece.shape} loser-party-piece-${piece.variant}`}
                  key={`${piece.originX}-${piece.originY}-${index}`}
                  style={
                    {
                      "--loser-burst-end-x": piece.endX,
                      "--loser-burst-end-y": piece.endY,
                      "--loser-burst-opacity": piece.opacity,
                      "--loser-burst-origin-x": piece.originX,
                      "--loser-burst-origin-y": piece.originY,
                      "--loser-burst-peak-x": piece.peakX,
                      "--loser-burst-peak-y": piece.peakY,
                      "--loser-burst-rotate-end": piece.rotateEnd,
                      "--loser-burst-rotate-start": piece.rotateStart,
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

      <div className="absolute left-1/2 top-1/2 h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 md:h-[25rem] md:w-[25rem]">
        <div className="loser-hero-halo absolute inset-[7%] rounded-full bg-[radial-gradient(circle_at_50%_48%,rgba(255,167,173,0.2),rgba(139,157,176,0.14)_40%,transparent_74%)]" />
        <div className="loser-hero-ring loser-hero-ring-outer absolute inset-[2%] rounded-full border border-white/[0.10]" />
        <div className="loser-hero-ring loser-hero-ring-mid absolute inset-[13%] rounded-full border border-white/[0.08]" />
        <div className="loser-hero-ring loser-hero-ring-inner absolute inset-[25%] rounded-full border border-white/[0.07]" />

        <div
          aria-hidden="true"
          className="loser-stage-confetti pointer-events-none absolute -inset-[8%]"
        >
          {STAGE_PIECES.map((piece, index) => (
            <span
              className={`loser-stage-piece loser-stage-piece-${piece.shape} loser-stage-piece-${piece.variant}`}
              key={`${piece.left}-${piece.top}-${index}`}
              style={
                {
                  "--loser-piece-drift-x": piece.driftX,
                  "--loser-piece-drift-y": piece.driftY,
                  "--loser-piece-opacity": piece.opacity,
                  "--loser-piece-rotate-end": piece.rotateEnd,
                  "--loser-piece-rotate-start": piece.rotateStart,
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
            className="loser-hero-spark absolute rounded-full bg-[#ffe4e8] shadow-[0_0_22px_rgba(255,213,219,0.54)]"
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

        <div className="absolute left-1/2 top-[67%] z-[12] w-[46%] -translate-x-1/2 -translate-y-1/2">
          <div className="loser-gavel-shadow h-10 w-full rounded-full bg-black/32 blur-2xl" />
        </div>

        <div className="absolute left-1/2 top-[50%] z-[18] w-[79%] -translate-x-1/2 -translate-y-1/2 md:w-[80%]">
          <Image
            alt="Palu hasil lelang"
            className="loser-gavel-float relative h-auto w-full object-contain drop-shadow-[0_30px_44px_rgba(0,0,0,0.42)]"
            height={1254}
            priority
            sizes="(max-width: 768px) 82vw, 430px"
            src={gavelSrc}
            width={1254}
          />
        </div>
      </div>
    </div>
  );
}
