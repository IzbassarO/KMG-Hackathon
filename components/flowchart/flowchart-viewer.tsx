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
import type { Flow } from "@/lib/types";

export function FlowchartViewer({ flow }: { flow: Flow }) {
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
    <div className="h-[560px] w-full overflow-hidden rounded-2xl border border-kmg-mist bg-white shadow-card">
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
  );
}
