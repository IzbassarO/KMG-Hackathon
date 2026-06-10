/**
 * Разрешение зависимостей flowchart-тикетов.
 *
 * Правило (общее для ВСЕХ тикетов): шаг нельзя начать, пока не завершён предыдущий.
 * При этом после разветвления параллельные ветки независимы — завершение шага в
 * одной ветке не влияет на другую; шаг-слияние с несколькими входами доступен,
 * только когда завершены все его предшественники.
 *
 * Источник истины о завершении — задачи (task.status === "done") по nodeId.
 * Узлы start/milestone/decision/end «проходные»: считаются завершёнными, когда
 * завершены все их предшественники.
 */

import type { Flow, FlowNode, Ticket } from "./types";

export type ResolvedState = "done" | "available" | "locked";

const STATUS_OF: Record<ResolvedState, NonNullable<FlowNode["status"]>> = {
  done: "done",
  available: "active",
  locked: "pending"
};

function incomingMap(flow: Flow): Map<string, string[]> {
  const incoming = new Map<string, string[]>();
  for (const n of flow.nodes) incoming.set(n.id, []);
  for (const e of flow.edges) incoming.get(e.target)?.push(e.source);
  return incoming;
}

export function computeNodeStates(flow: Flow, doneNodeIds: Set<string>): Map<string, ResolvedState> {
  const byId = new Map(flow.nodes.map((n) => [n.id, n]));
  const incoming = incomingMap(flow);

  const memo = new Map<string, boolean>();
  const visiting = new Set<string>();

  function completed(id: string): boolean {
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return false; // защита от циклов
    visiting.add(id);

    const node = byId.get(id);
    let result: boolean;
    if (!node) result = false;
    else if (node.type === "start") result = true;
    else if (node.type === "task" || node.type === "approval") result = doneNodeIds.has(id);
    else {
      const preds = incoming.get(id) ?? [];
      result = preds.length === 0 ? true : preds.every(completed);
    }

    visiting.delete(id);
    memo.set(id, result);
    return result;
  }

  const predsCompleted = (id: string) => {
    const preds = incoming.get(id) ?? [];
    return preds.length === 0 ? true : preds.every(completed);
  };

  const states = new Map<string, ResolvedState>();
  for (const n of flow.nodes) {
    if (n.type === "task" || n.type === "approval") {
      if (doneNodeIds.has(n.id)) states.set(n.id, "done");
      else if (predsCompleted(n.id)) states.set(n.id, "available");
      else states.set(n.id, "locked");
    } else {
      states.set(n.id, completed(n.id) ? "done" : "locked");
    }
  }
  return states;
}

/** Возвращает копию flow со статусами узлов, отражающими зависимости. */
export function resolveFlow(flow: Flow, doneNodeIds: Set<string>): Flow {
  const states = computeNodeStates(flow, doneNodeIds);
  return {
    ...flow,
    nodes: flow.nodes.map((n) => ({ ...n, status: STATUS_OF[states.get(n.id) ?? "locked"] }))
  };
}

export function nodeState(flow: Flow, nodeId: string, doneNodeIds: Set<string>): ResolvedState {
  return computeNodeStates(flow, doneNodeIds).get(nodeId) ?? "locked";
}

/** Можно ли сейчас начать/завершить шаг (все предшественники выполнены). */
export function canStartNode(flow: Flow, nodeId: string, doneNodeIds: Set<string>): boolean {
  const s = nodeState(flow, nodeId, doneNodeIds);
  return s === "available" || s === "done";
}

export function doneNodeIdsFromTasks(tasks: { nodeId: string; status: string }[]): Set<string> {
  return new Set(tasks.filter((t) => t.status === "done").map((t) => t.nodeId));
}

/** Шаги, по которым считается прогресс (исполняемые узлы). */
export function stepNodes(flow: Flow): FlowNode[] {
  return flow.nodes.filter((n) => n.type === "task" || n.type === "approval");
}

export function progressFor(flow: Flow, doneNodeIds: Set<string>): number {
  const steps = stepNodes(flow);
  if (steps.length === 0) return 0;
  const done = steps.filter((n) => doneNodeIds.has(n.id)).length;
  return Math.round((done / steps.length) * 100);
}

export function ticketStatusFor(progress: number, prev: Ticket["status"]): Ticket["status"] {
  if (prev === "blocked" || prev === "review") return prev;
  if (progress >= 100) return "completed";
  if (progress > 0) return "in_progress";
  return "draft";
}
