"use client";

import { useMemo } from "react";
import { CalendarView, type CalendarEvent } from "@/components/shared/calendar-view";
import { useStore } from "@/lib/store";

export default function HrCalendarPage() {
  const { state } = useStore();

  const events = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = [];
    for (const ticket of state.tickets) {
      result.push({
        id: `due-${ticket.id}`,
        date: ticket.dueDate,
        title: `Дедлайн: ${ticket.title}`,
        tone:
          ticket.status === "blocked"
            ? "danger"
            : ticket.status === "completed"
              ? "success"
              : "navy",
        meta: `${ticket.code} · ${ticket.progress}%`
      });
      result.push({
        id: `start-${ticket.id}`,
        date: ticket.createdAt,
        title: `Старт: ${ticket.title}`,
        tone: "info",
        meta: ticket.code
      });
    }
    for (const user of state.users.filter((u) => u.role === "employee" && u.startDate)) {
      result.push({
        id: `onboard-${user.id}`,
        date: user.startDate!,
        title: `Первый день: ${user.fullName}`,
        tone: "gold",
        meta: user.position
      });
    }
    return result;
  }, [state.tickets, state.users]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-kmg-ink">Календарь</h1>
        <p className="text-sm text-muted-foreground">
          Карта дедлайнов тикетов, выходов на работу и ключевых встреч.
        </p>
      </div>
      <CalendarView
        events={events}
        description="Все события онбординга в одном представлении."
      />
    </div>
  );
}
