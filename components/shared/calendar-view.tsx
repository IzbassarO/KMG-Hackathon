"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  tone: "navy" | "gold" | "success" | "warning" | "danger" | "info";
  meta?: string;
  /** короткая метка типа (Задача / Курс / Событие …) */
  label?: string;
  done?: boolean;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь"
];

function buildGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { date: Date; muted: boolean }[] = [];
  for (let i = 0; i < startOffset; i++) {
    const d = new Date(year, month, -startOffset + i + 1);
    cells.push({ date: d, muted: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), muted: false });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({
      date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      muted: true
    });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    cells.push({
      date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      muted: true
    });
  }
  return cells;
}

export function CalendarView({
  events,
  title = "Календарь",
  description = "События онбординга на текущий месяц."
}: {
  events: CalendarEvent[];
  title?: string;
  description?: string;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string>(today.toDateString());

  const grid = useMemo(
    () => buildGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor]
  );

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = new Date(event.date).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
  }, [events]);

  const selectedEvents = byDate.get(selected) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[160px] text-center text-sm font-semibold text-kmg-ink">
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="soft"
            size="sm"
            onClick={() => {
              const d = new Date();
              setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
              setSelected(d.toDateString());
            }}
          >
            Сегодня
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {grid.map((cell, idx) => {
              const key = cell.date.toDateString();
              const isToday = key === new Date().toDateString();
              const isSelected = key === selected;
              const dayEvents = byDate.get(key) ?? [];
              const allDone = dayEvents.length > 0 && dayEvents.every((e) => e.done);
              return (
                <button
                  key={idx}
                  onClick={() => setSelected(key)}
                  className={cn(
                    "relative flex h-20 flex-col items-start gap-1 rounded-xl border p-2 text-left text-sm transition-all",
                    cell.muted
                      ? "border-transparent text-muted-foreground/60"
                      : "border-kmg-mist text-kmg-ink hover:border-kmg-navy/40",
                    isSelected && "border-kmg-navy bg-kmg-navy/5",
                    allDone && !isSelected && "border-emerald-200 bg-emerald-50/50",
                    isToday && "ring-2 ring-kmg-gold/60"
                  )}
                >
                  {allDone && (
                    <CheckCircle2 className="absolute right-1 top-1 h-3.5 w-3.5 text-emerald-500" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      isToday && "text-kmg-gold-dark"
                    )}
                  >
                    {cell.date.getDate()}
                  </span>
                  <div className="flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span
                        key={event.id}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          event.tone === "navy" && "bg-kmg-navy",
                          event.tone === "gold" && "bg-kmg-gold",
                          event.tone === "success" && "bg-emerald-500",
                          event.tone === "warning" && "bg-amber-500",
                          event.tone === "danger" && "bg-red-500",
                          event.tone === "info" && "bg-sky-500"
                        )}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-kmg-mist bg-kmg-paper p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            События дня
          </div>
          <div className="mt-1 text-sm font-semibold text-kmg-ink">
            {new Date(selected).toLocaleDateString("ru-RU", {
              day: "2-digit",
              month: "long",
              year: "numeric"
            })}
          </div>
          <div className="mt-3 space-y-2">
            {selectedEvents.length === 0 && (
              <div className="rounded-xl border border-dashed border-kmg-mist bg-white p-4 text-xs text-muted-foreground">
                В этот день событий нет.
              </div>
            )}
            {selectedEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-2 rounded-xl border border-kmg-mist bg-white p-3"
              >
                <Badge variant={event.tone}>{event.label ?? "Событие"}</Badge>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-kmg-ink">
                    {event.done && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
                    <span className={cn(event.done && "text-muted-foreground line-through")}>
                      {event.title}
                    </span>
                  </div>
                  {event.meta && <div className="text-xs text-muted-foreground">{event.meta}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
