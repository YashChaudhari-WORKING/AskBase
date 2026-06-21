export interface Bot {
  id: string
  name: string
  description: string | null
  systemPrompt: string | null
  tone: "friendly" | "formal" | "technical" | "concise" | "compact" | "custom"
  assistantType: "ai_agent" | "flow" | "hybrid"
  welcomeMessage: string
  fallbackMessage: string
  primaryColor: string
  responseTimeText: string | null
  quickLinks: Array<{ label: string; url: string }>
  quickActions: Array<{ type: string; label: string; flowId?: string; flowName?: string; url?: string }>
  fallbackFlowId: string | null
  notificationEmail: string | null
  notificationWebhook: string | null
  widgetPosition: "bottom-right" | "bottom-left"
  widgetCompact: boolean
  openingMessages: Array<{ text: string; delaySeconds: number }>
  repeatMessages: boolean
  homeGreeting: string
  homeSubgreeting: string
  conversationStarters: Array<{ label: string; message?: string }>
  widgetQuickReplies: Array<{ label: string }>
  showHelpCenter: boolean
  helpCenterTitle: string
  helpArticles: Array<{ title: string; url?: string }>
  helpCenterUrl: string | null
  botAvatarEmoji: string
  botAvatarUrl: string | null
  botSubtitle: string | null
  inputPlaceholder: string
  showPoweredBy: boolean
  footerText: string | null
  footerLinkUrl: string | null
  businessHoursText: string | null
  allowAttachments: boolean
  confidenceThreshold: number
  flowTrigger: string | null
  attachedFlows: Array<{ flowId: string; flowName: string; trigger: string }>
  isActive: boolean
  widgetThemeId: string | null
  createdAt: string
  updatedAt: string
  knowledgeBase: { id: string; name: string } | null
  flow: { id: string; name: string } | null
  apiKey: { id: string; keyPrefix: string } | null
}

export interface KnowledgeBase {
  id: string
  name: string
  description: string | null
  documentCount: number
}

export interface FlowItem {
  id: string
  name: string
  description: string | null
  mode: string
}

export type QuickAction = { type: string; label: string; flowId?: string; flowName?: string; url?: string }

export interface WidgetThemeSummary {
  id: string
  name: string
  primaryColor: string
  headerBgColor: string
  headerTextColor: string
  chatBgColor: string
  botBubbleBg: string
  userBubbleBg: string
  botName: string
  botAvatarEmoji: string
  launcherBgColor: string
  borderRadius: string
}

export interface SettingsState {
  systemPrompt: string
  tone: Bot["tone"]
  fallbackMessage: string
  confidenceThreshold: number
  isCustomConfidence: boolean
  notificationEmail: string
  notificationWebhook: string
}

export interface ChatMsg {
  id: string
  role: "user" | "bot"
  content: string
  choices?: Array<{ id: string; label: string; value: string }>
}

export interface FlowNode {
  id: string
  type: string
  data: Record<string, any>
}
