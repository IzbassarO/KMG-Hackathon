"use client";

import { CheckCircle2, GraduationCap, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStore } from "@/lib/store";
import { initials } from "@/lib/utils";
import { COURSES, getCourse } from "@/lib/courses";

export default function HrLearningPage() {
  const { state, helpers } = useStore();
  const employees = state.users.filter((u) => u.role === "employee");
  const requiredTotal = COURSES.filter((c) => c.category === "Обязательный").length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
          <GraduationCap className="h-7 w-7 text-kmg-navy" /> Обучение сотрудников
        </h1>
        <p className="text-sm text-muted-foreground">
          Прогресс прохождения курсов адаптации по каждому сотруднику.
        </p>
      </div>

      <div className="grid gap-4">
        {employees.map((emp) => {
          const completed = helpers.coursesCompletedBy(emp.id);
          const completedIds = new Set(completed.map((c) => c.courseId));
          const requiredDone = COURSES.filter(
            (c) => c.category === "Обязательный" && completedIds.has(c.id)
          ).length;
          const pct = COURSES.length ? Math.round((completed.length / COURSES.length) * 100) : 0;
          const inProgress = COURSES.filter(
            (c) => helpers.getCourseStatus(emp.id, c.id) === "in_progress"
          );

          return (
            <Card key={emp.id}>
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <Avatar>
                  <AvatarFallback>{initials(emp.fullName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-base">{emp.fullName}</CardTitle>
                  <CardDescription>
                    {emp.position} · {emp.department}
                  </CardDescription>
                </div>
                <Badge variant={requiredDone === requiredTotal ? "success" : "warning"}>
                  Обязательные: {requiredDone}/{requiredTotal}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Progress value={pct} className="flex-1" />
                  <span className="text-xs font-semibold text-kmg-navy">
                    {completed.length}/{COURSES.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {completed.length === 0 && inProgress.length === 0 && (
                    <span className="text-xs text-muted-foreground">Ещё не приступал к курсам.</span>
                  )}
                  {completed.map((c) => (
                    <Badge key={c.courseId} variant="success">
                      <CheckCircle2 className="h-3 w-3" /> {getCourse(c.courseId)?.title ?? c.courseId}
                    </Badge>
                  ))}
                  {inProgress.map((c) => (
                    <Badge key={c.id} variant="outline">
                      <Loader2 className="h-3 w-3" /> {c.title}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
