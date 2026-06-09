"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Filter, GitBranch } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { TicketCard } from "@/components/shared/ticket-card";
import { useStore } from "@/lib/store";
import type { TicketStatus } from "@/lib/types";

const statusOptions: { value: TicketStatus | "all"; label: string }[] = [
  { value: "all", label: "Все статусы" },
  { value: "draft", label: "Черновики" },
  { value: "in_progress", label: "В работе" },
  { value: "review", label: "На ревью" },
  { value: "blocked", label: "Заблокированы" },
  { value: "completed", label: "Завершены" }
];

export default function HrTicketsPage() {
  const { state } = useStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "all">("all");
  const [category, setCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    return state.tickets.filter((t) => {
      const matchesQuery =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.code.toLowerCase().includes(search.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = status === "all" || t.status === status;
      const matchesCategory = category === "all" || t.category === category;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [state.tickets, search, status, category]);

  const grouped = useMemo(() => {
    const byStatus: Record<string, typeof filtered> = {};
    for (const ticket of filtered) {
      byStatus[ticket.status] ??= [];
      byStatus[ticket.status].push(ticket);
    }
    return byStatus;
  }, [filtered]);

  const lanes: { key: TicketStatus; title: string; tone: "navy" | "warning" | "danger" | "success" | "info" }[] = [
    { key: "draft", title: "Черновики", tone: "info" },
    { key: "in_progress", title: "В работе", tone: "navy" },
    { key: "review", title: "На ревью", tone: "warning" },
    { key: "blocked", title: "Заблокированы", tone: "danger" },
    { key: "completed", title: "Завершены", tone: "success" }
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-kmg-ink">
            Flowchart-тикеты
          </h1>
          <p className="text-sm text-muted-foreground">
            Каждый тикет — это процесс адаптации с шагами, ответственными и SLA. Откройте тикет,
            чтобы увидеть полный flowchart.
          </p>
        </div>
        <Button variant="accent">
          <Plus className="h-4 w-4" /> Создать тикет
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по коду, заголовку или тегу"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as TicketStatus | "all")}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              <SelectItem value="documents">Документы</SelectItem>
              <SelectItem value="access">Доступы</SelectItem>
              <SelectItem value="training">Обучение</SelectItem>
              <SelectItem value="equipment">Оборудование</SelectItem>
              <SelectItem value="compliance">Комплаенс</SelectItem>
              <SelectItem value="mentorship">Наставничество</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="ml-auto">
            <Filter className="h-4 w-4" /> Доп. фильтры
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-5">
        {lanes.map((lane) => (
          <div key={lane.key} className="flex flex-col gap-2">
            <div className="flex items-center justify-between rounded-xl border border-kmg-mist bg-white px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-kmg-ink">{lane.title}</span>
                <Badge variant={lane.tone as never}>{grouped[lane.key]?.length ?? 0}</Badge>
              </div>
              <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Перетаскивание (drag&drop) скоро.
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((ticket) => {
          const assignee = state.users.find((u) => u.id === ticket.assigneeId);
          return (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              context="hr"
              assigneeName={assignee?.fullName}
            />
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-kmg-mist bg-white p-10 text-center text-muted-foreground">
          Тикетов с такими параметрами не найдено.
        </div>
      )}
    </div>
  );
}
