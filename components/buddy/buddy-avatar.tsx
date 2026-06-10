"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Круглый аватар Digital Buddy (ТЗ §4.2 — круглый аватар бота).
 * Авто-подмена на /public/buddy/avatar.png, фолбэк — встроенный SVG.
 */
export function BuddyAvatar({
  className,
  size = 40,
  blink = true,
  asset = "/buddy/avatar.png"
}: {
  className?: string;
  size?: number;
  blink?: boolean;
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
        width={size}
        height={size}
        className={cn("select-none rounded-full object-cover", className)}
        onError={() => setUseAsset(false)}
        draggable={false}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn("select-none", className)}
      role="img"
      aria-label="Digital Buddy"
    >
      <defs>
        <linearGradient id={`av-bg-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1A5694" />
          <stop offset="1" stopColor="#002A55" />
        </linearGradient>
        <radialGradient id={`av-glow-${gid}`} cx="0.5" cy="0.42" r="0.65">
          <stop offset="0" stopColor="#FFAA2D" stopOpacity="0.4" />
          <stop offset="1" stopColor="#FFAA2D" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#av-bg-${gid})`} />
      <line x1="50" y1="20" x2="50" y2="12" stroke="#FFAA2D" strokeWidth="4" strokeLinecap="round" />
      <circle cx="50" cy="9" r="5" fill="#F39200" />
      <rect x="26" y="30" width="48" height="40" rx="18" fill="#06182F" />
      <ellipse cx="50" cy="48" rx="26" ry="18" fill={`url(#av-glow-${gid})`} />
      <g style={{ transformOrigin: "50px 48px" }} className={blink ? "animate-buddy-blink" : undefined}>
        <circle cx="40" cy="48" r="6" fill="#FFFFFF" />
        <circle cx="60" cy="48" r="6" fill="#FFFFFF" />
        <circle cx="41" cy="49" r="2.8" fill="#0B1F3A" />
        <circle cx="61" cy="49" r="2.8" fill="#0B1F3A" />
      </g>
      <path d="M41 60 q9 9 18 0" fill="none" stroke="#FFAA2D" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
