"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Download,
  GitBranch,
  Pencil,
  Sparkles,
  Users
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlowchartViewer } from "@/components/flowchart/flowchart-viewer";
import { JourneyStrip } from "@/components/flowchart/journey-strip";
import { useStore } from "@/lib/store";
import { formatDate, initials } from "@/lib/utils";

export default function HrTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state, helpers } = useStore();
  const ticket = state.tickets.find((t) => t.id === id);

  if (!ticket && state.hydrated) {
    notFound();
  }
  if (!ticket) return null;

  const assignee = state.users.find((u) => u.id === ticket.assigneeId);
  const owner = state.users.find((u) => u.id === ticket.ownerId);
  const tasks = state.tasks.filter((t) => t.ticketId === ticket.id);
  const isBadgeTicket = ticket.tags.includes("badge");
  const badge = ticket.assigneeId ? helpers.getBadge(ticket.assigneeId) : undefined;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/hr/tickets">
              <ArrowLeft className="h-4 w-4" /> Все тикеты
            </Link>
          </Button>
          <span className="rounded bg-kmg-mist px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-kmg-navy">
            {ticket.code}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <Pencil className="h-4 w-4" /> Редактировать
          </Button>
          <Button variant="accent">
            <Sparkles className="h-4 w-4" /> Спросить AI
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-balance text-2xl font-semibold text-kmg-ink">
                  {ticket.title}
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  {ticket.summary}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                Создан: {formatDate(ticket.createdAt)} <br />
                Обновлён: {formatDate(ticket.updatedAt)}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="navy">{ticket.category}</Badge>
              {ticket.badges.map((b, i) => (
                <Badge key={i} variant={b.tone as never}>
                  {b.label}
                </Badge>
              ))}
              {ticket.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Progress value={ticket.progress} className="flex-1" />
              <span className="w-12 text-right text-sm font-semibold text-kmg-navy">
                {ticket.progress}%
              </span>
            </div>
            <JourneyStrip flow={ticket.flow} />
          </div>
          <div className="space-y-4 rounded-2xl border border-kmg-mist bg-kmg-paper p-5">
            <SideMeta label="Исполнитель" user={assignee} />
            <SideMeta label="Куратор" user={owner} />
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                SLA
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-kmg-ink">
                <CalendarDays className="h-4 w-4 text-kmg-navy" />
                до {formatDate(ticket.dueDate)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Шагов в процессе
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-kmg-ink">
                <GitBranch className="h-4 w-4 text-kmg-navy" />
                {ticket.flow.nodes.length}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Задач
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-kmg-ink">
                <ClipboardList className="h-4 w-4 text-kmg-navy" />
                {tasks.length} ({tasks.filter((t) => t.status === "done").length} готово)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="flow">
        <TabsList>
          <TabsTrigger value="flow">Flowchart</TabsTrigger>
          <TabsTrigger value="tasks">Задачи</TabsTrigger>
          {isBadgeTicket && <TabsTrigger value="badge">Бейдж</TabsTrigger>}
          <TabsTrigger value="comments">Комментарии</TabsTrigger>
          <TabsTrigger value="audit">Аудит</TabsTrigger>
        </TabsList>
        {isBadgeTicket && (
          <TabsContent value="badge">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-kmg-navy" /> Бейдж сотрудника
                  </CardTitle>
                  <CardDescription>
                    {badge
                      ? `Сгенерирован ${formatDate(badge.issuedAt)} · документы: ${
                          [badge.documents.consent && "согласие", badge.documents.memo && "записка", badge.documents.id && "удостоверение"]
                            .filter(Boolean)
                            .join(", ") || "—"
                        }`
                      : "Бейдж ещё не сгенерирован."}
                  </CardDescription>
                </div>
                <Button variant="accent" asChild>
                  <Link href="/hr/badge">
                    <CreditCard className="h-4 w-4" /> Открыть Badge Center
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {badge?.badgeDataUrl ? (
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="w-[340px] max-w-full overflow-hidden rounded-2xl border border-kmg-mist">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={badge.badgeDataUrl} alt="Бейдж" className="w-full" />
                    </div>
                    <Button variant="outline" asChild>
                      <a href={badge.badgeDataUrl} download={`badge_${badge.fio.replace(/\s+/g, "_")}.png`}>
                        <Download className="h-4 w-4" /> Скачать
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-kmg-mist bg-kmg-paper p-8 text-center text-sm text-muted-foreground">
                    Перейдите в Badge Center, загрузите документы (или «Заполнить демо») и
                    сгенерируйте бейдж — он появится здесь.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
        <TabsContent value="flow">
          <FlowchartViewer flow={ticket.flow} />
        </TabsContent>
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Чек-лист задач</CardTitle>
              <CardDescription>
                Каждый узел типа task/approval превращается в обязательную задачу.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-kmg-mist">
              {tasks.map((task) => {
                const node = ticket.flow.nodes.find((n) => n.id === task.nodeId);
                return (
                  <div key={task.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-kmg-ink">{task.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {task.description ?? "Описание появится после согласования"}
                      </div>
                    </div>
                    <Badge
                      variant={
                        task.status === "done"
                          ? "success"
                          : task.status === "in_progress"
                            ? "warning"
                            : "outline"
                      }
                    >
                      {task.status === "done"
                        ? "Готово"
                        : task.status === "in_progress"
                          ? "В работе"
                          : "Ожидает"}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => helpers.advanceTask(task.id, "in_progress")}
                      >
                        В работу
                      </Button>
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => helpers.advanceTask(task.id, "done")}
                      >
                        Завершить
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="comments">
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Раздел комментариев будет доступен после интеграции с MS Teams и Slack.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="audit">
          <Card>
            <CardContent className="space-y-3 p-6">
              {state.activity
                .filter((a) => a.meta?.ticket === ticket.code)
                .map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="mt-1 grid h-7 w-7 place-items-center rounded-full bg-kmg-mist text-kmg-navy">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-sm text-kmg-ink">
                        <span className="font-semibold">{event.actorName}</span>{" "}
                        <span className="text-muted-foreground">{event.message}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(event.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SideMeta({
  label,
  user
}: {
  label: string;
  user?: { fullName: string; position?: string; department?: string };
}) {
  if (!user) {
    return (
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="mt-1 text-sm text-muted-foreground">не назначен</div>
      </div>
    );
  }
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{initials(user.fullName)}</AvatarFallback>
        </Avatar>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-kmg-ink">{user.fullName}</div>
          <div className="text-xs text-muted-foreground">
            {user.position}
            {user.department ? ` · ${user.department}` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
