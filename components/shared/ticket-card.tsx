"use client";

import Link from "next/link";
import { ArrowUpRight, Calendar, GitBranch, AlertCircle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn, formatDate } from "@/lib/utils";
import type { Ticket } from "@/lib/types";

const statusMap: Record<
  Ticket["status"],
  { label: string; tone: "navy" | "success" | "warning" | "danger" | "info" | "gold" }
> = {
  draft: { label: "Черновик", tone: "info" },
  in_progress: { label: "В работе", tone: "navy" },
  blocked: { label: "Заблокирован", tone: "danger" },
  review: { label: "На ревью", tone: "gold" },
  completed: { label: "Завершён", tone: "success" }
};

const priorityMap: Record<Ticket["priority"], { label: string; icon?: React.ReactNode; tone: string }> = {
  low: { label: "Low", tone: "text-emerald-700 bg-emerald-50" },
  medium: { label: "Medium", tone: "text-sky-700 bg-sky-50" },
  high: { label: "High", tone: "text-amber-700 bg-amber-50" },
  critical: { label: "Critical", tone: "text-red-700 bg-red-50", icon: <AlertCircle className="h-3 w-3" /> }
};

const categoryIcon: Record<Ticket["category"], React.ReactNode> = {
  documents: <ShieldCheck className="h-4 w-4" />,
  access: <ShieldCheck className="h-4 w-4" />,
  training: <ShieldCheck className="h-4 w-4" />,
  equipment: <ShieldCheck className="h-4 w-4" />,
  compliance: <ShieldCheck className="h-4 w-4" />,
  culture: <ShieldCheck className="h-4 w-4" />,
  mentorship: <ShieldCheck className="h-4 w-4" />
};

export function TicketCard({
  ticket,
  context,
  assigneeName
}: {
  ticket: Ticket;
  context: "hr" | "employee";
  assigneeName?: string;
}) {
  const status = statusMap[ticket.status];
  const priority = priorityMap[ticket.priority];

  return (
    <Link
      href={`/${context}/tickets/${ticket.id}`}
      className="group flex h-full flex-col justify-between rounded-2xl border border-kmg-mist bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-kmg-navy/40 hover:shadow-elevated"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-kmg-navy/80">
              <span className="rounded bg-kmg-mist px-1.5 py-0.5">{ticket.code}</span>
              <span className="text-muted-foreground">{ticket.category}</span>
            </div>
            <h3 className="mt-2 text-base font-semibold leading-snug text-kmg-ink transition-colors group-hover:text-kmg-navy">
              {ticket.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {ticket.summary}
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-kmg-navy" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <Badge variant={status.tone}>{status.label}</Badge>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              priority.tone
            )}
          >
            {priority.icon}
            {priority.label}
          </span>
          {ticket.badges.map((badge, idx) => (
            <Badge key={idx} variant={badge.tone as never}>
              {badge.label}
            </Badge>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            до {formatDate(ticket.dueDate)}
          </span>
          <span className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            {ticket.flow.nodes.length} шагов
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <Progress value={ticket.progress} />
          <span className="w-10 text-right text-xs font-semibold text-kmg-navy">
            {ticket.progress}%
          </span>
        </div>
        {assigneeName && (
          <div className="mt-3 text-xs text-muted-foreground">
            Исполнитель: <span className="font-medium text-kmg-ink">{assigneeName}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
