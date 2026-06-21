"use client";

import "@xyflow/react/dist/style.css";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  type Node,
  type Edge,
  type OnConnect,
} from "@xyflow/react";
import { ArrowLeft, Save, Loader2, Sparkles, Play, Settings, AlertTriangle, Globe, FileText, LayoutGrid, Users } from "lucide-react";
import api from "@/lib/api";
import { FlowBuilderCanvas } from "./FlowBuilderCanvas";
import { NodePalette } from "./panels/NodePalette";
import { ConfigPanel } from "./panels/ConfigPanel";
import { GeneratePanel } from "./panels/GeneratePanel";
import { PreviewPanel } from "./panels/PreviewPanel";
import { FlowSettingsPanel, type FlowSettings } from "./panels/FlowSettingsPanel";

import { useResizable } from "./hooks/useResizable";
import { useFlowValidation } from "./hooks/useFlowValidation";
import type { FlowData } from "./types";

interface Props {
  flow: FlowData;
}

const NODES_PER_COL = 5;
const COL_X = 300;
const ROW_Y = 160;
const ORIGIN_X = 50;
const ORIGIN_Y = 0;

function autoArrange(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    const list = adj.get(e.source) ?? [];
    list.push(e.target);
    adj.set(e.source, list);
  }
  const start = nodes.find(n => n.type === "start") ?? nodes[0];
  const visited = new Set<string>();
  const ordered: Node[] = [];
  const queue = [start.id];
  const byId = new Map(nodes.map(n => [n.id, n]));
  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const n = byId.get(id);
    if (n) ordered.push(n);
    for (const next of adj.get(id) ?? []) if (!visited.has(next)) queue.push(next);
  }
  for (const n of nodes) if (!visited.has(n.id)) ordered.push(n);

  return ordered.map((n, i) => {
    const col = Math.floor(i / NODES_PER_COL);
    const row = i % NODES_PER_COL;
    return { ...n, position: { x: ORIGIN_X + col * COL_X, y: ORIGIN_Y + row * ROW_Y } };
  });
}

