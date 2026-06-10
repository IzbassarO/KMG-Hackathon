"use client";

import { FormEvent, useState } from "react";
import { Check, Clock, Heart, Inbox, MessageCircle, Send, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStore } from "@/lib/store";
import { cn, formatDateTime, initials } from "@/lib/utils";

function toDateInput(iso?: string) {
  const d = iso ? new Date(iso) : new Date(Date.now() + 2 * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function HrMentorshipPage() {
  const { state, currentUser, helpers } = useStore();
  const [schedule, setSchedule] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [reply, setReply] = useState<Record<string, string>>({});

  if (!currentUser) return null;

  const requests = helpers.meetingRequestsForHr(currentUser.id);
  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending");

  const userName = (id: string) => state.users.find((u) => u.id === id)?.fullName ?? "Сотрудник";

  const threadEmployeeIds = Array.from(
    new Set(
      state.messages
        .filter((m) => m.toId === currentUser.id || m.fromId === currentUser.id)
        .map((m) => m.employeeId)
    )
  );

  function accept(reqId: string, preferredAt?: string) {
    const value = schedule[reqId] || toDateInput(preferredAt);
    helpers.decideMeeting(reqId, "accepted", {
      scheduledAt: new Date(`${value}T10:00:00`).toISOString()
    });
  }
  function reject(reqId: string) {
    helpers.decideMeeting(reqId, "rejected", { hrNote: note[reqId]?.trim() || undefined });
  }
  function sendReply(employeeId: string, e: FormEvent) {
    e.preventDefault();
    const text = reply[employeeId];
    if (!text?.trim()) return;
    helpers.sendMessage(employeeId, currentUser!.id, employeeId, text);
    setReply((p) => ({ ...p, [employeeId]: "" }));
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-kmg-ink">
          <Heart className="h-7 w-7 text-kmg-gold" /> Менторство · входящие
        </h1>
        <p className="text-sm text-muted-foreground">
          Запросы на встречи 1:1 и сообщения от ваших сотрудников.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-kmg-navy" /> Запросы на 1:1
            {pending.length > 0 && <Badge variant="warning">{pending.length}</Badge>}
          </CardTitle>
          <CardDescription>Подтвердите время или отклоните с комментарием.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 && (
            <div className="rounded-2xl border border-dashed border-kmg-mist bg-white p-6 text-center text-sm text-muted-foreground">
              Новых запросов нет.
            </div>
          )}
          {pending.map((r) => (
            <div key={r.id} className="rounded-2xl border border-kmg-mist p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{initials(userName(r.employeeId))}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-kmg-ink">{userName(r.employeeId)}</div>
                  <div className="text-sm text-muted-foreground">{r.topic}</div>
                  {r.preferredAt && (
                    <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> Желаемое: {formatDateTime(r.preferredAt)}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Дата встречи
                  </label>
                  <Input
                    type="date"
                    value={schedule[r.id] ?? toDateInput(r.preferredAt)}
                    onChange={(e) => setSchedule((p) => ({ ...p, [r.id]: e.target.value }))}
                    className="mt-1 w-44"
                  />
                </div>
                <Input
                  placeholder="Комментарий (для отклонения)"
                  value={note[r.id] ?? ""}
                  onChange={(e) => setNote((p) => ({ ...p, [r.id]: e.target.value }))}
                  className="min-w-[200px] flex-1"
                />
                <Button variant="accent" onClick={() => accept(r.id, r.preferredAt)}>
                  <Check className="h-4 w-4" /> Принять
                </Button>
                <Button variant="outline" onClick={() => reject(r.id)}>
                  <X className="h-4 w-4" /> Отклонить
                </Button>
              </div>
            </div>
          ))}

          {decided.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">История</div>
              {decided.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-kmg-mist bg-kmg-paper p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-kmg-ink">
                      {userName(r.employeeId)} · {r.topic}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.status === "accepted" && r.scheduledAt
                        ? `Встреча: ${formatDateTime(r.scheduledAt)}`
                        : r.hrNote || "Отклонено"}
                    </div>
                  </div>
                  <Badge variant={r.status === "accepted" ? "success" : "danger"}>
                    {r.status === "accepted" ? "Принято" : "Отклонено"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-kmg-navy" /> Сообщения
          </CardTitle>
          <CardDescription>Переписка с сотрудниками на адаптации.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {threadEmployeeIds.length === 0 && (
            <div className="rounded-2xl border border-dashed border-kmg-mist bg-white p-6 text-center text-sm text-muted-foreground">
              Сообщений пока нет.
            </div>
          )}
          {threadEmployeeIds.map((eid) => {
            const thread = helpers.threadMessages(eid);
            return (
              <div key={eid} className="rounded-2xl border border-kmg-mist p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{initials(userName(eid))}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-kmg-ink">{userName(eid)}</span>
                </div>
                <div className="max-h-56 space-y-2 overflow-y-auto scrollbar-thin">
                  {thread.map((m) => {
                    const isHr = m.fromId === currentUser.id;
                    return (
                      <div key={m.id} className={cn("flex w-full", isHr ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                            isHr ? "rounded-br-md bg-kmg-navy text-white" : "rounded-bl-md bg-kmg-mist text-kmg-ink"
                          )}
                        >
                          <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                          <div className={cn("mt-1 text-[10px]", isHr ? "text-white/60" : "text-muted-foreground")}>
                            {formatDateTime(m.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={(e) => sendReply(eid, e)} className="mt-3 flex items-end gap-2">
                  <Textarea
                    placeholder="Ответить сотруднику..."
                    value={reply[eid] ?? ""}
                    onChange={(e) => setReply((p) => ({ ...p, [eid]: e.target.value }))}
                    rows={1}
                    className="flex-1 resize-none"
                  />
                  <Button type="submit" variant="accent" disabled={!reply[eid]?.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
