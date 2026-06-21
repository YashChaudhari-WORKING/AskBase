import {
  StartIcon, MessageIcon, CollectIcon, ChoiceIcon,
  LeadSaveIcon, WebhookIcon, GoogleSheetIcon, EndIcon,
} from "./icons/NodeIcons";
import type { FlowNodeType } from "./types";

export const NODE_META: Record<FlowNodeType, {
  label: string;
  color: string;
  icon: React.ElementType;
  description: string;
}> = {
  start:     { label: "Start",     color: "#10b981", icon: StartIcon,    description: "Begin the conversation" },
  message:   { label: "Message",   color: "#3b82f6", icon: MessageIcon,  description: "Say something to the user" },
  collect:   { label: "Collect",   color: "#8b5cf6", icon: CollectIcon,  description: "Ask a question" },
  choice:    { label: "Choice",    color: "#f59e0b", icon: ChoiceIcon,   description: "Let the user pick an option" },
  lead_save: { label: "Save Lead", color: "#22c55e", icon: LeadSaveIcon, description: "Save the contact info" },
  webhook:      { label: "Webhook",      color: "#f43f5e", icon: WebhookIcon,      description: "Send data to a URL" },
  google_sheet: { label: "Google Sheet", color: "#16a34a", icon: GoogleSheetIcon, description: "Append a row to Google Sheets" },
  end:          { label: "End",          color: "#64748b", icon: EndIcon,          description: "Finish the conversation" },
};

export const PALETTE_ORDER: FlowNodeType[] = [
  "start", "message", "collect", "choice", "lead_save", "webhook", "google_sheet", "end",
];

export function defaultNodeData(type: FlowNodeType): Record<string, any> {
  switch (type) {
    case "start":
      return { trigger: "widget_open", delaySeconds: 3 };
    case "message":
      return { message: "" };
    case "collect":
      return { question: "", fieldName: "", fieldType: "text", required: true, placeholder: "" };
    case "choice":
      return {
        question: "",
        fieldName: "",
        options: [
          { id: "opt_1", label: "Option 1", value: "option_1" },
          { id: "opt_2", label: "Option 2", value: "option_2" },
        ],
        multiple: false,
      };
    case "lead_save":
      return { notifyEmail: "" };
    case "webhook":
      return { url: "", method: "POST", secret: "" };
    case "google_sheet":
      return { webAppUrl: "" };
    case "end":
      return { message: "Thanks! We'll be in touch soon.", action: "close", redirectUrl: "" };
  }
}
