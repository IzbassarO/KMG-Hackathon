"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { CheckCircle2, Circle, Loader2, Lock, Flag, AlertOctagon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlowNode } from "@/lib/types";

export type FlowNodeData = FlowNode & Record<string, unknown>;
export type FlowReactNode = Node<FlowNodeData, FlowNode["type"]>;

function statusStyles(status?: FlowNode["status"]) {
  switch (status) {
    case "done":
      return {
        ring: "ring-emerald-300",
        accent: "text-emerald-600",
        label: "Готово",
        Icon: CheckCircle2
      };
    case "active":
      return {
        ring: "ring-kmg-gold",
        accent: "text-amber-600",
        label: "Доступно",
        Icon: Loader2
      };
    case "blocked":
      return {
        ring: "ring-red-300",
        accent: "text-red-600",
        label: "Заблокировано",
        Icon: AlertOctagon
      };
    default:
      return {
        ring: "ring-kmg-mist",
        accent: "text-kmg-navy/60",
        label: "Откроется позже",
        Icon: Lock
      };
  }
}

function NodeShell({
  data,
  accentClass,
  badgeLabel,
  BadgeIcon,
  showSource = true,
  showTarget = true,
  children
}: {
  data: FlowNode;
  accentClass: string;
  badgeLabel: string;
  BadgeIcon: typeof CheckCircle2;
  showSource?: boolean;
  showTarget?: boolean;
  children?: React.ReactNode;
}) {
  const status = statusStyles(data.status);
  const StatusIcon = status.Icon;
  return (
    <div
      className={cn(
        "w-[240px] rounded-2xl border border-kmg-mist bg-white p-3 shadow-card ring-2 ring-offset-2 transition-all hover:-translate-y-0.5 hover:shadow-elevated",
        status.ring
      )}
    >
      {showTarget && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2 !w-2 !border-2 !border-white !bg-kmg-navy"
        />
      )}
      <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest">
        <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5", accentClass)}>
          <BadgeIcon className="h-3 w-3" />
          {badgeLabel}
        </span>
        <span className={cn("inline-flex items-center gap-1", status.accent)}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </span>
      </div>
      <div className="text-sm font-semibold leading-tight text-kmg-ink">{data.title}</div>
      {data.description && (
        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {data.description}
        </div>
      )}
      {data.estimateDays !== undefined && data.estimateDays > 0 && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-kmg-mist px-2 py-0.5 text-[10px] font-medium text-kmg-navy">
          ~ {data.estimateDays} дн.
        </div>
      )}
      {data.assigneeRole && (
        <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          Ответственный: {data.assigneeRole === "hr" ? "HR" : "Сотрудник"}
        </div>
      )}
      {children}
      {showSource && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-2 !w-2 !border-2 !border-white !bg-kmg-navy"
        />
      )}
    </div>
  );
}

export function StartNode({ data }: NodeProps<FlowReactNode>) {
  return (
    <NodeShell
      data={data}
      accentClass="bg-kmg-navy text-white"
      badgeLabel="Start"
      BadgeIcon={Flag}
      showTarget={false}
    />
  );
}

export function EndNode({ data }: NodeProps<FlowReactNode>) {
  return (
    <NodeShell
      data={data}
      accentClass="bg-emerald-600 text-white"
      badgeLabel="Finish"
      BadgeIcon={Sparkles}
      showSource={false}
    />
  );
}

export function TaskNode({ data }: NodeProps<FlowReactNode>) {
  return (
    <NodeShell
      data={data}
      accentClass="bg-kmg-mist text-kmg-navy"
      badgeLabel="Task"
      BadgeIcon={Circle}
    />
  );
}

export function ApprovalNode({ data }: NodeProps<FlowReactNode>) {
  return (
    <NodeShell
      data={data}
      accentClass="bg-kmg-gold/15 text-kmg-gold-dark"
      badgeLabel="Approval"
      BadgeIcon={CheckCircle2}
    />
  );
}

export function MilestoneNode({ data }: NodeProps<FlowReactNode>) {
  return (
    <NodeShell
      data={data}
      accentClass="bg-purple-50 text-purple-700"
      badgeLabel="Milestone"
      BadgeIcon={Flag}
    />
  );
}

export function DecisionNode({ data }: NodeProps<FlowReactNode>) {
  return (
    <NodeShell
      data={data}
      accentClass="bg-sky-50 text-sky-700"
      badgeLabel="Decision"
      BadgeIcon={Circle}
    />
  );
}

export const flowNodeTypes = {
  start: StartNode,
  end: EndNode,
  task: TaskNode,
  approval: ApprovalNode,
  milestone: MilestoneNode,
  decision: DecisionNode
};
