"use client";

import { CheckCircle2, Circle, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Flow } from "@/lib/types";

export function JourneyStrip({ flow }: { flow: Flow }) {
  return (
    <div className="flex items-stretch gap-3 overflow-x-auto scrollbar-thin pb-2">
      {flow.nodes
        .filter((n) => n.type !== "start" && n.type !== "end")
        .map((node, idx, arr) => {
          const isDone = node.status === "done";
          const isActive = node.status === "active";
          const isBlocked = node.status === "blocked";
          return (
            <div key={node.id} className="flex min-w-[180px] items-center">
              <div
                className={cn(
                  "flex h-full flex-1 flex-col rounded-xl border p-3 transition-all",
                  isDone && "border-emerald-200 bg-emerald-50/60",
                  isActive && "border-kmg-gold/40 bg-amber-50/60 shadow-glow",
                  isBlocked && "border-red-200 bg-red-50/60",
                  !isDone && !isActive && !isBlocked && "border-kmg-mist bg-white"
                )}
              >
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <span>Шаг {idx + 1}</span>
                  <span className="flex items-center gap-1">
                    {isDone && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                    {isActive && <Clock className="h-3 w-3 text-amber-600" />}
                    {isBlocked && <Lock className="h-3 w-3 text-red-600" />}
                    {!isDone && !isActive && !isBlocked && <Circle className="h-3 w-3" />}
                  </span>
                </div>
                <div className="mt-2 text-sm font-semibold leading-tight text-kmg-ink">
                  {node.title}
                </div>
                {node.description && (
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {node.description}
                  </div>
                )}
              </div>
              {idx < arr.length - 1 && (
                <div className="mx-2 h-0.5 w-6 shrink-0 bg-gradient-to-r from-kmg-navy/40 to-kmg-gold/40" />
              )}
            </div>
          );
        })}
    </div>
  );
}
