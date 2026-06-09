"use client";

import { useState } from "react";
import {
  Award,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Lock,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  description: string;
  category: "Обязательный" | "Рекомендуемый" | "Бонус";
  duration: string;
  modules: number;
  level: "Базовый" | "Средний" | "Продвинутый";
  progress: number;
  status: "completed" | "in_progress" | "available" | "locked";
  tags: string[];
}

const courses: Course[] = [
  {
    id: "c1",
    title: "Безопасность на производстве (HSE)",
    description: "Базовый курс по охране труда KMG, обязателен для всех сотрудников.",
    category: "Обязательный",
    duration: "2 ч",
    modules: 5,
    level: "Базовый",
    progress: 100,
    status: "completed",
    tags: ["HSE", "safety"]
  },
  {
    id: "c2",
    title: "Антикоррупционная политика",
    description: "Кодекс деловой этики и политика антикоррупции KMG.",
    category: "Обязательный",
    duration: "45 мин",
    modules: 3,
    level: "Базовый",
    progress: 65,
    status: "in_progress",
    tags: ["compliance"]
  },
  {
    id: "c3",
    title: "Цифровая этика и AI",
    description: "Что можно и нельзя загружать в корпоративный AI-ассистент.",
    category: "Обязательный",
    duration: "1 ч",
    modules: 4,
    level: "Базовый",
    progress: 0,
    status: "available",
    tags: ["ai", "ethics"]
  },
  {
    id: "c4",
    title: "Основы GIS-систем KMG",
    description: "Знакомство с геоинформационными системами для геологов и инженеров.",
    category: "Рекомендуемый",
    duration: "4 ч",
    modules: 8,
    level: "Средний",
    progress: 30,
    status: "in_progress",
    tags: ["gis", "engineering"]
  },
  {
    id: "c5",
    title: "Продуктовая стратегия KMG 2030",
    description: "Видение, ключевые проекты и направления развития группы.",
    category: "Рекомендуемый",
    duration: "1.5 ч",
    modules: 6,
    level: "Базовый",
    progress: 0,
    status: "available",
    tags: ["strategy", "culture"]
  },
  {
    id: "c6",
    title: "Продвинутая аналитика для бизнеса",
    description: "Углубленный курс по работе с BI и аналитическими дашбордами.",
    category: "Бонус",
    duration: "8 ч",
    modules: 12,
    level: "Продвинутый",
    progress: 0,
    status: "locked",
    tags: ["analytics", "bi"]
  }
];

const achievements = [
  { id: "a1", title: "Первый день пройден", icon: Sparkles, earned: true, tone: "gold" },
  { id: "a2", title: "10 задач завершено", icon: Zap, earned: true, tone: "info" },
  { id: "a3", title: "HSE-сертификат", icon: ShieldCheck, earned: true, tone: "success" },
  { id: "a4", title: "5 чатов с AI", icon: Sparkles, earned: true, tone: "navy" },
  { id: "a5", title: "30 дней в KMG", icon: Trophy, earned: false, tone: "outline" },
  { id: "a6", title: "Все курсы пройдены", icon: BadgeCheck, earned: false, tone: "outline" }
];

const levelTone: Record<Course["level"], string> = {
  Базовый: "bg-emerald-50 text-emerald-700",
  Средний: "bg-amber-50 text-amber-700",
  Продвинутый: "bg-purple-50 text-purple-700"
};

