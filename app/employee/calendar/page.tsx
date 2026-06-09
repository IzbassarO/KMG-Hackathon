"use client";

import { useMemo } from "react";
import { CalendarView, type CalendarEvent } from "@/components/shared/calendar-view";
import { useStore } from "@/lib/store";

export default function EmployeeCalendarPage() {
  const { state, currentUser } = useStore();

  const events = useMemo<CalendarEvent[]>(() => {
    if (!currentUser) return [];
    const myTickets = state.tickets.filter((t) => t.assigneeId === currentUser.id);
    const myTasks = state.tasks.filter((t) => myTickets.some((tk) => tk.id === t.ticketId));

    return [
      ...myTickets.map<CalendarEvent>((ticket) => ({
        id: `t-${ticket.id}`,
        date: ticket.dueDate,
        title: `${ticket.code}: ${ticket.title}`,
        tone:
          ticket.status === "blocked"
            ? "danger"
            : ticket.status === "completed"
              ? "success"
              : "navy",
        meta: `${ticket.progress}% выполнено`
      })),
      ...myTasks.map<CalendarEvent>((task) => ({
        id: `task-${task.id}`,
        date: task.dueDate ?? new Date().toISOString(),
        title: task.title,
        tone: task.status === "done" ? "success" : task.status === "in_progress" ? "warning" : "info"
      }))
    ];
  }, [state.tickets, state.tasks, currentUser]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-kmg-ink">Календарь</h1>
        <p className="text-sm text-muted-foreground">
          Ваши задачи и тикеты на ближайшие дни.
        </p>
      </div>
      <CalendarView
        events={events}
        title="Мой календарь"
        description="Дедлайны задач и тикетов адаптации."
      />
    </div>
  );
}
