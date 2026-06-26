"use client"

import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react"

/**
 * Connection with a flowing dot traveling from the bot to each service node —
 * gives the canvas a live, "data-flowing" feel (Railway / n8n style).
 */
export function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
}: EdgeProps) {
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 20,
  })

  const color = (style?.stroke as string) ?? "var(--primary)"

  return (
    <>
      {/* Soft static base line */}
      <BaseEdge id={id} path={path} style={{ stroke: color, strokeWidth: 2, opacity: 0.2 }} />
      {/* A single glowing highlight that sweeps smoothly along the line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray="24 600"
        opacity={0.95}
        style={{
          animation: "ab-edge-flow 2.8s linear infinite",
          filter: `drop-shadow(0 0 5px ${color})`,
        }}
      />
    </>
  )
}
