"use client"

import type { NodeProps } from "@xyflow/react"
import { ServiceNode, Row, StatusBadge } from "../ServiceNode"
import { SERVICE_META } from "../service-meta"
import type { Bot } from "../../types"

export function KnowledgeServiceNode({ data, selected }: NodeProps) {
  const bot = (data as { bot: Bot }).bot
  const attached = Boolean(bot.knowledgeBase)

  return (
    <ServiceNode
      meta={SERVICE_META.knowledge}
      selected={selected}
      status={attached ? "ok" : "warn"}
      statusLabel={attached ? "Connected" : "Empty"}
    >
      <Row label="Source">{attached ? bot.knowledgeBase!.name : "Not attached"}</Row>
      <Row label="Used for">RAG answers</Row>
      <div className="pt-0.5">
        <StatusBadge tone={attached ? "ok" : "warn"}>
          {attached ? "Answering from documents" : "No documents to reference"}
        </StatusBadge>
      </div>
    </ServiceNode>
  )
}
