"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  Lock,
  MessageCircleQuestion,
  Play,
  RotateCcw,
  Sparkles,
  Users,
  Wand2,
  Workflow
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BuddyCharacter } from "@/components/buddy/buddy-character";
import { BuddyBubble } from "@/components/buddy/buddy-bubble";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { buddyLineForDay } from "@/lib/buddy";
import {
  EMPLOYEE_STAGES,
  PROBATION_DAYS,
  getDayPlan,
  stageStatus,
  unlockedItems,
  type PlanItem,
  type PlanKind
} from "@/lib/program";

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

const QUICK_DAYS = [1, 2, 14, 30, 90];

export default function EmployeeDashboardPage() {
  const { state, currentUser, helpers } = useStore();

  useEffect(() => {
    if (currentUser?.role === "employee") helpers.ensureOnboardingStart(currentUser.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  if (!currentUser) return null;

  const day = helpers.getAdaptationDay(currentUser.id);
  const plan = getDayPlan(day);
  const override = state.onboarding[currentUser.id]?.dayOverride;
  const isDemo = typeof override === "number";

  const unlocked = unlockedItems(day);
  const doneOverall = unlocked.filter((i) => helpers.isPlanItemDone(currentUser.id, i.id)).length;
  const overallPct = unlocked.length ? Math.round((doneOverall / unlocked.length) * 100) : 0;

  const todayDone = plan.today.filter((i) => helpers.isPlanItemDone(currentUser.id, i.id)).length;
  const todayPct = plan.today.length ? Math.round((todayDone / plan.today.length) * 100) : 100;

  const setDay = (d: number) => helpers.setDemoDay(currentUser.id, Math.min(PROBATION_DAYS, Math.max(1, d)));
  const resetDay = () => helpers.setDemoDay(currentUser.id, null);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* ── Шапка: «Мой день · День N» + day-jumper ─────────────────────────── */}
      <div className="overflow-hidden rounded-3xl border border-kmg-mist shadow-card">
        <div className="gradient-navy relative p-6 text-white md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-widest text-white/70">Мой день</div>
              <h1 className="mt-1 text-3xl font-semibold">
                Привет, {currentUser.fullName.split(" ")[0]} 👋
              </h1>
              <p className="mt-1 text-sm text-white/80">
                День {day} из {PROBATION_DAYS} · этап «{plan.stage.name}» ({plan.stage.tagline})
              </p>
            </div>
            <BuddyCharacter className="h-28 w-24 shrink-0 drop-shadow-xl" mood="wave" />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <HeroStat label="Прогресс адаптации" value={`${overallPct}%`} />
            <HeroStat label="Задач сегодня" value={`${todayDone} / ${plan.today.length}`} />
            <HeroStat label="Событий сегодня" value={`${plan.events.length}`} />
          </div>

          {/* Demo-переключатель дня */}
          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur">
            <span className="px-1 text-[11px] uppercase tracking-widest text-white/60">Демо-день</span>
            <button
              onClick={() => setDay(day - 1)}
              disabled={day <= 1}
              className="grid h-7 w-7 place-items-center rounded-lg bg-white/15 transition hover:bg-white/25 disabled:opacity-40"
              aria-label="Предыдущий день"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[64px] text-center text-sm font-semibold">День {day}</span>
            <button
              onClick={() => setDay(day + 1)}
              disabled={day >= PROBATION_DAYS}
              className="grid h-7 w-7 place-items-center rounded-lg bg-white/15 transition hover:bg-white/25 disabled:opacity-40"
              aria-label="Следующий день"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="mx-1 hidden h-5 w-px bg-white/20 sm:block" />
            {QUICK_DAYS.map((d) => (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition",
                  day === d ? "bg-kmg-gold text-white" : "bg-white/10 hover:bg-white/20"
                )}
              >
                {d}
              </button>
            ))}
            {isDemo && (
              <button
                onClick={resetDay}
                className="ml-auto inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 text-xs transition hover:bg-white/25"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Сегодня
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Структура программы онбординга (4 этапа) ────────────────────────── */}
      <StageRail day={day} />

      {/* ── Digital Buddy: фраза дня ────────────────────────────────────────── */}
      <BuddyBubble eyebrow={`День ${day}`}>
        {buddyLineForDay(day)} Вот что важно сделать сегодня — отметьте выполненное галочкой.
      </BuddyBubble>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* ── Что нужно сделать сегодня ────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-kmg-gold" /> Что сегодня
              </CardTitle>
              <CardDescription>План на день {day}. Открывается по мере адаптации.</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-kmg-navy">{todayPct}%</div>
              <div className="text-[11px] text-muted-foreground">
                {todayDone} из {plan.today.length}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan.today.length > 0 ? (
              <>
                <div className="flex items-center gap-3">
                  <Progress value={todayPct} className="flex-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => helpers.completeToday(currentUser.id, day)}
                  >
                    <Wand2 className="h-4 w-4" /> Выполнить всё (демо)
                  </Button>
                </div>
                {plan.today.map((item) => (
                  <PlanRow
                    key={item.id}
                    item={item}
                    done={helpers.isPlanItemDone(currentUser.id, item.id)}
                    onToggle={() => helpers.togglePlanItem(currentUser.id, item.id)}
                  />
                ))}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-kmg-mist bg-kmg-paper p-6 text-center text-sm text-muted-foreground">
                На сегодня обязательных задач нет 🎉
                <br />
                Отличный день, чтобы повторить материалы или заглянуть в обучение.
              </div>
            )}

            {/* Карточка корпоративной культуры дня */}
            {plan.card && (
              <div className="rounded-2xl border border-kmg-gold/30 bg-kmg-gold/5 p-4">
                <div className="flex items-center justify-between">
                  <Badge variant="gold">
                    <Sparkles className="h-3.5 w-3.5" /> Культура дня
                  </Badge>
                  <span className="text-xs text-muted-foreground">Источник: {plan.card.source}</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-kmg-ink">{plan.card.theme}</div>
                <p className="mt-0.5 text-sm text-muted-foreground">{plan.card.text}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Правая колонка: напоминания + скоро ──────────────────────────── */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-kmg-navy" /> Напоминания
              </CardTitle>
              <CardDescription>События и встречи на сегодня</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.events.length > 0 ? (
                plan.events.map((item) => {
                  const cfg = KIND[item.kind];
                  const Icon = cfg.icon;
                  return (
                    <div key={item.id} className="flex gap-3 rounded-xl border border-kmg-mist p-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-kmg-mist/60 text-kmg-navy">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-kmg-ink">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-kmg-mist p-4 text-sm text-muted-foreground">
                  На сегодня встреч нет. Загляните в{" "}
                  <Link href="/employee/calendar" className="font-medium text-kmg-navy underline">
                    календарь
                  </Link>
                  .
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-kmg-navy" /> Скоро откроется
              </CardTitle>
              <CardDescription>Ближайшие 7 дней маршрута</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {plan.upcoming.length > 0 ? (
                plan.upcoming.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-kmg-mist bg-kmg-paper p-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-kmg-ink/80">{item.title}</div>
                      <div className="text-[11px] text-muted-foreground">{KIND[item.kind].label}</div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      день {item.unlockDay}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-kmg-mist p-4 text-sm text-muted-foreground">
                  Впереди — завершение адаптации. Так держать!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Навигация по маршруту (де-приоритет) ────────────────────────────── */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="text-sm text-muted-foreground">
            Хотите увидеть весь маршрут целиком или полный список задач?
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/employee/journey">
                <Workflow className="h-4 w-4" /> Мой путь
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/employee/tasks">
                <ClipboardCheck className="h-4 w-4" /> Все задачи
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/employee/assistant">
                <MessageCircleQuestion className="h-4 w-4" /> AI-Ассистент
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlanRow({
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
        aria-label={done ? "Отметить невыполненным" : "Отметить выполненным"}
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
          {item.source && (
            <span className="text-[11px] text-muted-foreground">ВНД: {item.source}</span>
          )}
        </div>
        <div className={cn("mt-1 text-sm font-semibold", done ? "text-muted-foreground line-through" : "text-kmg-ink")}>
          {item.title}
        </div>
        <div className="text-xs text-muted-foreground">{item.description}</div>
      </div>
      {item.href && (
        <Button variant={isCourse ? "accent" : "ghost"} size="sm" asChild className="shrink-0">
          <Link href={item.href}>
            {isCourse ? "Открыть курс" : "Перейти"} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
    </div>
  );
}

function StageRail({ day }: { day: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid gap-2 sm:grid-cols-4">
          {EMPLOYEE_STAGES.map((stage, i) => {
            const status = stageStatus(stage, day);
            return (
              <div
                key={stage.id}
                className={cn(
                  "relative rounded-2xl border p-3",
                  status === "current"
                    ? "border-kmg-gold bg-kmg-gold/5"
                    : status === "done"
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-kmg-mist bg-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold",
                      status === "current"
                        ? "bg-kmg-gold text-white"
                        : status === "done"
                          ? "bg-emerald-500 text-white"
                          : "bg-kmg-mist text-kmg-navy"
                    )}
                  >
                    {status === "done" ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  {status === "current" && <Badge variant="gold">сейчас</Badge>}
                </div>
                <div className="mt-2 text-sm font-semibold text-kmg-ink">{stage.name}</div>
                <div className="text-[11px] text-muted-foreground">{stage.tagline}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
      <div className="text-xs uppercase tracking-widest text-white/70">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
