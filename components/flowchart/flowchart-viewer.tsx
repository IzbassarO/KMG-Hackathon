"use client";

import { useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { flowNodeTypes, type FlowReactNode } from "./nodes";
import { stepNodes } from "@/lib/flow";
import type { Flow } from "@/lib/types";

export function FlowchartViewer({ flow }: { flow: Flow }) {
  // Обычно прогресс считаем по исполняемым шагам; в общей карте (одни milestone) —
  // по этапам-вехам, чтобы не показывать «0 из 0».
  const taskSteps = stepNodes(flow);
  const steps = taskSteps.length > 0 ? taskSteps : flow.nodes.filter((n) => n.type === "milestone");
  const doneSteps = steps.filter((n) => n.status === "done").length;
  const availableSteps = steps.filter((n) => n.status === "active").length;
  const pct = steps.length ? Math.round((doneSteps / steps.length) * 100) : 0;

  const nodes = useMemo<FlowReactNode[]>(
    () =>
      flow.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: { ...node },
        draggable: true,
        selectable: true
      })),
    [flow.nodes]
  );

  const edges = useMemo<Edge[]>(
    () =>
      flow.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: "smoothstep",
        animated: edge.variant === "default",
        style: {
          stroke:
            edge.variant === "success"
              ? "#0E9F6E"
              : edge.variant === "warning"
                ? "#D97706"
                : "#003F7D",
          strokeWidth: 2
        },
        labelStyle: {
          fill: "#0B1F3A",
          fontSize: 11,
          fontWeight: 600
        },
        labelBgStyle: {
          fill: "#fff",
          stroke: "#E6ECF4"
        }
      })),
    [flow.edges]
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-kmg-mist bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-kmg-mist px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-kmg-ink">
            Прогресс: {doneSteps} из {steps.length} шагов
          </span>
          <span className="text-sm font-semibold text-kmg-navy">{pct}%</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <Legend color="bg-emerald-500" label={`Готово · ${doneSteps}`} />
          <Legend color="bg-kmg-gold" label={`Доступно · ${availableSteps}`} />
          <Legend color="bg-kmg-mist" label={`Заблокировано · ${steps.length - doneSteps - availableSteps}`} />
        </div>
      </div>
      <div className="h-[520px] w-full">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={flowNodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            color="#003F7D"
            gap={20}
            size={1}
            variant={BackgroundVariant.Dots}
            style={{ opacity: 0.25 }}
          />
          <Controls
            showInteractive={false}
            className="!rounded-lg !border !border-kmg-mist !bg-white !shadow-card"
          />
          <MiniMap
            pannable
            zoomable
            nodeStrokeColor="#003F7D"
            nodeColor={(node) =>
              node.type === "end" ? "#0E9F6E" : node.type === "approval" ? "#F39200" : "#1A5694"
            }
            maskColor="rgba(0, 63, 125, 0.08)"
            className="!rounded-lg !border !border-kmg-mist !bg-white"
          />
        </ReactFlow>
      </ReactFlowProvider>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
