"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BuddyAvatar } from "./buddy-avatar";

/**
 * Логотип Digital Buddy (ТЗ §4.2 — в левом верхнем углу окна, мин. 60×80 px).
 * Берётся из /public/buddy/logo.png; при отсутствии — фолбэк на SVG-аватар.
 */
export function BuddyLogo({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <BuddyAvatar size={64} className={cn("shrink-0", className)} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/buddy/logo.png"
      alt="Digital Buddy"
      onError={() => setFailed(true)}
      draggable={false}
      className={cn("select-none object-contain", className)}
    />
  );
}
