"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BuddyAvatar } from "./buddy-avatar";
import { BUDDY_NAME } from "@/lib/buddy";

/**
 * «Облако» Digital Buddy: круглый аватар + речевой пузырь с текстом и кнопками.
 * tail — куда смотрит «хвостик» пузыря относительно аватара.
 */
export function BuddyBubble({
  children,
  actions,
  title = BUDDY_NAME,
  eyebrow,
  layout = "row",
  avatarSize = 56,
  className
}: {
  children: ReactNode;
  actions?: ReactNode;
  title?: string;
  eyebrow?: string;
  layout?: "row" | "column";
  avatarSize?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-3",
        layout === "column" ? "flex-col items-center text-center" : "items-start",
        className
      )}
    >
      <div className="relative shrink-0">
        <BuddyAvatar size={avatarSize} className="drop-shadow-sm" />
        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
      </div>

      <div
        className={cn(
          "relative animate-cloud-pop rounded-[22px] border border-kmg-mist bg-white p-4 shadow-card",
          layout === "row" ? "flex-1" : "w-full"
        )}
      >
        {/* хвостик облака */}
        <span
          aria-hidden
          className={cn(
            "absolute h-3 w-3 rotate-45 border-kmg-mist bg-white",
            layout === "row"
              ? "-left-1.5 top-6 border-b border-l"
              : "-top-1.5 left-1/2 -translate-x-1/2 border-l border-t"
          )}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-kmg-ink">{title}</span>
          {eyebrow && (
            <span className="rounded-full bg-kmg-gold/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-kmg-gold-dark">
              {eyebrow}
            </span>
          )}
        </div>
        <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{children}</div>
        {actions && <div className="mt-3 flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
