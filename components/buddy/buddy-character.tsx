"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export type BuddyMood = "happy" | "wave" | "point" | "cheer";

/**
 * Digital Buddy — гид-персонаж (полная фигура), рисованный SVG.
 * Авто-подмена: если в /public/buddy/character.png лежит ассет организатора,
 * показываем его; иначе — встроенный анимированный SVG-маскот.
 */
export function BuddyCharacter({
  className,
  mood = "happy",
  float = true,
  asset = "/buddy/character.png"
}: {
  className?: string;
  mood?: BuddyMood;
  float?: boolean;
  asset?: string;
}) {
  const gid = useId().replace(/:/g, "");
  const [useAsset, setUseAsset] = useState(true);

  if (useAsset) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={asset}
        alt="Digital Buddy"
        className={cn("select-none object-contain", float && "animate-buddy-float", className)}
        onError={() => setUseAsset(false)}
        draggable={false}
      />
    );
  }

  const waving = mood === "wave";
  const cheering = mood === "cheer";
  const pointing = mood === "point";

  return (
    <svg
      viewBox="0 0 200 260"
      className={cn("select-none", float && "animate-buddy-float", className)}
      role="img"
      aria-label="Digital Buddy"
    >
      <defs>
        <linearGradient id={`body-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1A5694" />
          <stop offset="0.6" stopColor="#003F7D" />
          <stop offset="1" stopColor="#002A55" />
        </linearGradient>
        <linearGradient id={`face-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B2748" />
          <stop offset="1" stopColor="#06182F" />
        </linearGradient>
        <radialGradient id={`glow-${gid}`} cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#FFAA2D" stopOpacity="0.35" />
          <stop offset="1" stopColor="#FFAA2D" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* мягкая тень-подставка */}
      <ellipse cx="100" cy="246" rx="52" ry="9" fill="#0B1F3A" opacity="0.12" />

      {/* ноги */}
      <rect x="78" y="200" width="16" height="34" rx="8" fill="#002A55" />
      <rect x="106" y="200" width="16" height="34" rx="8" fill="#002A55" />
      <ellipse cx="86" cy="236" rx="14" ry="7" fill="#F39200" />
      <ellipse cx="114" cy="236" rx="14" ry="7" fill="#F39200" />

      {/* левая рука */}
      {cheering ? (
        <g>
          <rect x="34" y="118" width="16" height="52" rx="8" fill="#1A5694" transform="rotate(-28 42 144)" />
          <circle cx="30" cy="112" r="11" fill="#F39200" />
        </g>
      ) : (
        <g>
          <rect x="40" y="132" width="16" height="56" rx="8" fill="#1A5694" />
          <circle cx="48" cy="190" r="11" fill="#F39200" />
        </g>
      )}

      {/* корпус */}
      <rect x="52" y="96" width="96" height="116" rx="34" fill={`url(#body-${gid})`} />
      {/* нагрудный экран с «галочкой прогресса» */}
      <rect x="70" y="140" width="60" height="40" rx="12" fill="#06182F" opacity="0.85" />
      <path
        d="M82 160 l10 10 l18 -20"
        fill="none"
        stroke="#3FD6A0"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* правая рука — машет / показывает / вверх */}
      <g
        style={{ transformOrigin: "150px 120px" }}
        className={waving ? "animate-buddy-wave" : undefined}
        transform={cheering ? "rotate(28 150 120)" : pointing ? "rotate(40 150 130)" : undefined}
      >
        <rect x="144" y="120" width="16" height="56" rx="8" fill="#1A5694" />
        <circle cx="152" cy="178" r="11" fill="#F39200" />
      </g>

      {/* антенна */}
      <line x1="100" y1="60" x2="100" y2="40" stroke="#1A5694" strokeWidth="5" strokeLinecap="round" />
      <circle cx="100" cy="34" r="8" fill="#F39200">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.2s" repeatCount="indefinite" />
      </circle>

      {/* голова */}
      <rect x="58" y="58" width="84" height="74" rx="30" fill={`url(#body-${gid})`} />
      <rect x="66" y="66" width="68" height="56" rx="24" fill={`url(#face-${gid})`} />
      <ellipse cx="100" cy="92" rx="40" ry="28" fill={`url(#glow-${gid})`} />

      {/* глаза (моргают) */}
      <g style={{ transformOrigin: "100px 92px" }} className="animate-buddy-blink">
        <circle cx="86" cy="92" r="7.5" fill="#FFFFFF" />
        <circle cx="114" cy="92" r="7.5" fill="#FFFFFF" />
        <circle cx="87.5" cy="93" r="3.4" fill="#0B1F3A" />
        <circle cx="115.5" cy="93" r="3.4" fill="#0B1F3A" />
      </g>

      {/* улыбка */}
      <path
        d="M88 106 q12 12 24 0"
        fill="none"
        stroke="#FFAA2D"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
