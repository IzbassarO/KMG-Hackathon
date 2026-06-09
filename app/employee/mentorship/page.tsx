"use client";

import {
  CalendarCheck2,
  CheckCircle2,
  Heart,
  MessageCircle,
  Target,
  Trophy
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/lib/store";
import { initials } from "@/lib/utils";

interface Milestone {
  day: 30 | 60 | 90;
  title: string;
  description: string;
  status: "done" | "active" | "pending";
  goals: string[];
}

const milestones: Milestone[] = [
  {
    day: 30,
    title: "30 дней — погружение",
    description: "Изучить продукт, инструменты и культуру команды.",
    status: "done",
    goals: [
      "Пройти все обязательные обучения KMG",
      "Познакомиться с командой и наставником",
      "Настроить рабочее место и доступы",
      "Заполнить план развития 30/60/90"
    ]
  },
  {
    day: 60,
    title: "60 дней — самостоятельность",
    description: "Закрепить навыки и начать выполнять задачи без супервизии.",
    status: "active",
    goals: [
      "Закрыть первый самостоятельный проект",
      "Презентовать результаты на 1:1 с руководителем",
      "Получить обратную связь от 3 коллег",
      "Подключиться к 1 кросс-функциональной инициативе"
    ]
  },
  {
    day: 90,
    title: "90 дней — вклад в результат",
    description: "Сформировать собственные цели и план роста.",
    status: "pending",
    goals: [
      "Согласовать KPI на следующий квартал",
      "Запустить инициативу или улучшение процесса",
      "Завершить менторскую программу",
      "Получить финальный фидбэк HR-куратора"
    ]
  }
];

const checkpoints = [
  { day: 7, label: "Welcome-встреча", status: "done" },
  { day: 14, label: "Закрепление наставника", status: "done" },
  { day: 30, label: "Оценка по 30 дней", status: "done" },
  { day: 45, label: "Промежуточный 1:1", status: "active" },
  { day: 60, label: "Оценка по 60 дней", status: "pending" },
  { day: 90, label: "Финальная оценка", status: "pending" }
];

export default function EmployeeMentorshipPage() {
  const { state, currentUser } = useStore();
  if (!currentUser) return null;
  const mentor =
    state.users.find((u) => u.id === currentUser.managerId) ??
    state.users.find((u) => u.role === "hr");
  const overallProgress = Math.round(
    (milestones.filter((m) => m.status === "done").length / milestones.length) * 100
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
          <Heart className="h-7 w-7 text-kmg-gold" /> Программа менторства 30/60/90
        </h1>
        <p className="text-sm text-muted-foreground">
          Структурированный путь адаптации с тремя ключевыми ступенями.
        </p>
      </div>

      {mentor && (
        <Card>
          <CardHeader>
            <CardTitle>Ваш наставник</CardTitle>
            <CardDescription>
              Связь с ментором — основной канал поддержки во время адаптации.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback>{initials(mentor.fullName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-lg font-semibold text-kmg-ink">{mentor.fullName}</div>
              <div className="text-sm text-muted-foreground">{mentor.position}</div>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge variant="navy">{mentor.department}</Badge>
                <Badge variant="outline">Ответ за 24 часа</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <CalendarCheck2 className="h-4 w-4" /> Запланировать 1:1
              </Button>
              <Button variant="accent">
                <MessageCircle className="h-4 w-4" /> Написать
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Общий прогресс</CardTitle>
          <CardDescription>
            Завершено {overallProgress}% программы менторства.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {milestones.map((m) => (
          <Card
            key={m.day}
            className={`relative overflow-hidden ${
              m.status === "active" ? "border-kmg-gold ring-2 ring-kmg-gold/40" : ""
            }`}
          >
            <div
              className={`absolute right-0 top-0 h-24 w-24 -translate-y-6 translate-x-6 rounded-full opacity-40 ${
                m.status === "done"
                  ? "bg-emerald-200"
                  : m.status === "active"
                    ? "bg-kmg-gold-light"
                    : "bg-kmg-mist"
              }`}
            />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <Badge
                  variant={
                    m.status === "done"
                      ? "success"
                      : m.status === "active"
                        ? "gold"
                        : "outline"
                  }
                >
                  День {m.day}
                </Badge>
                {m.status === "done" && <Trophy className="h-5 w-5 text-emerald-500" />}
                {m.status === "active" && <Target className="h-5 w-5 text-kmg-gold-dark" />}
              </div>
              <CardTitle>{m.title}</CardTitle>
              <CardDescription>{m.description}</CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-2">
              {m.goals.map((goal) => (
                <div key={goal} className="flex items-start gap-2 text-sm">
                  <CheckCircle2
                    className={`mt-0.5 h-4 w-4 ${
                      m.status === "done"
                        ? "text-emerald-500"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span className={m.status === "done" ? "text-muted-foreground line-through" : "text-kmg-ink"}>
                    {goal}
                  </span>
                </div>
              ))}
              <Separator />
              <Button
                variant={m.status === "active" ? "accent" : "outline"}
                size="sm"
                className="w-full"
              >
                {m.status === "done"
                  ? "Посмотреть итоги"
                  : m.status === "active"
                    ? "Обновить статус"
                    : "Заблокировано"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Контрольные точки</CardTitle>
          <CardDescription>
            Встречи и оценки на разных этапах программы.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative ml-4 space-y-4 border-l border-kmg-mist pl-6">
            {checkpoints.map((c) => (
              <div key={c.day} className="relative">
                <span
                  className={`absolute -left-[31px] top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-white ${
                    c.status === "done"
                      ? "bg-emerald-500"
                      : c.status === "active"
                        ? "bg-kmg-gold"
                        : "bg-kmg-mist"
                  }`}
                >
                  {c.status === "done" && <CheckCircle2 className="h-3 w-3 text-white" />}
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      День {c.day}
                    </div>
                    <div className="text-sm font-semibold text-kmg-ink">{c.label}</div>
                  </div>
                  <Badge
                    variant={
                      c.status === "done"
                        ? "success"
                        : c.status === "active"
                          ? "warning"
                          : "outline"
                    }
                  >
                    {c.status === "done"
                      ? "Завершено"
                      : c.status === "active"
                        ? "На этой неделе"
                        : "Ожидается"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