function FlowBuilderInner({ flow }: Props) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(flow.nodes ?? []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flow.edges ?? []);
  const { fitView } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const palette = useResizable(210, 140, 340, "right");
  const config  = useResizable(270, 200, 420, "left");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [isActive, setIsActive] = useState(flow.isActive);
  const [flowName, setFlowName] = useState(flow.name);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<FlowSettings>({
    description: flow.description ?? "",
    mode: flow.mode ?? "standalone",
    toolDescription: flow.toolDescription ?? "",
  });

  const validation = useFlowValidation(nodes, edges);

  const onConnect: OnConnect = useCallback(
    (params) => {
      setEdges(eds => addEdge(params, eds));
      setSaved(false);
    },
    [setEdges]
  );

  const handleNodesChange: typeof onNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    setSaved(false);
  }, [onNodesChange]);

  const handleEdgesChange: typeof onEdgesChange = useCallback((changes) => {
    onEdgesChange(changes);
    setSaved(false);
  }, [onEdgesChange]);

  const onAddNode = useCallback((node: Node) => {
    setNodes(nds => nds.concat(node));
    setSaved(false);
  }, [setNodes]);

  const updateNodeData = useCallback((nodeId: string, data: Record<string, any>) => {
    setNodes(nds =>
      nds.map(n => n.id === nodeId ? { ...n, data } : n)
    );
    setSelectedNode(prev => prev?.id === nodeId ? { ...prev, data } : prev);
    setSaved(false);
  }, [setNodes]);

  function handleSettingsChange(s: FlowSettings) {
    setSettings(s);
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      await api.put(`/flows/${flow.id}`, {
        name: flowName,
        nodes,
        edges,
        isActive,
        description: settings.description,
        mode: settings.mode,
        toolDescription: settings.toolDescription,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    const next = !isActive;
    setIsActive(next);
    setSaving(true);
    try {
      await api.put(`/flows/${flow.id}`, {
        name: flowName,
        nodes,
        edges,
        isActive: next,
        description: settings.description,
        mode: settings.mode,
        toolDescription: settings.toolDescription,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function handleGenerated(newNodes: any[], newEdges: any[]) {
    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedNode(null);
    setSaved(false);
  }

  function handleAutoArrange() {
    const arranged = autoArrange(nodes, edges);
    setNodes(arranged);
    setSaved(false);
    requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300 }));
  }

  const totalErrors = validation.errors.length;

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 h-[52px] border-b border-border flex-shrink-0 bg-background">
        {/* Back */}
        <button
          onClick={() => router.push("/dashboard/flows")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Flows
        </button>

        <div className="w-px h-4 bg-border mx-1 shrink-0" />

        {/* Flow name */}
        <input
          value={flowName}
          onChange={e => { setFlowName(e.target.value); setSaved(false); }}
          className="text-sm font-semibold bg-transparent border-none outline-none text-foreground min-w-0 w-48"
          placeholder="Untitled Flow"
        />

        <div className="flex-1" />

        {/* Validation warning */}
        {totalErrors > 0 && (
          <span className="flex items-center gap-1 text-xs font-medium text-amber-500 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
            {totalErrors} issue{totalErrors > 1 ? "s" : ""}
          </span>
        )}

        {/* Unsaved indicator */}
        {!saved && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}

        {/* Toolbar group */}
        <div className="flex items-center gap-0.5 bg-muted border border-border rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => router.push(`/dashboard/flows/${flow.id}/leads`)}
            className="h-8 flex items-center gap-1.5 px-3 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-all"
          >
            <Users className="w-4 h-4" />
            Leads
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="h-8 flex items-center gap-1.5 px-3 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-all"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={handleAutoArrange}
            disabled={nodes.length === 0}
            title="Compact arrange — stack nodes in 5-per-column grid"
            className="h-8 flex items-center gap-1.5 px-3 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-all disabled:opacity-40"
          >
            <LayoutGrid className="w-4 h-4" />
            Arrange
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="h-8 flex items-center gap-1.5 px-3 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-all"
          >
            <Play className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => setShowGenerate(true)}
            className="h-8 flex items-center gap-1.5 px-3 rounded-md text-sm font-medium text-primary hover:bg-primary/10 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Generate
          </button>
        </div>

        {/* Publish */}
        <button
          onClick={toggleActive}
          className={`h-8 flex items-center gap-1.5 px-3.5 rounded-lg text-sm font-medium transition-all shrink-0 ${
            isActive
              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
              : "bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          {isActive ? <Globe className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          {isActive ? "Published" : "Draft"}
        </button>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving || saved}
          className="h-8 flex items-center gap-1.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 shrink-0"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Modals */}
      {showGenerate && (
        <GeneratePanel
          flowId={flow.id}
          onGenerated={handleGenerated}
          onClose={() => setShowGenerate(false)}
        />
      )}

      {showPreview && (
        <PreviewPanel
          nodes={nodes}
          edges={edges}
          flowName={flowName}
          flowId={flow.id}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showSettings && (
        <FlowSettingsPanel
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Builder body */}
      <div className={`flex-1 flex min-h-0 ${palette.dragging || config.dragging ? "select-none cursor-col-resize" : ""}`}>
        <NodePalette width={palette.width} />

        {/* Palette resize handle */}
        <div
          onMouseDown={palette.onMouseDown}
          className={`w-1 flex-shrink-0 cursor-col-resize transition-colors ${palette.dragging ? "bg-primary/50" : "hover:bg-primary/30"}`}
        />

        <FlowBuilderCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeClick={setSelectedNode}
          onPaneClick={() => setSelectedNode(null)}
          onAddNode={onAddNode}
        />

        {selectedNode && (
          <>
            {/* Config resize handle */}
            <div
              onMouseDown={config.onMouseDown}
              className={`w-1 flex-shrink-0 cursor-col-resize transition-colors ${config.dragging ? "bg-primary/50" : "hover:bg-primary/30"}`}
            />
            <ConfigPanel
              node={selectedNode}
              width={config.width}
              errors={validation.getNodeErrors(selectedNode.id)}
              onChange={updateNodeData}
              onClose={() => setSelectedNode(null)}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function FlowBuilder({ flow }: Props) {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner flow={flow} />
    </ReactFlowProvider>
  );
}
