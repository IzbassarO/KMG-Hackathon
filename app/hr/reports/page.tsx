"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Download,
  Filter,
  HeartHandshake,
  LogIn,
  TrendingUp,
  Users,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart } from "@/components/charts/bar";
import { Donut } from "@/components/charts/donut";
import { Sparkline } from "@/components/charts/sparkline";
import { useStore } from "@/lib/store";
import { COURSES } from "@/lib/courses";
import { formatDateTime } from "@/lib/utils";
import type { TicketStatus } from "@/lib/types";

const MOOD_META: Record<string, { label: string; color: string }> = {
  great: { label: "Супер", color: "bg-emerald-500" },
  good: { label: "Хорошо", color: "bg-sky-500" },
  meh: { label: "Так себе", color: "bg-amber-500" },
  bad: { label: "Сложно", color: "bg-red-500" }
};

const statusColors: Record<TicketStatus, string> = {
  draft: "#94A3B8",
  in_progress: "#003F7D",
  review: "#F39200",
  blocked: "#DC2626",
  completed: "#0E9F6E"
};

const statusLabels: Record<TicketStatus, string> = {
  draft: "Черновики",
  in_progress: "В работе",
  review: "На ревью",
  blocked: "Заблок.",
  completed: "Завершены"
};

export default function HrReportsPage() {
  const { state, helpers } = useStore();

  const statusDistribution = useMemo(() => {
    const buckets: Record<TicketStatus, number> = {
      draft: 0,
      in_progress: 0,
      review: 0,
      blocked: 0,
      completed: 0
    };
    for (const ticket of state.tickets) {
      buckets[ticket.status] += 1;
    }
    return (Object.keys(buckets) as TicketStatus[]).map((status) => ({
      label: statusLabels[status],
      value: buckets[status],
      color: statusColors[status]
    }));
  }, [state.tickets]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const ticket of state.tickets) {
      map.set(ticket.category, (map.get(ticket.category) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [state.tickets]);

  const sparkValues = useMemo(() => {
    const days = 14;
    const result = Array.from({ length: days }, () => Math.floor(Math.random() * 8) + 4);
    result[days - 1] = state.activity.length;
    return result;
  }, [state.activity.length]);

  const overdueRate = useMemo(() => {
    if (state.tickets.length === 0) return 0;
    const overdue = state.tickets.filter(
      (t) =>
        new Date(t.dueDate).getTime() < Date.now() &&
        t.status !== "completed"
    ).length;
    return Math.round((overdue / state.tickets.length) * 100);
  }, [state.tickets]);

  const completionRate = useMemo(() => {
    if (state.tickets.length === 0) return 0;
    const done = state.tickets.filter((t) => t.status === "completed").length;
    return Math.round((done / state.tickets.length) * 100);
  }, [state.tickets]);

  const employeesProgress = useMemo(() => {
    return state.users
      .filter((u) => u.role === "employee")
      .map((emp) => {
        const tickets = state.tickets.filter((t) => t.assigneeId === emp.id);
        const progress = tickets.length
          ? Math.round(tickets.reduce((s, t) => s + t.progress, 0) / tickets.length)
          : 0;
        return { name: emp.fullName, dept: emp.department ?? "—", progress };
      })
      .sort((a, b) => b.progress - a.progress);
  }, [state.users, state.tickets]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
            <BarChart3 className="h-7 w-7 text-kmg-navy" /> Аналитика онбординга
          </h1>
          <p className="text-sm text-muted-foreground">
            Метрики в реальном времени по тикетам, сотрудникам и AI-ассистенту.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4" /> Период · 30 дней
          </Button>
          <Button variant="soft">
            <Download className="h-4 w-4" /> Экспорт CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={TrendingUp}
          label="Завершено тикетов"
          value={`${completionRate}%`}
          delta="+12 п.п."
        />
        <MetricCard
          icon={Clock}
          label="Просрочено / SLA"
          value={`${overdueRate}%`}
          delta="-3 п.п."
          danger={overdueRate > 20}
        />
        <MetricCard
          icon={Users}
          label="Активные сотрудники"
          value={state.users.filter((u) => u.role === "employee").length.toString()}
          delta="+2 за неделю"
        />
        <MetricCard
          icon={Sparkles}
          label="RAG-запросов / неделя"
          value={(state.activity.length * 3).toString()}
          delta="+18%"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Статусы тикетов</CardTitle>
            <CardDescription>Распределение текущих процессов адаптации.</CardDescription>
          </CardHeader>
          <CardContent>
            <Donut
              slices={statusDistribution.filter((s) => s.value > 0)}
              centerLabel="Тикетов"
              centerValue={state.tickets.length.toString()}
            />
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Тикеты по категориям</CardTitle>
            <CardDescription>
              Сравнение нагрузки по доменам онбординга.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={categoryData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Активность за 14 дней</CardTitle>
              <CardDescription>События: тикеты, задачи, RAG-чат.</CardDescription>
            </div>
            <Badge variant="success">Тренд ↑</Badge>
          </CardHeader>
          <CardContent>
            <Sparkline values={sparkValues} width={520} height={120} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Прогресс сотрудников</CardTitle>
            <CardDescription>Топ-сотрудники по среднему прогрессу.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {employeesProgress.map((emp) => (
              <div key={emp.name} className="flex items-center gap-3">
                <div className="w-40 truncate text-sm font-semibold text-kmg-ink">
                  {emp.name}
                </div>
                <Badge variant="secondary" className="hidden md:inline-flex">
                  {emp.dept}
                </Badge>
                <Progress value={emp.progress} className="flex-1" />
                <span className="w-10 text-right text-xs font-semibold text-kmg-navy">
                  {emp.progress}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FeedbackCard />
        <AdaptationMetricsCard />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SLA по тикетам</CardTitle>
          <CardDescription>
            Сводка по дедлайнам — что в зоне риска, что выполняется штатно.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-kmg-mist bg-kmg-paper text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-3">Тикет</th>
                <th className="px-6 py-3">Категория</th>
                <th className="px-6 py-3">Прогресс</th>
                <th className="px-6 py-3">Срок</th>
                <th className="px-6 py-3">Статус</th>
              </tr>
            </thead>
            <tbody>
              {state.tickets.map((ticket) => {
                const overdue =
                  new Date(ticket.dueDate).getTime() < Date.now() &&
                  ticket.status !== "completed";
                return (
                  <tr key={ticket.id} className="border-b border-kmg-mist last:border-0">
                    <td className="px-6 py-3">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">
                        {ticket.code}
                      </div>
                      <div className="text-sm font-semibold text-kmg-ink">{ticket.title}</div>
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant="secondary">{ticket.category}</Badge>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={ticket.progress} className="w-32" />
                        <span className="text-xs font-semibold text-kmg-navy">
                          {ticket.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {new Date(ticket.dueDate).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        variant={
                          ticket.status === "completed"
                            ? "success"
                            : overdue
                              ? "danger"
                              : ticket.status === "blocked"
                                ? "danger"
                                : ticket.status === "review"
                                  ? "warning"
                                  : "navy"
                        }
                      >
                        {overdue && ticket.status !== "completed"
                          ? "Просрочен"
                          : statusLabels[ticket.status]}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function FeedbackCard() {
  const { state, helpers } = useStore();
  const feedback = helpers.feedbackAll();
  const total = feedback.length;
  const userName = (id: string) => state.users.find((u) => u.id === id)?.fullName ?? "Сотрудник";
  const moodCounts = feedback.reduce(
    (acc, f) => {
      if (f.mood) acc[f.mood] = (acc[f.mood] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const withComments = feedback.filter((f) => f.comment).slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartHandshake className="h-4 w-4 text-kmg-gold" /> Фидбэк и пульс
        </CardTitle>
        <CardDescription>Настроение и комментарии сотрудников ({total} ответов).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {total === 0 ? (
          <div className="rounded-xl border border-dashed border-kmg-mist p-6 text-center text-sm text-muted-foreground">
            Пока нет ответов.
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              {Object.entries(MOOD_META).map(([key, meta]) => {
                const count = moodCounts[key] ?? 0;
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-20 text-xs text-muted-foreground">{meta.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-kmg-mist">
                      <div className={`h-full ${meta.color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs font-semibold text-kmg-navy">{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2">
              {withComments.map((f) => (
                <div key={f.id} className="rounded-xl border border-kmg-mist p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-kmg-ink">{userName(f.userId)}</span>
                    <Badge variant={f.kind === "idea" ? "gold" : "secondary"}>
                      {f.kind === "idea" ? "Идея" : "Пульс"}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-sm text-muted-foreground">{f.comment}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AdaptationMetricsCard() {
  const { state, helpers } = useStore();
  const employees = state.users.filter((u) => u.role === "employee");
  const requiredTotal = COURSES.filter((c) => c.category === "Обязательный").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Метрики адаптации</CardTitle>
        <CardDescription>Курсы, вход в систему и риски по сотрудникам.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {employees.map((emp) => {
          const day = helpers.getAdaptationDay(emp.id);
          const requiredDone = COURSES.filter(
            (c) => c.category === "Обязательный" && helpers.isCourseComplete(emp.id, c.id)
          ).length;
          const lastLogin = helpers.lastLogin(emp.id);
          const onTime = helpers.loginOnTimeRate(emp.id);
          const atRisk = day >= 14 && requiredDone < requiredTotal;
          return (
            <div key={emp.id} className="rounded-xl border border-kmg-mist p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-kmg-ink">{emp.fullName}</div>
                {atRisk ? (
                  <Badge variant="danger">
                    <AlertTriangle className="h-3 w-3" /> Риск
                  </Badge>
                ) : (
                  <Badge variant="success">По плану</Badge>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Обязат. курсы:{" "}
                  <span className="font-semibold text-kmg-ink">
                    {requiredDone}/{requiredTotal}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <LogIn className="h-3 w-3" /> Вход:{" "}
                  {lastLogin ? formatDateTime(lastLogin) : "—"}
                </span>
                <span>
                  Пунктуальность:{" "}
                  <span className="font-semibold text-kmg-ink">
                    {onTime === null ? "—" : `${onTime}%`}
                  </span>
                </span>
                <span>День {day}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  delta,
  danger = false
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  delta: string;
  danger?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`grid h-12 w-12 place-items-center rounded-xl text-white shadow-elevated ${
            danger ? "bg-gradient-to-br from-red-500 to-red-400" : "bg-gradient-to-br from-kmg-navy to-kmg-navy-light"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold text-kmg-ink">{value}</div>
          <div className={`text-xs ${danger ? "text-red-600" : "text-emerald-600"}`}>{delta}</div>
        </div>
      </CardContent>
    </Card>
  );
}
