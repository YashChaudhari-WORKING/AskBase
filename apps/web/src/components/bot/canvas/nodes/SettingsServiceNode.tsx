"use client"

import type { NodeProps } from "@xyflow/react"
import { ServiceNode, Row, StatusBadge } from "../ServiceNode"
import { SERVICE_META, systemPromptSet } from "../service-meta"
import type { Bot } from "../../types"

export function SettingsServiceNode({ data, selected }: NodeProps) {
  const bot = (data as { bot: Bot }).bot
  const promptSet = systemPromptSet(bot)
  const isFlow = bot.assistantType === "flow"
  const handoffPct = Math.round(bot.confidenceThreshold * 100)

  return (
    <ServiceNode
      meta={SERVICE_META.settings}
      selected={selected}
      status={isFlow || promptSet ? "ok" : "warn"}
      statusLabel={isFlow || promptSet ? "Configured" : "Defaults"}
    >
      <Row label="Tone"><span className="capitalize">{bot.tone}</span></Row>
      {!isFlow && <Row label="Handoff">{handoffPct}% confidence</Row>}
      <div className="pt-0.5">
        <StatusBadge tone={isFlow || promptSet ? "ok" : "warn"}>
          {isFlow
            ? "Guided capture behavior"
            : promptSet
              ? "System prompt set"
              : "No system prompt yet"}
        </StatusBadge>
      </div>
    </ServiceNode>
  )
}
