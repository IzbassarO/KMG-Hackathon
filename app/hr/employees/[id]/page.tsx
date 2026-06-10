"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Sparkles, Target, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { TicketCard } from "@/components/shared/ticket-card";
import { SentimentCard } from "@/components/shared/sentiment-card";
import { useStore } from "@/lib/store";
import { formatDate, initials, percent } from "@/lib/utils";

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state } = useStore();
  const user = state.users.find((u) => u.id === id);
  if (!user && state.hydrated) notFound();
  if (!user) return null;

  const tickets = state.tickets.filter((t) => t.assigneeId === user.id);
  const tasks = state.tasks.filter((t) => tickets.some((tk) => tk.id === t.ticketId));
  const done = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="w-fit">
        <Link href="/hr/employees">
          <ArrowLeft className="h-4 w-4" /> Сотрудники
        </Link>
      </Button>
      <Card className="overflow-hidden">
        <div className="gradient-navy p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-4 ring-white/20">
                <AvatarFallback className="bg-kmg-gold text-lg text-white">
                  {initials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xs uppercase tracking-widest text-white/70">
                  Сотрудник KMG
                </div>
                <div className="text-2xl font-semibold">{user.fullName}</div>
                <div className="text-sm text-white/80">{user.position}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-4 w-4" /> {user.email}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {user.department}
              </span>
            </div>
          </div>
        </div>
        <CardContent className="grid gap-4 p-6 md:grid-cols-3">
          <Metric icon={Target} label="Тикетов в работе" value={tickets.length.toString()} />
          <Metric icon={Trophy} label="Прогресс" value={`${percent(done, tasks.length)}%`} />
          <Metric icon={Sparkles} label="Старт" value={user.startDate ? formatDate(user.startDate) : "—"} />
        </CardContent>
      </Card>

      <SentimentCard userId={user.id} />

      <div>
        <h2 className="section-title">Тикеты</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              context="hr"
              assigneeName={user.fullName}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-kmg-mist bg-white p-4">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-kmg-navy/10 text-kmg-navy">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold text-kmg-ink">{value}</div>
      </div>
    </div>
  );
}
