"use client"

import type { NodeProps } from "@xyflow/react"
import { ServiceNode, Row, StatusBadge } from "../ServiceNode"
import { SERVICE_META, colorCustomized } from "../service-meta"
import type { Bot } from "../../types"

export function WidgetServiceNode({ data, selected }: NodeProps) {
  const bot = (data as { bot: Bot }).bot
  const custom = colorCustomized(bot)
  const themed = bot.widgetThemeId !== null

  return (
    <ServiceNode
      meta={SERVICE_META.widget}
      selected={selected}
      status={custom ? "ok" : "muted"}
      statusLabel={custom ? "Custom" : "Default"}
    >
      <Row label="Brand color">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full border border-border/60"
            style={{ backgroundColor: bot.primaryColor }}
          />
          <span className="font-mono text-[11px]">{bot.primaryColor}</span>
        </span>
      </Row>
      <Row label="Position">{bot.widgetPosition === "bottom-left" ? "Bottom left" : "Bottom right"}</Row>
      <div className="pt-0.5">
        <StatusBadge tone={themed ? "ok" : "muted"}>
          {themed ? "Theme applied" : "Using base appearance"}
        </StatusBadge>
      </div>
    </ServiceNode>
  )
}
