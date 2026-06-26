"use client"

import "@xyflow/react/dist/style.css"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react"

import type { Bot } from "../types"
import { canvasNodeTypes } from "./nodes"
import { AnimatedEdge } from "./AnimatedEdge"
import { NodePanel } from "./NodePanel"
import { SERVICE_META, serviceKindsFor, type NodeKind } from "./service-meta"

const edgeTypes = { flow: AnimatedEdge }

// Layout: bot on top, services spread out in a horizontal row beneath it.
const TOP_Y = 40
const SVC_Y = 330
const SVC_COL_GAP = 300
const SVC_W = 256
const CORE_W = 272

interface Props {
  bot: Bot
  onBotUpdate: (updated: Partial<Bot>) => void
  onToggleActive: () => void
  togglingActive: boolean
}

function buildNodes(bot: Bot): Node[] {
  const services = serviceKindsFor(bot)
  const rowWidth = (services.length - 1) * SVC_COL_GAP
  // Centre the bot horizontally over the row of services.
  const coreX = rowWidth / 2 + (SVC_W - CORE_W) / 2

  const core: Node = {
    id: "core",
    type: "core",
    position: { x: coreX, y: TOP_Y },
    data: { bot, services },
    draggable: true,
  }
  const leaves: Node[] = services.map((kind, i) => ({
    id: kind,
    type: kind,
    position: { x: i * SVC_COL_GAP, y: SVC_Y },
    data: { bot },
    draggable: true,
  }))
  return [core, ...leaves]
}

function buildEdges(bot: Bot): Edge[] {
  return serviceKindsFor(bot).map((kind) => ({
    id: `e-core-${kind}`,
    source: "core",
    sourceHandle: `src-${kind}`,
    target: kind,
    type: "flow",
    style: { stroke: SERVICE_META[kind].accent },
  }))
}

/**
 * Railway-style canvas for one bot. The bot is the root node; each configurable
 * area branches off as a connected service node. Clicking a node opens a
 * floating, resizable config panel that keeps the canvas visible.
 */
export function BotCanvas({ bot, onBotUpdate, onToggleActive, togglingActive }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)

  const initialNodes = useMemo(() => buildNodes(bot), []) // eslint-disable-line react-hooks/exhaustive-deps
  const initialEdges = useMemo(() => buildEdges(bot), []) // eslint-disable-line react-hooks/exhaustive-deps

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)
  const [selected, setSelected] = useState<NodeKind | null>(null)

  // Keep node summaries + selection ring fresh as the bot is edited.
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...n.data, bot }, selected: n.type === selected })),
    )
  }, [bot, selected, setNodes])

  return (
    <div ref={wrapRef} className="relative flex-1 min-h-0 w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={canvasNodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => setSelected(node.type as NodeKind)}
        fitView
        fitViewOptions={{ padding: 0.3, minZoom: 0.6, maxZoom: 1 }}
        minZoom={0.4}
        maxZoom={1.5}
        nodesConnectable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        className="bg-muted/20"
      >
        <style>{`
          @keyframes ab-edge-flow { to { stroke-dashoffset: -624; } }
          .react-flow__pane { cursor: grab; }
          .react-flow__pane.dragging { cursor: grabbing; }
        `}</style>
        <Background variant={BackgroundVariant.Dots} gap={20} size={2.4} color="rgba(148,163,184,0.22)" />
        <Controls
          showInteractive={false}
          className="!bg-card !border !border-border !rounded-xl !shadow-sm !overflow-hidden"
        />
      </ReactFlow>

      {/* Hint */}
      {!selected && (
        <div className="absolute left-4 top-4 z-10 pointer-events-none">
          <p className="text-xs text-muted-foreground bg-card/80 backdrop-blur border border-border rounded-lg px-3 py-1.5 shadow-sm">
            Click a node to configure · drag to rearrange
          </p>
        </div>
      )}

      <NodePanel
        kind={selected}
        bot={bot}
        containerRef={wrapRef}
        onBotUpdate={onBotUpdate}
        onToggleActive={onToggleActive}
        togglingActive={togglingActive}
        onClose={() => setSelected(null)}
        onNavigate={setSelected}
      />
    </div>
  )
}
