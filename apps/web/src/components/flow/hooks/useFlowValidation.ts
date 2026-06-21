import { useMemo } from "react";
import type { Node, Edge } from "@xyflow/react";

export interface ValidationError {
  nodeId: string;
  field: string;
  message: string;
}

function validateNode(node: Node): ValidationError[] {
  const errs: ValidationError[] = [];
  const d = node.data as any;
  const id = node.id;

  switch (node.type) {
    case "message":
      if (!d.message?.trim())
        errs.push({ nodeId: id, field: "message", message: "Message text is required" });
      break;

    case "collect":
      if (!d.question?.trim())
        errs.push({ nodeId: id, field: "question", message: "Question is required" });
      if (!d.fieldName?.trim())
        errs.push({ nodeId: id, field: "fieldName", message: "Field name is required" });
      else if (!/^[a-z][a-z0-9_]*$/.test(d.fieldName))
        errs.push({ nodeId: id, field: "fieldName", message: "Must be snake_case (a-z, 0-9, _)" });
      break;

    case "choice":
      if (!d.question?.trim())
        errs.push({ nodeId: id, field: "question", message: "Question is required" });
      if (!d.fieldName?.trim())
        errs.push({ nodeId: id, field: "fieldName", message: "Field name is required" });
      if (!d.options?.length || d.options.length < 2)
        errs.push({ nodeId: id, field: "options", message: "At least 2 options required" });
      else if (d.options.some((o: any) => !o.label?.trim()))
        errs.push({ nodeId: id, field: "options", message: "All options must have a label" });
      break;

    case "webhook":
      if (!d.url?.trim())
        errs.push({ nodeId: id, field: "url", message: "Webhook URL is required" });
      else {
        try { new URL(d.url); }
        catch { errs.push({ nodeId: id, field: "url", message: "Must be a valid URL" }); }
      }
      break;

    case "end":
      if (!d.message?.trim())
        errs.push({ nodeId: id, field: "message", message: "Closing message is required" });
      if (d.action === "redirect" && !d.redirectUrl?.trim())
        errs.push({ nodeId: id, field: "redirectUrl", message: "Redirect URL is required" });
      break;
  }

  return errs;
}

function validateFlow(nodes: Node[], edges: Edge[]): ValidationError[] {
  const errs: ValidationError[] = [];

  // Structural checks
  const startNodes = nodes.filter(n => n.type === "start");
  const endNodes   = nodes.filter(n => n.type === "end");

  if (startNodes.length === 0)
    errs.push({ nodeId: "__flow__", field: "structure", message: "Flow must have a Start node" });
  if (startNodes.length > 1)
    errs.push({ nodeId: "__flow__", field: "structure", message: "Flow can only have one Start node" });
  if (endNodes.length === 0)
    errs.push({ nodeId: "__flow__", field: "structure", message: "Flow must have an End node" });

  // Connectivity — every non-start node must have at least one incoming edge
  const targets = new Set(edges.map(e => e.target));
  const sources = new Set(edges.map(e => e.source));

  for (const node of nodes) {
    if (node.type === "start") continue;
    if (!targets.has(node.id))
      errs.push({ nodeId: node.id, field: "connection", message: "Node has no incoming connection" });
  }

  // Every non-end node must have at least one outgoing edge
  for (const node of nodes) {
    if (node.type === "end") continue;
    if (!sources.has(node.id))
      errs.push({ nodeId: node.id, field: "connection", message: "Node has no outgoing connection" });
  }

  // Per-node field validation
  for (const node of nodes) {
    errs.push(...validateNode(node));
  }

  return errs;
}

export function useFlowValidation(nodes: Node[], edges: Edge[]) {
  const errors = useMemo(() => validateFlow(nodes, edges), [nodes, edges]);

  const byNode = useMemo(() => {
    const map = new Map<string, ValidationError[]>();
    for (const err of errors) {
      const list = map.get(err.nodeId) ?? [];
      list.push(err);
      map.set(err.nodeId, list);
    }
    return map;
  }, [errors]);

  const flowErrors = useMemo(
    () => errors.filter(e => e.nodeId === "__flow__"),
    [errors]
  );

  return {
    errors,
    byNode,
    flowErrors,
    isValid: errors.length === 0,
    getNodeErrors: (nodeId: string) => byNode.get(nodeId) ?? [],
  };
}
