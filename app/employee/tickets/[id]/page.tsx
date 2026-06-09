"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, GitBranch, ListChecks } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FlowchartViewer } from "@/components/flowchart/flowchart-viewer";
import { JourneyStrip } from "@/components/flowchart/journey-strip";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default function EmployeeTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, helpers } = useStore();
  const ticket = state.tickets.find((t) => t.id === id);
  if (!ticket && state.hydrated) notFound();
  if (!ticket) return null;
  const tasks = state.tasks.filter((t) => t.ticketId === ticket.id);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/employee/journey">
            <ArrowLeft className="h-4 w-4" /> Мой путь
          </Link>
        </Button>
        <span className="rounded bg-kmg-mist px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-kmg-navy">
          {ticket.code}
        </span>
      </div>

      <Card>
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold text-kmg-ink">{ticket.title}</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{ticket.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ticket.badges.map((b, i) => (
                <Badge key={i} variant={b.tone as never}>
                  {b.label}
                </Badge>
              ))}
              <Badge variant="navy">{ticket.category}</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={ticket.progress} className="flex-1" />
              <span className="w-12 text-right text-sm font-semibold text-kmg-navy">
                {ticket.progress}%
              </span>
            </div>
            <JourneyStrip flow={ticket.flow} />
          </div>
          <div className="space-y-3 rounded-2xl border border-kmg-mist bg-kmg-paper p-5 text-sm text-kmg-ink">
            <Meta icon={CalendarDays} label="Дедлайн" value={formatDate(ticket.dueDate)} />
            <Meta icon={GitBranch} label="Шагов" value={String(ticket.flow.nodes.length)} />
            <Meta
              icon={ListChecks}
              label="Задач"
              value={`${tasks.filter((t) => t.status === "done").length} / ${tasks.length}`}
            />
            <Button variant="accent" className="w-full">
              Загрузить документ
            </Button>
          </div>
        </CardContent>
      </Card>

      <FlowchartViewer flow={ticket.flow} />

      <Card>
        <CardHeader>
          <CardTitle>Мои действия</CardTitle>
          <CardDescription>
            Задачи, где вы — исполнитель. Завершайте по мере прохождения шагов.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-kmg-mist">
          {tasks.map((task) => {
            const node = ticket.flow.nodes.find((n) => n.id === task.nodeId);
            const isForEmployee = node?.assigneeRole !== "hr";
            return (
              <div key={task.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-kmg-ink">{task.title}</div>
                  <div className="text-xs text-muted-foreground">{task.description}</div>
                </div>
                <Badge
                  variant={
                    task.status === "done"
                      ? "success"
                      : task.status === "in_progress"
                        ? "warning"
                        : "outline"
                  }
                >
                  {task.status === "done"
                    ? "Готово"
                    : task.status === "in_progress"
                      ? "В работе"
                      : "Ожидает"}
                </Badge>
                {isForEmployee ? (
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => helpers.advanceTask(task.id, "done")}
                  >
                    Я выполнил
                  </Button>
                ) : (
                  <Badge variant="info">На стороне HR</Badge>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-kmg-navy text-white">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold text-kmg-ink">{value}</div>
      </div>
    </div>
  );
}
