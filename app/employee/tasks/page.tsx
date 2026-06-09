"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Filter, ListTodo } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default function EmployeeTasksPage() {
  const { state, currentUser, helpers } = useStore();
  if (!currentUser) return null;
  const tickets = state.tickets.filter((t) => t.assigneeId === currentUser.id);
  const tasks = state.tasks.filter((t) => tickets.some((tk) => tk.id === t.ticketId));

  const buckets = useMemo(
    () => ({
      pending: tasks.filter((t) => t.status === "pending"),
      in_progress: tasks.filter((t) => t.status === "in_progress"),
      done: tasks.filter((t) => t.status === "done")
    }),
    [tasks]
  );

  const [tab, setTab] = useState("pending");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
            <ListTodo className="h-7 w-7 text-kmg-navy" /> Мои задачи
          </h1>
          <p className="text-sm text-muted-foreground">
            Чек-лист всех задач из ваших тикетов онбординга.
          </p>
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4" /> Фильтры
        </Button>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Ожидают <Badge variant="outline" className="ml-2">{buckets.pending.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            В работе <Badge variant="warning" className="ml-2">{buckets.in_progress.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="done">
            Готовы <Badge variant="success" className="ml-2">{buckets.done.length}</Badge>
          </TabsTrigger>
        </TabsList>
        {(Object.keys(buckets) as Array<keyof typeof buckets>).map((key) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {key === "pending"
                    ? "Что ещё предстоит"
                    : key === "in_progress"
                      ? "Что в работе"
                      : "Готовые задачи"}
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-kmg-mist">
                {buckets[key].map((task) => {
                  const ticket = tickets.find((t) => t.id === task.ticketId);
                  return (
                    <div key={task.id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                          <span>{ticket?.code}</span>
                          <span>{ticket?.category}</span>
                        </div>
                        <div className="mt-1 text-sm font-semibold text-kmg-ink">{task.title}</div>
                        {task.description && (
                          <div className="text-xs text-muted-foreground">{task.description}</div>
                        )}
                        <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarClock className="h-3 w-3" /> до{" "}
                          {task.dueDate ? formatDate(task.dueDate) : "—"}
                        </div>
                      </div>
                      {key !== "done" && (
                        <div className="flex gap-2">
                          {key === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => helpers.advanceTask(task.id, "in_progress")}
                            >
                              Взять в работу
                            </Button>
                          )}
                          <Button
                            variant="accent"
                            size="sm"
                            onClick={() => helpers.advanceTask(task.id, "done")}
                          >
                            <CheckCircle2 className="h-4 w-4" /> Готово
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {buckets[key].length === 0 && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Здесь пока пусто.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
