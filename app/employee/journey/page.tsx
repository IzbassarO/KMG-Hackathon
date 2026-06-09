"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Compass, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/shared/ticket-card";
import { FlowchartViewer } from "@/components/flowchart/flowchart-viewer";
import { useStore } from "@/lib/store";
import type { Flow } from "@/lib/types";

export default function EmployeeJourneyPage() {
  const { state, currentUser } = useStore();
  if (!currentUser) return null;
  const tickets = state.tickets.filter((t) => t.assigneeId === currentUser.id);

  const composite = useMemo<Flow>(() => {
    if (tickets.length === 0) return { nodes: [], edges: [] };
    const nodes = [
      {
        id: "journey-start",
        type: "start" as const,
        title: "Подписан оффер",
        description: "Старт онбординга",
        position: { x: 0, y: 220 }
      },
      ...tickets.map((ticket, idx) => ({
        id: `journey-${ticket.id}`,
        type: "milestone" as const,
        title: ticket.title,
        description: `${ticket.progress}% выполнено`,
        position: { x: 240 + idx * 260, y: idx % 2 === 0 ? 140 : 300 },
        status:
          ticket.status === "completed"
            ? ("done" as const)
            : ticket.status === "blocked"
              ? ("blocked" as const)
              : ticket.progress > 0
                ? ("active" as const)
                : ("pending" as const)
      })),
      {
        id: "journey-end",
        type: "end" as const,
        title: "Готов к работе",
        description: "Адаптация завершена",
        position: { x: 240 + tickets.length * 260, y: 220 }
      }
    ];

    const edges = [
      {
        id: "je-start",
        source: "journey-start",
        target: `journey-${tickets[0].id}`,
        variant: "default" as const
      },
      ...tickets.slice(0, -1).map((t, i) => ({
        id: `je-${i}`,
        source: `journey-${t.id}`,
        target: `journey-${tickets[i + 1].id}`,
        variant: "default" as const
      })),
      {
        id: "je-end",
        source: `journey-${tickets[tickets.length - 1].id}`,
        target: "journey-end",
        variant: "success" as const
      }
    ];

    return { nodes, edges };
  }, [tickets]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
          <Compass className="h-7 w-7 text-kmg-navy" /> Мой путь онбординга
        </h1>
        <p className="text-sm text-muted-foreground">
          Полный flow — от подписанного оффера до полной готовности к работе. Кликните по тикету,
          чтобы перейти к деталям процесса.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Общая карта</CardTitle>
          <CardDescription>
            Каждая остановка — отдельный flowchart-тикет со своими задачами и сроками.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {composite.nodes.length > 0 ? (
            <FlowchartViewer flow={composite} />
          ) : (
            <div className="rounded-2xl border border-dashed border-kmg-mist p-10 text-center text-muted-foreground">
              Тикетов в работе пока нет.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Мои тикеты</CardTitle>
            <CardDescription>{tickets.length} активных процессов адаптации</CardDescription>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/employee/tasks">
              Все задачи <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} context="employee" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
