"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  addEdge,
} from "@xyflow/react";
import { nodeTypes } from "./nodes";
import { defaultNodeData } from "./constants";
import type { FlowNodeType } from "./types";

interface Props {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeClick: (node: Node) => void;
  onPaneClick: () => void;
  onAddNode: (node: Node) => void;
}

export function FlowBuilderCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onAddNode,
}: Props) {
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData("application/reactflow") as FlowNodeType;
    if (!nodeType) return;

    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const newNode: Node = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position,
      data: defaultNodeData(nodeType),
    };
    onAddNode(newNode);
  }, [screenToFlowPosition, onAddNode]);

  return (
    <div className="flex-1 min-w-0 h-full" onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        style={{ background: "var(--background)" }}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onNodeClick(node)}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          style: { strokeWidth: 1.5, stroke: "var(--border)" },
          animated: false,
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="rgba(128,128,128,0.25)"
        />
        <Controls
          showInteractive={false}
          style={{ boxShadow: "none" }}
          className="!bg-card !border !border-border !rounded-xl !shadow-sm !overflow-hidden"
        />
        <MiniMap
          nodeStrokeWidth={0}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
