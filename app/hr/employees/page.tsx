"use client";

import Link from "next/link";
import { ArrowUpRight, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStore } from "@/lib/store";
import { formatDate, initials } from "@/lib/utils";

export default function HrEmployeesPage() {
  const { state } = useStore();
  const employees = state.users.filter((u) => u.role === "employee");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-kmg-ink">
            Сотрудники в онбординге
          </h1>
          <p className="text-sm text-muted-foreground">
            Управляйте новыми сотрудниками, их прогрессом и наставниками.
          </p>
        </div>
        <Button variant="accent">
          <UserPlus className="h-4 w-4" /> Пригласить сотрудника
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Активные сотрудники</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-kmg-mist bg-kmg-paper text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-6 py-3">Сотрудник</th>
                <th className="px-6 py-3">Подразделение</th>
                <th className="px-6 py-3">Тикетов</th>
                <th className="px-6 py-3">Прогресс</th>
                <th className="px-6 py-3">Старт</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const empTickets = state.tickets.filter((t) => t.assigneeId === emp.id);
                const progress = empTickets.length
                  ? Math.round(
                      empTickets.reduce((sum, t) => sum + t.progress, 0) / empTickets.length
                    )
                  : 0;
                return (
                  <tr key={emp.id} className="border-b border-kmg-mist last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{initials(emp.fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-kmg-ink">{emp.fullName}</div>
                          <div className="text-xs text-muted-foreground">{emp.position}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">{emp.department}</Badge>
                    </td>
                    <td className="px-6 py-4 font-medium text-kmg-ink">
                      {empTickets.length}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="w-32" />
                        <span className="text-xs font-semibold text-kmg-navy">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {emp.startDate ? formatDate(emp.startDate) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/hr/employees/${emp.id}`}>
                          Открыть <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
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