export default function EmployeeLearningPage() {
  const [tab, setTab] = useState("all");
  const filtered = courses.filter((c) => {
    if (tab === "all") return true;
    if (tab === "required") return c.category === "Обязательный";
    if (tab === "recommended") return c.category === "Рекомендуемый";
    if (tab === "in_progress") return c.status === "in_progress";
    if (tab === "completed") return c.status === "completed";
    return true;
  });

  const completedCount = courses.filter((c) => c.status === "completed").length;
  const totalRequired = courses.filter((c) => c.category === "Обязательный").length;
  const doneRequired = courses.filter(
    (c) => c.category === "Обязательный" && c.status === "completed"
  ).length;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
            <GraduationCap className="h-7 w-7 text-kmg-navy" /> Обучение и развитие
          </h1>
          <p className="text-sm text-muted-foreground">
            Курсы, тренинги и сертификации для роста в KMG.
          </p>
        </div>
        <Button variant="outline">
          <Award className="h-4 w-4" /> Мои сертификаты
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Обязательные курсы
            </div>
            <div className="mt-1 text-3xl font-semibold text-kmg-ink">
              {doneRequired}/{totalRequired}
            </div>
            <Progress value={(doneRequired / totalRequired) * 100} className="mt-3" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Завершено всего
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-kmg-ink">{completedCount}</span>
              <span className="text-xs text-muted-foreground">из {courses.length}</span>
            </div>
            <div className="mt-2 text-xs text-emerald-600">+1 за неделю</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Достижений
            </div>
            <div className="mt-1 text-3xl font-semibold text-kmg-ink">
              {achievements.filter((a) => a.earned).length}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {achievements
                .filter((a) => a.earned)
                .slice(0, 3)
                .map((a) => {
                  const Icon = a.icon;
                  return (
                    <span
                      key={a.id}
                      className="grid h-6 w-6 place-items-center rounded-full bg-kmg-gold text-white"
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">Все курсы</TabsTrigger>
          <TabsTrigger value="required">Обязательные</TabsTrigger>
          <TabsTrigger value="recommended">Рекомендуемые</TabsTrigger>
          <TabsTrigger value="in_progress">В процессе</TabsTrigger>
          <TabsTrigger value="completed">Завершённые</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((course) => (
              <Card
                key={course.id}
                className={cn(
                  "relative flex flex-col overflow-hidden transition-all",
                  course.status === "locked" && "opacity-60"
                )}
              >
                <div
                  className={cn(
                    "absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    course.category === "Обязательный" && "bg-red-50 text-red-700",
                    course.category === "Рекомендуемый" && "bg-kmg-navy/10 text-kmg-navy",
                    course.category === "Бонус" && "bg-kmg-gold/15 text-kmg-gold-dark"
                  )}
                >
                  {course.category}
                </div>
                <CardHeader>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-kmg-navy text-white shadow-elevated">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <CardTitle className="mt-3 text-base leading-snug">
                    {course.title}
                  </CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="inline-flex items-center gap-1">
                      <Clock3 className="h-3 w-3" /> {course.duration}
                    </Badge>
                    <Badge variant="outline">{course.modules} модулей</Badge>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        levelTone[course.level]
                      )}
                    >
                      {course.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={course.progress} className="flex-1" />
                    <span className="text-xs font-semibold text-kmg-navy">
                      {course.progress}%
                    </span>
                  </div>
                  <Button
                    variant={course.status === "completed" ? "soft" : "accent"}
                    className="w-full"
                    disabled={course.status === "locked"}
                  >
                    {course.status === "completed" && (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Повторить
                      </>
                    )}
                    {course.status === "in_progress" && (
                      <>
                        <PlayCircle className="h-4 w-4" /> Продолжить
                      </>
                    )}
                    {course.status === "available" && (
                      <>
                        <PlayCircle className="h-4 w-4" /> Начать
                      </>
                    )}
                    {course.status === "locked" && (
                      <>
                        <Lock className="h-4 w-4" /> Доступ после 30 дней
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-kmg-gold" /> Достижения
          </CardTitle>
          <CardDescription>Получены за прохождение этапов адаптации.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {achievements.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.id}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all",
                  a.earned
                    ? "border-kmg-mist bg-white"
                    : "border-dashed border-kmg-mist bg-kmg-paper opacity-60"
                )}
              >
                <div
                  className={cn(
                    "grid h-12 w-12 place-items-center rounded-full text-white shadow-elevated",
                    a.tone === "gold" && "bg-kmg-gold",
                    a.tone === "info" && "bg-sky-500",
                    a.tone === "success" && "bg-emerald-500",
                    a.tone === "navy" && "bg-kmg-navy",
                    a.tone === "outline" && "bg-kmg-mist text-kmg-navy"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-xs font-semibold text-kmg-ink">{a.title}</div>
                {!a.earned && (
                  <Badge variant="outline" className="text-[10px]">
                    Скоро
                  </Badge>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
