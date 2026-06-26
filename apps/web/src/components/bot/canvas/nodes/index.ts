import { BotCoreNode } from "./BotCoreNode"
import { KnowledgeServiceNode } from "./KnowledgeServiceNode"
import { FlowsServiceNode } from "./FlowsServiceNode"
import { WidgetServiceNode } from "./WidgetServiceNode"
import { SettingsServiceNode } from "./SettingsServiceNode"

// React Flow node-type keys ↔ NodeKind values from service-meta.
export const canvasNodeTypes = {
  core: BotCoreNode,
  knowledge: KnowledgeServiceNode,
  flows: FlowsServiceNode,
  widget: WidgetServiceNode,
  settings: SettingsServiceNode,
}
