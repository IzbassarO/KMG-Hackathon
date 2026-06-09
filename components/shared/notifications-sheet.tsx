"use client";

import { Activity, BellRing, CheckCircle2, GitBranch, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";
import type { ActivityEvent } from "@/lib/types";

const iconByType: Record<ActivityEvent["type"], typeof Activity> = {
  ticket: GitBranch,
  task: CheckCircle2,
  system: Activity,
  chat: Sparkles
};

const toneByType: Record<ActivityEvent["type"], string> = {
  ticket: "bg-kmg-navy text-white",
  task: "bg-emerald-500 text-white",
  system: "bg-kmg-mist text-kmg-navy",
  chat: "bg-kmg-gold text-white"
};

export function NotificationsSheet({ trigger }: { trigger: React.ReactNode }) {
  const { state } = useStore();
  const events = state.activity.slice(0, 30);
  const todayCount = events.filter(
    (e) => new Date(e.createdAt).toDateString() === new Date().toDateString()
  ).length;

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="gradient-navy text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-kmg-gold text-white">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-white">Уведомления</SheetTitle>
              <SheetDescription className="text-white/70">
                {todayCount} за сегодня · всего {state.activity.length}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto bg-kmg-paper p-4 scrollbar-thin">
          <div className="space-y-2">
            {events.length === 0 && (
              <div className="rounded-2xl border border-dashed border-kmg-mist bg-white p-6 text-center text-sm text-muted-foreground">
                Новых событий пока нет.
              </div>
            )}
            {events.map((event) => {
              const Icon = iconByType[event.type] ?? Activity;
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-2xl border border-kmg-mist bg-white p-3 shadow-sm transition-colors hover:border-kmg-navy/30"
                >
                  <div
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${toneByType[event.type] ?? "bg-kmg-mist text-kmg-navy"}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-kmg-ink">
                        {event.actorName}
                      </div>
                      {event.meta?.ticket && (
                        <Badge variant="navy">{event.meta.ticket}</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{event.message}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                      {formatDateTime(event.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="border-t border-kmg-mist bg-white p-4">
          <Button variant="outline" className="w-full">
            Открыть журнал событий
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
