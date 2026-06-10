"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BellRing,
  CalendarClock,
  CheckCircle2,
  GitBranch,
  MessageCircle
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import { cn, formatDateTime } from "@/lib/utils";
import type { AppNotification, NotificationKind } from "@/lib/types";

export const OPEN_NOTIFICATIONS_EVENT = "kmg:open-notifications";

const iconByKind: Record<NotificationKind, typeof Activity> = {
  task: CheckCircle2,
  meeting: CalendarClock,
  stage: GitBranch,
  hr: MessageCircle,
  system: Activity
};

const toneClass: Record<NonNullable<AppNotification["tone"]>, string> = {
  navy: "bg-kmg-navy text-white",
  gold: "bg-kmg-gold text-white",
  success: "bg-emerald-500 text-white",
  warning: "bg-amber-500 text-white",
  danger: "bg-red-500 text-white",
  info: "bg-sky-500 text-white"
};

export function NotificationsSheet({ trigger }: { trigger: React.ReactNode }) {
  const { currentUser, helpers } = useStore();
  const [open, setOpen] = useState(false);

  const notifications = currentUser ? helpers.userNotifications(currentUser.id) : [];
  const unread = notifications.filter((n) => !n.read).length;

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (v && currentUser) helpers.markNotificationsRead(currentUser.id);
  }

  // Digital Buddy может открыть уведомления (кнопка «Открыть уведомления»).
  useEffect(() => {
    const handler = () => {
      setOpen(true);
      if (currentUser) helpers.markNotificationsRead(currentUser.id);
    };
    window.addEventListener(OPEN_NOTIFICATIONS_EVENT, handler);
    return () => window.removeEventListener(OPEN_NOTIFICATIONS_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
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
                {unread > 0 ? `${unread} новых · ` : ""}всего {notifications.length}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto bg-kmg-paper p-4 scrollbar-thin">
          <div className="space-y-2">
            {notifications.length === 0 && (
              <div className="rounded-2xl border border-dashed border-kmg-mist bg-white p-6 text-center text-sm text-muted-foreground">
                Новых уведомлений пока нет.
              </div>
            )}
            {notifications.map((n) => {
              const Icon = iconByKind[n.kind] ?? Activity;
              const inner = (
                <>
                  <div
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                      n.tone ? toneClass[n.tone] : "bg-kmg-mist text-kmg-navy"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-kmg-gold" />}
                      <div className="text-sm font-semibold text-kmg-ink">{n.title}</div>
                    </div>
                    {n.body && <div className="mt-0.5 text-sm text-muted-foreground">{n.body}</div>}
                    <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                      {formatDateTime(n.createdAt)}
                    </div>
                  </div>
                </>
              );
              const className = cn(
                "flex items-start gap-3 rounded-2xl border p-3 shadow-sm transition-colors",
                n.read ? "border-kmg-mist bg-white/70" : "border-kmg-navy/20 bg-white"
              );
              return n.href ? (
                <Link key={n.id} href={n.href} className={className} onClick={() => setOpen(false)}>
                  {inner}
                </Link>
              ) : (
                <div key={n.id} className={className}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
