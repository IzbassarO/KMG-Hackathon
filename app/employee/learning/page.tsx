"use client";

import { GraduationCap, PlayCircle, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const courses = [
  {
    title: "Безопасность на производстве",
    description: "Обязательный курс по охране труда KMG. 5 модулей + финальный тест.",
    progress: 100,
    duration: "2 ч",
    status: "Завершено"
  },
  {
    title: "Антикоррупционная политика",
    description: "Кодекс деловой этики и политика антикоррупции.",
    progress: 65,
    duration: "45 мин",
    status: "В процессе"
  },
  {
    title: "Цифровая этика и AI",
    description: "Что можно и нельзя загружать в корпоративный AI-ассистент.",
    progress: 0,
    duration: "1 ч",
    status: "К прохождению"
  }
];

const achievements = [
  { label: "Первая неделя пройдена", date: "5 дней назад" },
  { label: "10 задач завершено", date: "2 дня назад" },
  { label: "Первый чат с AI", date: "1 день назад" }
];

export default function EmployeeLearningPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
          <GraduationCap className="h-7 w-7 text-kmg-navy" /> Обучение
        </h1>
        <p className="text-sm text-muted-foreground">
          Курсы и тренинги, обязательные для прохождения в рамках адаптации.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((course) => (
          <Card key={course.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge
                  variant={
                    course.progress === 100
                      ? "success"
                      : course.progress > 0
                        ? "warning"
                        : "info"
                  }
                >
                  {course.status}
                </Badge>
                <span className="text-xs text-muted-foreground">{course.duration}</span>
              </div>
              <CardTitle>{course.title}</CardTitle>
              <CardDescription>{course.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Progress value={course.progress} className="flex-1" />
                <span className="text-xs font-semibold text-kmg-navy">{course.progress}%</span>
              </div>
              <Button variant="accent" className="w-full">
                <PlayCircle className="h-4 w-4" />
                {course.progress === 100
                  ? "Повторить тест"
                  : course.progress > 0
                    ? "Продолжить"
                    : "Начать"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-kmg-gold" /> Достижения
          </CardTitle>
          <CardDescription>Каждое достижение — шаг к полной адаптации.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {achievements.map((a) => (
            <div
              key={a.label}
              className="rounded-2xl border border-kmg-mist bg-kmg-paper p-4"
            >
              <div className="text-sm font-semibold text-kmg-ink">{a.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{a.date}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
