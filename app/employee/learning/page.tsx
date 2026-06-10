"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Clock3, Eye, GraduationCap, PlayCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { COURSES, courseSectionCount, type CourseLevel } from "@/lib/courses";
import { getDayPlan } from "@/lib/program";

const levelTone: Record<CourseLevel, string> = {
  Базовый: "bg-emerald-50 text-emerald-700",
  Средний: "bg-amber-50 text-amber-700",
  Продвинутый: "bg-purple-50 text-purple-700"
};

export default function EmployeeLearningPage() {
  const { currentUser, helpers } = useStore();
  const [tab, setTab] = useState("all");
  if (!currentUser) return null;
  const uid = currentUser.id;

  const day = helpers.getAdaptationDay(uid);
  const todayCourseIds = new Set(
    getDayPlan(day)
      .today.map((i) => i.courseId)
      .filter(Boolean) as string[]
  );

  const filtered = COURSES.filter((c) => {
    const status = helpers.getCourseStatus(uid, c.id);
    if (tab === "required") return c.category === "Обязательный";
    if (tab === "recommended") return c.category === "Рекомендуемый";
    if (tab === "in_progress") return status === "in_progress";
    if (tab === "completed") return status === "completed";
    return true;
  });

  const completedCount = COURSES.filter((c) => helpers.isCourseComplete(uid, c.id)).length;
  const requiredCourses = COURSES.filter((c) => c.category === "Обязательный");
  const requiredDone = requiredCourses.filter((c) => helpers.isCourseComplete(uid, c.id)).length;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
          <GraduationCap className="h-7 w-7 text-kmg-navy" /> Обучение и развитие
        </h1>
        <p className="text-sm text-muted-foreground">
          Курсы с материалами, видео и тестами. Прогресс сохраняется автоматически.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Обязательные курсы
            </div>
            <div className="mt-1 text-3xl font-semibold text-kmg-ink">
              {requiredDone}/{requiredCourses.length}
            </div>
            <Progress
              value={requiredCourses.length ? (requiredDone / requiredCourses.length) * 100 : 0}
              className="mt-3"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Завершено всего
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-kmg-ink">{completedCount}</span>
              <span className="text-xs text-muted-foreground">из {COURSES.length}</span>
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
            {filtered.map((course) => {
              const status = helpers.getCourseStatus(uid, course.id);
              const pct = helpers.courseProgressPct(uid, course.id);
              return (
                <Card key={course.id} className="relative flex flex-col overflow-hidden">
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
                    <div className="flex items-center gap-2">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-kmg-navy text-white shadow-elevated">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      {todayCourseIds.has(course.id) && <Badge variant="gold">Сегодня</Badge>}
                    </div>
                    <CardTitle className="mt-3 text-base leading-snug">{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="outline" className="inline-flex items-center gap-1">
                        <Clock3 className="h-3 w-3" /> {course.duration}
                      </Badge>
                      <Badge variant="outline">{courseSectionCount(course)} разделов</Badge>
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
                      <Progress value={pct} className="flex-1" />
                      <span className="text-xs font-semibold text-kmg-navy">{pct}%</span>
                    </div>
                    <Button
                      variant={status === "completed" ? "soft" : "accent"}
                      className="w-full"
                      asChild
                    >
                      <Link href={`/employee/learning/${course.id}`}>
                        {status === "completed" ? (
                          <>
                            <Eye className="h-4 w-4" /> Просмотреть курс
                          </>
                        ) : status === "in_progress" ? (
                          <>
                            <PlayCircle className="h-4 w-4" /> Продолжить
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-4 w-4" /> Начать
                          </>
                        )}
                      </Link>
                    </Button>
                    {status === "completed" && (
                      <div className="flex items-center justify-center gap-1 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Курс завершён
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
