"use client";

import { useEffect, useMemo } from "react";
import { CalendarView, type CalendarEvent } from "@/components/shared/calendar-view";
import { useStore } from "@/lib/store";
import { COMPANY_TIPS } from "@/lib/buddy";
import { PROBATION_DAYS, getDayPlan, getStageForDay, type PlanKind } from "@/lib/program";

const KIND_CAL: Record<PlanKind, { tone: CalendarEvent["tone"]; label: string }> = {
  video: { tone: "gold", label: "Видео" },
  task: { tone: "navy", label: "Задача" },
  course: { tone: "info", label: "Курс" },
  survey: { tone: "warning", label: "Опрос" },
  meeting: { tone: "navy", label: "Встреча" },
  event: { tone: "success", label: "Событие" }
};

export default function EmployeeCalendarPage() {
  const { state, currentUser, helpers } = useStore();

  useEffect(() => {
    if (currentUser?.role === "employee") helpers.ensureOnboardingStart(currentUser.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const events = useMemo<CalendarEvent[]>(() => {
    if (!currentUser) return [];
    // Текущий (демо-)день привязываем к сегодняшней дате: выбран День 30 — значит
    // сегодня = День 30, а Дни 1..29 уходят в прошлое и отмечаются как пройденные.
    const currentDay = helpers.getAdaptationDay(currentUser.id);
    const today = new Date();
    const list: CalendarEvent[] = [];

    for (let d = 1; d <= PROBATION_DAYS; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + (d - currentDay));
      const iso = date.toISOString();
      const plan = getDayPlan(d);
      const dayDone = d < currentDay ? true : helpers.isDayComplete(currentUser.id, d);
      let count = 0;

      for (const item of plan.today) {
        const cfg = KIND_CAL[item.kind];
        list.push({
          id: `d${d}-${item.id}`,
          date: iso,
          title: item.title,
          tone: cfg.tone,
          label: cfg.label,
          done: dayDone || helpers.isPlanItemDone(currentUser.id, item.id)
        });
        count++;
      }
      for (const ev of plan.events) {
        const cfg = KIND_CAL[ev.kind];
        list.push({
          id: `d${d}-${ev.id}`,
          date: iso,
          title: ev.title,
          tone: cfg.tone,
          label: cfg.label,
          meta: ev.description,
          done: dayDone
        });
        count++;
      }
      if (plan.card) {
        list.push({
          id: `d${d}-card`,
          date: iso,
          title: `Культура: ${plan.card.theme}`,
          tone: "gold",
          label: "Культура",
          meta: `Источник: ${plan.card.source}`,
          done: dayDone
        });
        count++;
      }
      // Ни один день адаптации не пустой — добавляем короткую сводку дня.
      if (count === 0) {
        const stage = getStageForDay(d);
        list.push({
          id: `d${d}-summary`,
          date: iso,
          title: `Рабочий день · этап «${stage.name}»`,
          tone: "info",
          label: `День ${d}`,
          meta: COMPANY_TIPS[(d - 1) % COMPANY_TIPS.length],
          done: dayDone
        });
      }
    }

    // Подтверждённые встречи 1:1 — на реальную дату.
    for (const m of helpers.acceptedMeetings(currentUser.id)) {
      if (!m.scheduledAt) continue;
      list.push({
        id: `meeting-${m.id}`,
        date: m.scheduledAt,
        title: `Встреча 1:1: ${m.topic}`,
        tone: "navy",
        label: "Встреча",
        meta: "Подтверждено наставником"
      });
    }
    return list;
  }, [currentUser, state.onboarding, state.meetingRequests, helpers]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-kmg-ink">Календарь адаптации</h1>
        <p className="text-sm text-muted-foreground">
          Каждый день онбординга — со своим планом: задачи, карточка культуры, встречи и события.
          Выполненные дни отмечены галочкой.
        </p>
      </div>
      <CalendarView
        events={events}
        title="Мой календарь"
        description="План адаптации по дням — от первого дня до завершения испытательного срока."
      />
    </div>
  );
}
