export interface WidgetTheme {
  headerBg: string;
  headerText: string;
  chatBg: string;
  botBg: string;
  botText: string;
  userBg: string;
  userText: string;
  accent: string;
  launcherBg: string;
  launcherIconUrl: string | null;
  radius: string;
  fontSize: string;
  showTimestamps: boolean;
}

export interface WidgetConfig {
  name: string;
  welcomeMessage: string;
  primaryColor: string;
  botAvatarEmoji: string;
  botAvatarUrl: string | null;
  botSubtitle: string;
  widgetPosition: "bottom-right" | "bottom-left";
  openingMessages: Array<{ text: string; delaySeconds: number }>;
  repeatMessages: boolean;
  homeGreeting: string;
  homeSubgreeting: string;
  conversationStarters: Array<{ label: string; message?: string }>;
  inputPlaceholder: string;
  widgetQuickReplies: Array<{ label: string }>;
  allowAttachments: boolean;
  showHelpCenter: boolean;
  helpCenterTitle: string;
  helpArticles: Array<{ title: string; url?: string }>;
  helpCenterUrl: string | null;
  showPoweredBy: boolean;
  footerText: string;
  footerLinkUrl: string;
  businessHoursText: string;
  theme: WidgetTheme | null;
}

export interface ChatMsg {
  id: string;
  role: "user" | "bot";
  content: string;
  choices?: Array<{ id: string; label: string; value: string }>;
}

export interface FlowEdge {
  id?: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
}

export interface FlowNode {
  id: string;
  type: string;
  data: {
    message?: string;
    question?: string;
    fieldName?: string;
    fieldType?: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    step?: number;
    minDate?: string;
    maxDate?: string;
    pattern?: string;
    placeholder?: string;
    helpText?: string;
    options?: Array<{ id: string; label: string; value: string }>;
    notifyEmail?: string;
    url?: string;
    method?: string;
    action?: string;
    redirectUrl?: string;
  };
}
