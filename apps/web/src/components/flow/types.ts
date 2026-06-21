export type FlowNodeType =
  | "start"
  | "message"
  | "collect"
  | "choice"
  | "lead_save"
  | "webhook"
  | "google_sheet"
  | "end";

export interface StartData {
  trigger: "widget_open" | "delay";
  delaySeconds: number;
}

export interface MessageData {
  message: string;
}

export type FieldType = "text" | "email" | "phone" | "number" | "url" | "date" | "longtext";

export interface CollectData {
  question: string;
  fieldName: string;
  fieldType: FieldType;
  required: boolean;
  placeholder: string;
  // Validation (all optional, depend on fieldType)
  helpText?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  minDate?: string; // ISO yyyy-mm-dd OR sentinel ("today" | "future" | "past")
  maxDate?: string;
  pattern?: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
  value: string;
}

export interface ChoiceData {
  question: string;
  fieldName: string;
  options: ChoiceOption[];
  multiple: boolean;
  helpText?: string;
  required?: boolean;
}

export interface LeadSaveData {
  notifyEmail: string;
}

export interface WebhookData {
  url: string;
  method: "POST" | "GET";
  secret: string;
}

export interface GoogleSheetData {
  webAppUrl: string;
}

export interface EndData {
  message: string;
  action: "close" | "stay" | "redirect";
  redirectUrl: string;
}

export type AnyNodeData =
  | StartData
  | MessageData
  | CollectData
  | ChoiceData
  | LeadSaveData
  | WebhookData
  | GoogleSheetData
  | EndData;

export interface FlowData {
  id: string;
  name: string;
  description: string | null;
  mode: "standalone" | "ai_tool";
  isActive: boolean;
  nodes: any[];
  edges: any[];
  toolDescription: string | null;
}
