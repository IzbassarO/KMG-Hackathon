"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Compass,
  GraduationCap,
  Sparkles,
  Target
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TicketCard } from "@/components/shared/ticket-card";
import { JourneyStrip } from "@/components/flowchart/journey-strip";
import { useStore } from "@/lib/store";
import { formatDate, percent } from "@/lib/utils";

export default function EmployeeDashboardPage() {
  const { state, currentUser } = useStore();
  if (!currentUser) return null;
  const tickets = state.tickets.filter((t) => t.assigneeId === currentUser.id);
  const allTasks = state.tasks.filter((t) => tickets.some((tk) => tk.id === t.ticketId));
  const doneTasks = allTasks.filter((t) => t.status === "done").length;
  const upcomingTasks = allTasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime())
    .slice(0, 5);

  const highlighted = tickets.find((t) => t.status === "in_progress") ?? tickets[0];
  const overall = tickets.length
    ? Math.round(tickets.reduce((sum, t) => sum + t.progress, 0) / tickets.length)
    : 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="rounded-3xl border border-kmg-mist bg-white shadow-card">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="gradient-navy p-8 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-white/70">
                  Добро пожаловать
                </div>
                <h1 className="mt-1 text-3xl font-semibold">
                  Привет, {currentUser.fullName.split(" ")[0]} 👋
                </h1>
                <p className="mt-1 text-sm text-white/80">
                  {currentUser.position} · {currentUser.department}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 text-right text-sm text-white/80">
                <Badge variant="gold">
                  <Sparkles className="h-3.5 w-3.5" /> День {daysSince(currentUser.startDate)}
                </Badge>
                <span>Старт: {currentUser.startDate ? formatDate(currentUser.startDate) : "—"}</span>
              </div>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <DashStat label="Прогресс" value={`${overall}%`} icon={Target} />
              <DashStat
                label="Задач выполнено"
                value={`${doneTasks} / ${allTasks.length}`}
                icon={CheckCircle2}
              />
              <DashStat
                label="Дней до полной адаптации"
                value={`${Math.max(0, 30 - daysSince(currentUser.startDate))}`}
                icon={CalendarClock}
              />
            </div>
          </div>
        </div>
      </div>

      {highlighted && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-kmg-navy" /> Текущий этап
              </CardTitle>
              <CardDescription>
                {highlighted.title} · цель — {formatDate(highlighted.dueDate)}
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/employee/tickets/${highlighted.id}`}>
                Открыть тикет <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Progress value={highlighted.progress} className="flex-1" />
              <span className="w-12 text-right text-sm font-semibold text-kmg-navy">
                {highlighted.progress}%
              </span>
            </div>
            <JourneyStrip flow={highlighted.flow} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Мои тикеты</CardTitle>
            <CardDescription>
              Каждый тикет — отдельный процесс адаптации с задачами и ответственными.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} context="employee" />
            ))}
          </CardContent>
        </Card>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-kmg-navy" /> Ближайшие задачи
              </CardTitle>
              <CardDescription>
                Топ-5 задач по срокам. Полный список — в разделе «Задачи».
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingTasks.length === 0 && (
                <div className="rounded-xl border border-dashed border-kmg-mist p-4 text-sm text-muted-foreground">
                  Все задачи выполнены 🎉
                </div>
              )}
              {upcomingTasks.map((task) => {
                const ticket = tickets.find((t) => t.id === task.ticketId);
                return (
                  <div key={task.id} className="rounded-xl border border-kmg-mist p-3">
                    <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                      <span>{ticket?.code}</span>
                      <span>
                        {task.status === "in_progress" ? "В работе" : "Ожидает"}
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-kmg-ink">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-muted-foreground">{task.description}</div>
                    )}
                    <div className="mt-2 text-xs text-muted-foreground">
                      до {task.dueDate ? formatDate(task.dueDate) : "—"}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-kmg-navy" /> Обучение
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  title: "Курс «Безопасность производства»",
                  status: "Готово",
                  tone: "success"
                },
                {
                  title: "Тест «Антикоррупционная политика»",
                  status: "В процессе",
                  tone: "warning"
                },
                {
                  title: "Тренинг «Цифровая этика»",
                  status: "Ожидает",
                  tone: "info"
                }
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-xl border border-kmg-mist p-3 text-sm"
                >
                  <span>{item.title}</span>
                  <Badge variant={item.tone as never}>{item.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DashStat({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string;
  icon: typeof Target;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-kmg-gold text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-white/70">{label}</div>
          <div className="text-lg font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function daysSince(date?: string) {
  if (!date) return 0;
  const diff = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
