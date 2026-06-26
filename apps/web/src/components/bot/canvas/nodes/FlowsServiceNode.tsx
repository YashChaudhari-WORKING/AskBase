"use client"

import type { NodeProps } from "@xyflow/react"
import { ServiceNode, Row, StatusBadge } from "../ServiceNode"
import { SERVICE_META } from "../service-meta"
import type { Bot } from "../../types"

export function FlowsServiceNode({ data, selected }: NodeProps) {
  const bot = (data as { bot: Bot }).bot
  const flows = bot.attachedFlows ?? []
  const count = flows.length
  const has = count > 0
  const firstNames = flows.slice(0, 2).map((f) => f.flowName).join(", ")

  return (
    <ServiceNode
      meta={SERVICE_META.flows}
      selected={selected}
      status={has ? "ok" : "muted"}
      statusLabel={has ? `${count} active` : "None"}
    >
      <Row label="Attached">{has ? `${count} flow${count !== 1 ? "s" : ""}` : "—"}</Row>
      {has && <Row label="Forms">{firstNames}{count > 2 ? ` +${count - 2}` : ""}</Row>}
      <div className="pt-0.5">
        <StatusBadge tone={has ? "ok" : "muted"}>
          {has ? "Trigger phrases route to forms" : "Add a flow to capture leads"}
        </StatusBadge>
      </div>
    </ServiceNode>
  )
}
