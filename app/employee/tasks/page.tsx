"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardCheck,
  ClipboardList,
  Clock,
  GraduationCap,
  ListTodo,
  Play,
  Sparkles,
  Users,
  Wand2,
  Workflow
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { cn, formatDateTime } from "@/lib/utils";
import { getDayPlan, getPlanItem, type PlanItem, type PlanKind } from "@/lib/program";

const KIND: Record<
  PlanKind,
  { icon: typeof Play; label: string; tone: "navy" | "gold" | "success" | "warning" | "info" | "secondary" }
> = {
  video: { icon: Play, label: "Видео", tone: "gold" },
  task: { icon: ClipboardCheck, label: "Задача", tone: "navy" },
  course: { icon: GraduationCap, label: "Курс", tone: "info" },
  survey: { icon: ClipboardList, label: "Опрос", tone: "warning" },
  meeting: { icon: Users, label: "Встреча", tone: "secondary" },
  event: { icon: CalendarDays, label: "Событие", tone: "success" }
};

export default function EmployeeTasksPage() {
  const { currentUser, helpers } = useStore();
  const [tab, setTab] = useState("today");
  if (!currentUser) return null;

  const uid = currentUser.id;
  const day = helpers.getAdaptationDay(uid);
  const today = getDayPlan(day).today;
  const doneToday = today.filter((i) => helpers.isPlanItemDone(uid, i.id)).length;
  const pct = today.length ? Math.round((doneToday / today.length) * 100) : 100;

  const completions = helpers.getCompletions(uid);
  const doneByDay = new Map<number, { item: PlanItem; at: string }[]>();
  for (const [id, c] of Object.entries(completions)) {
    const item = getPlanItem(id);
    if (!item) continue;
    const arr = doneByDay.get(item.unlockDay) ?? [];
    arr.push({ item, at: c.at });
    doneByDay.set(item.unlockDay, arr);
  }
  const doneDays = [...doneByDay.keys()].sort((a, b) => a - b);
  const doneTotal = [...doneByDay.values()].reduce((s, a) => s + a.length, 0);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
            <ListTodo className="h-7 w-7 text-kmg-navy" /> Мои задачи
          </h1>
          <p className="text-sm text-muted-foreground">
            Задачи открываются по дням адаптации. Сегодня — День {day}.
          </p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/employee/journey">
            <Workflow className="h-4 w-4" /> Маршрут (Мой путь)
          </Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="today">
            Сегодня{" "}
            <Badge variant="warning" className="ml-2">
              {today.length - doneToday}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="done">
            Готово{" "}
            <Badge variant="success" className="ml-2">
              {doneTotal}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-kmg-gold" /> Задачи на сегодня
                </CardTitle>
                <CardDescription>
                  Выполняйте по порядку — каждая открывает следующую.
                </CardDescription>
              </div>
              {today.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => helpers.completeToday(uid, day)}>
                  <Wand2 className="h-4 w-4" /> Выполнить всё (демо)
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {today.length > 0 ? (
                <>
                  <div className="flex items-center gap-3">
                    <Progress value={pct} className="flex-1" />
                    <span className="text-sm font-semibold text-kmg-navy">
                      {doneToday}/{today.length}
                    </span>
                  </div>
                  {today.map((item) => (
                    <TaskRow
                      key={item.id}
                      item={item}
                      done={helpers.isPlanItemDone(uid, item.id)}
                      onToggle={() => helpers.togglePlanItem(uid, item.id)}
                    />
                  ))}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-kmg-mist bg-kmg-paper p-6 text-center text-sm text-muted-foreground">
                  На сегодня обязательных задач нет 🎉 Загляните в{" "}
                  <Link href="/employee/learning" className="font-medium text-kmg-navy underline">
                    обучение
                  </Link>
                  .
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="done">
          {doneDays.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Пока ничего не завершено. Начните с задач на сегодня.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {doneDays.map((d) => (
                <Card key={d}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Badge variant="navy">День {d}</Badge>
                      <span className="text-sm font-normal text-muted-foreground">
                        {doneByDay.get(d)!.length} задач завершено
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-kmg-mist">
                    {doneByDay
                      .get(d)!
                      .sort((a, b) => a.at.localeCompare(b.at))
                      .map(({ item, at }) => {
                        const cfg = KIND[item.kind];
                        const Icon = cfg.icon;
                        return (
                          <div key={item.id} className="flex items-center gap-3 py-2.5">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                              <Check className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={cfg.tone}>
                                  <Icon className="h-3 w-3" /> {cfg.label}
                                </Badge>
                                <span className="truncate text-sm font-medium text-kmg-ink">
                                  {item.title}
                                </span>
                              </div>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" /> {formatDateTime(at)}
                            </span>
                          </div>
                        );
                      })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TaskRow({
  item,
  done,
  onToggle
}: {
  item: PlanItem;
  done: boolean;
  onToggle: () => void;
}) {
  const cfg = KIND[item.kind];
  const Icon = cfg.icon;
  const isCourse = item.kind === "course" && Boolean(item.href);
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-3 transition",
        done ? "border-emerald-200 bg-emerald-50/60" : "border-kmg-mist bg-white"
      )}
    >
      <button
        onClick={onToggle}
        aria-label={done ? "Снять отметку" : "Отметить выполненной"}
        title={done ? "Снять отметку" : "Отметить выполненной после выполнения"}
        className={cn(
          "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition",
          done
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-kmg-mist text-transparent hover:border-kmg-navy"
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={cfg.tone}>
            <Icon className="h-3 w-3" /> {cfg.label}
          </Badge>
          {item.priority === "high" && <Badge variant="danger">Важно</Badge>}
          {item.source && <span className="text-[11px] text-muted-foreground">ВНД: {item.source}</span>}
        </div>
        <div className={cn("mt-1 text-sm font-semibold", done ? "text-muted-foreground line-through" : "text-kmg-ink")}>
          {item.title}
        </div>
        <div className="text-xs text-muted-foreground">{item.description}</div>
      </div>
      {!done && item.href && (
        <Button variant="accent" size="sm" asChild className="shrink-0">
          <Link href={item.href}>
            {isCourse ? "Открыть курс" : "Перейти"} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
    </div>
  );
}
