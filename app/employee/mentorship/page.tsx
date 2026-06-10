"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Heart,
  Info,
  MessageCircle,
  Send
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { cn, formatDate, formatDateTime, initials } from "@/lib/utils";

interface Checkpoint {
  day: number;
  label: string;
  description: string;
}

const CHECKPOINTS: Checkpoint[] = [
  { day: 7, label: "Welcome-встреча", description: "Знакомство с командой и руководителем" },
  { day: 14, label: "Закрепление наставника", description: "Назначен наставник на весь испытательный срок" },
  { day: 30, label: "Оценка 30 дней", description: "Промежуточная встреча и обратная связь" },
  { day: 45, label: "Промежуточный 1:1", description: "Корректировка целей по итогам первого месяца" },
  { day: 60, label: "Оценка 60 дней", description: "Самостоятельность и первые результаты" },
  { day: 90, label: "Финальная оценка", description: "Итоги испытательного срока и план развития" }
];

type CpStatus = "done" | "soon" | "planned";

export default function EmployeeMentorshipPage() {
  const { state, currentUser, helpers } = useStore();
  const [msgOpen, setMsgOpen] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [topic, setTopic] = useState("");
  const [preferred, setPreferred] = useState("");

  useEffect(() => {
    if (currentUser?.role === "employee") helpers.ensureOnboardingStart(currentUser.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  if (!currentUser) return null;

  const mentor =
    state.users.find((u) => u.id === currentUser.managerId) ??
    state.users.find((u) => u.role === "hr");

  const currentDay = helpers.getAdaptationDay(currentUser.id);
  const startedAt = state.onboarding[currentUser.id]?.startedAt ?? currentUser.startDate;
  const start = startedAt ? new Date(startedAt) : new Date();
  const dateForDay = (day: number) => {
    const d = new Date(start);
    d.setDate(start.getDate() + (day - 1));
    return d;
  };
  const statusFor = (day: number): CpStatus =>
    currentDay >= day ? "done" : day - currentDay <= 7 ? "soon" : "planned";

  const doneCount = CHECKPOINTS.filter((c) => statusFor(c.day) === "done").length;
  const progress = Math.round((doneCount / CHECKPOINTS.length) * 100);

  const thread = helpers.threadMessages(currentUser.id);
  const requests = helpers.meetingRequestsForEmployee(currentUser.id);

  function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!msgText.trim() || !mentor) return;
    helpers.sendMessage(currentUser!.id, currentUser!.id, mentor.id, msgText);
    setMsgText("");
  }

  function submitRequest(e: FormEvent) {
    e.preventDefault();
    if (!mentor) return;
    const preferredAt = preferred ? new Date(`${preferred}T10:00:00`).toISOString() : undefined;
    helpers.requestMeeting(currentUser!.id, mentor.id, topic, preferredAt);
    setTopic("");
    setPreferred("");
    setReqOpen(false);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
          <Heart className="h-7 w-7 text-kmg-gold" /> Менторство 30/60/90
        </h1>
        <p className="text-sm text-muted-foreground">
          Контрольные точки адаптации с наставником и прямая связь с HR.
        </p>
      </div>

      {mentor && (
        <Card>
          <CardHeader>
            <CardTitle>Ваш наставник (HR)</CardTitle>
            <CardDescription>Основной канал поддержки во время адаптации.</CardDescription>
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
              <Button variant="outline" onClick={() => setReqOpen(true)}>
                <CalendarCheck2 className="h-4 w-4" /> Запросить 1:1
              </Button>
              <Button variant="accent" onClick={() => setMsgOpen(true)}>
                <MessageCircle className="h-4 w-4" /> Написать
                {thread.some((m) => m.toId === currentUser.id) && (
                  <span className="ml-1 h-2 w-2 rounded-full bg-white" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-start gap-2 rounded-2xl border border-kmg-mist bg-kmg-paper p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-kmg-navy" />
        <span>
          Встречи по контрольным точкам назначает наставник по плану 30/60/90. Нужна
          дополнительная встреча — отправьте запрос «Запросить 1:1», наставник подтвердит время,
          и встреча появится в вашем календаре.
        </span>
      </div>

      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Мои встречи и запросы</CardTitle>
            <CardDescription>Статусы ваших обращений к наставнику.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-kmg-mist p-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-kmg-ink">{r.topic}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.status === "accepted" && r.scheduledAt
                      ? `Встреча: ${formatDateTime(r.scheduledAt)}`
                      : r.status === "rejected"
                        ? r.hrNote || "Отклонено наставником"
                        : r.preferredAt
                          ? `Желаемое время: ${formatDate(r.preferredAt)}`
                          : "Ожидает ответа наставника"}
                  </div>
                </div>
                <Badge
                  variant={
                    r.status === "accepted" ? "success" : r.status === "rejected" ? "danger" : "warning"
                  }
                >
                  {r.status === "accepted" ? "Подтверждено" : r.status === "rejected" ? "Отклонено" : "Ожидает"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Прогресс программы</CardTitle>
          <CardDescription>
            Пройдено {doneCount} из {CHECKPOINTS.length} контрольных точек · сегодня День {currentDay}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Контрольные точки</CardTitle>
          <CardDescription>
            Пройденные отмечены как завершённые; будущие — запланированы на конкретную дату.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative ml-4 space-y-4 border-l border-kmg-mist pl-6">
            {CHECKPOINTS.map((c) => {
              const status = statusFor(c.day);
              const date = dateForDay(c.day);
              return (
                <div key={c.day} className="relative">
                  <span
                    className={`absolute -left-[31px] top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-white ${
                      status === "done"
                        ? "bg-emerald-500"
                        : status === "soon"
                          ? "bg-kmg-gold"
                          : "bg-kmg-mist"
                    }`}
                  >
                    {status === "done" && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </span>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">
                        День {c.day}
                      </div>
                      <div className="text-sm font-semibold text-kmg-ink">{c.label}</div>
                      <div className="text-xs text-muted-foreground">{c.description}</div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          status === "done" ? "success" : status === "soon" ? "warning" : "outline"
                        }
                      >
                        {status === "done" ? "Завершено" : status === "soon" ? "Скоро" : "Запланировано"}
                      </Badge>
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {formatDate(date)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Диалог переписки с наставником */}
      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogContent className="flex max-h-[80vh] flex-col p-0 sm:max-w-lg">
          <DialogHeader className="gradient-navy p-5 text-white">
            <DialogTitle className="text-white">Чат с наставником</DialogTitle>
            <DialogDescription className="text-white/70">
              {mentor?.fullName} · обычно отвечает в течение дня
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 space-y-2 overflow-y-auto bg-kmg-paper p-4 scrollbar-thin">
            {thread.length === 0 && (
              <div className="rounded-2xl border border-dashed border-kmg-mist bg-white p-6 text-center text-sm text-muted-foreground">
                Напишите первое сообщение наставнику.
              </div>
            )}
            {thread.map((m) => {
              const isMe = m.fromId === currentUser.id;
              return (
                <div key={m.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-card",
                      isMe ? "rounded-br-md bg-kmg-navy text-white" : "rounded-bl-md bg-white text-kmg-ink"
                    )}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                    <div
                      className={cn(
                        "mt-1 text-[10px] uppercase tracking-widest",
                        isMe ? "text-white/60" : "text-muted-foreground"
                      )}
                    >
                      {formatDateTime(m.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <form onSubmit={sendMessage} className="flex items-end gap-2 border-t border-kmg-mist bg-white p-3">
            <Textarea
              placeholder="Сообщение наставнику..."
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e as unknown as FormEvent);
                }
              }}
              rows={1}
              className="flex-1 resize-none"
            />
            <Button type="submit" variant="accent" disabled={!msgText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Диалог запроса встречи 1:1 */}
      <Dialog open={reqOpen} onOpenChange={setReqOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Запросить встречу 1:1</DialogTitle>
            <DialogDescription>
              Наставник {mentor?.fullName} подтвердит или предложит другое время.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitRequest} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-kmg-ink">Тема встречи</label>
              <Input
                placeholder="Например: обсудить цели на испытательный срок"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-kmg-ink">Желаемая дата (необязательно)</label>
              <Input
                type="date"
                value={preferred}
                onChange={(e) => setPreferred(e.target.value)}
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setReqOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" variant="accent">
                <CalendarClock className="h-4 w-4" /> Отправить запрос
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
