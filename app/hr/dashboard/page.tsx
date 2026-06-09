"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock4,
  Database,
  GitBranch,
  Sparkles,
  TrendingUp,
  Users
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CreateTicketDialog } from "@/components/shared/create-ticket-dialog";
import { useStore } from "@/lib/store";
import { formatDate, initials } from "@/lib/utils";

export default function HrDashboardPage() {
  const { state, currentUser } = useStore();
  const employees = state.users.filter((u) => u.role === "employee");
  const activeTickets = state.tickets.filter((t) => t.status !== "completed");
  const completed = state.tickets.filter((t) => t.status === "completed");
  const blocked = state.tickets.filter((t) => t.status === "blocked");
  const overdue = state.tickets.filter(
    (t) => new Date(t.dueDate).getTime() < Date.now() && t.status !== "completed"
  );

  const overallProgress = state.tickets.length
    ? Math.round(
        state.tickets.reduce((sum, t) => sum + t.progress, 0) / state.tickets.length
      )
    : 0;

  const recentActivity = state.activity.slice(0, 6);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              Привет, {currentUser?.fullName.split(" ")[0]} 👋
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-kmg-ink">
              Обзор онбординга KMG
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="soft" asChild>
              <Link href="/hr/knowledge">
                <Database className="h-4 w-4" /> База знаний
              </Link>
            </Button>
            <CreateTicketDialog
              trigger={
                <Button variant="accent">
                  <GitBranch className="h-4 w-4" /> Новый тикет
                </Button>
              }
            />
          </div>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Контролируйте все этапы адаптации новых сотрудников: статусы тикетов, SLA, нагрузку
          наставников и активность RAG-ассистента.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Активные сотрудники"
          value={employees.length.toString()}
          delta="+2 за неделю"
          tone="navy"
        />
        <KpiCard
          icon={GitBranch}
          label="Тикетов в работе"
          value={activeTickets.length.toString()}
          delta={`${completed.length} завершено`}
          tone="gold"
        />
        <KpiCard
          icon={Clock4}
          label="Просрочено / заблокировано"
          value={(overdue.length + blocked.length).toString()}
          delta="Требуется внимание"
          tone="danger"
        />
        <KpiCard
          icon={TrendingUp}
          label="Средний прогресс"
          value={`${overallProgress}%`}
          delta="по всем активным тикетам"
          tone="success"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Прогресс по сотрудникам</CardTitle>
              <CardDescription>
                Совокупный прогресс адаптации с разбивкой по тикетам.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/hr/employees">
                Все сотрудники <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {employees.map((emp) => {
              const empTickets = state.tickets.filter((t) => t.assigneeId === emp.id);
              const progress = empTickets.length
                ? Math.round(
                    empTickets.reduce((sum, t) => sum + t.progress, 0) / empTickets.length
                  )
                : 0;
              const done = empTickets.filter((t) => t.status === "completed").length;
              return (
                <div
                  key={emp.id}
                  className="rounded-2xl border border-kmg-mist p-4 transition-colors hover:border-kmg-navy/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{initials(emp.fullName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-kmg-ink">
                            {emp.fullName}
                          </span>
                          <Badge variant="secondary">{emp.department}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {emp.position} · вышел {emp.startDate ? formatDate(emp.startDate) : "—"}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/hr/employees/${emp.id}`}>
                        Открыть <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={progress} className="flex-1" />
                    <span className="w-12 text-right text-xs font-semibold text-kmg-navy">
                      {progress}%
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Тикетов: <strong className="text-kmg-ink">{empTickets.length}</strong>
                    </span>
                    <span>
                      Завершено: <strong className="text-emerald-700">{done}</strong>
                    </span>
                    <span>
                      Заблокировано:{" "}
                      <strong className="text-red-700">
                        {empTickets.filter((t) => t.status === "blocked").length}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-kmg-gold" /> RAG-ассистент
              </CardTitle>
              <CardDescription>Покрытие базы знаний и активность ассистента.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-kmg-mist bg-kmg-mist/40 p-4">
                <div className="text-xs uppercase tracking-widest text-kmg-navy">
                  Индексированных статей
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-kmg-ink">
                    {state.knowledge.length}
                  </span>
                  <span className="text-xs text-emerald-700">+3 за неделю</span>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Покрытие категорий: документы, ИТ, HSE, комплаенс, развитие.
                </div>
              </div>
              <div className="rounded-xl border border-kmg-mist p-4">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Среднее время ответа
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-kmg-ink">1.4с</span>
                  <span className="text-xs text-emerald-700">SLA &lt; 3с</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/hr/assistant">
                  Открыть ассистента <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Активность</CardTitle>
              <CardDescription>Свежие события по тикетам и обучению.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="mt-1 grid h-7 w-7 place-items-center rounded-full bg-kmg-mist text-kmg-navy">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm leading-snug text-kmg-ink">
                      <span className="font-semibold">{event.actorName}</span>{" "}
                      <span className="text-muted-foreground">{event.message}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(event.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  delta,
  tone
}: {
  icon: typeof Users;
  label: string;
  value: string;
  delta: string;
  tone: "navy" | "gold" | "danger" | "success";
}) {
  const toneClasses: Record<typeof tone, string> = {
    navy: "from-kmg-navy to-kmg-navy-light",
    gold: "from-kmg-gold to-kmg-gold-light",
    danger: "from-red-500 to-red-400",
    success: "from-emerald-500 to-emerald-400"
  };
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${toneClasses[tone]} text-white shadow-elevated`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold text-kmg-ink">{value}</div>
          <div className="text-xs text-muted-foreground">{delta}</div>
        </div>
      </CardContent>
    </Card>
  );
}
