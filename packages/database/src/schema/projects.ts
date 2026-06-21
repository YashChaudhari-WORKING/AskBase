import { pgTable, uuid, varchar, text, timestamp, boolean, real, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { knowledgeBases } from "./knowledge-bases";
import { flows } from "./flows";

export const toneEnum = pgEnum("agent_tone", ["friendly", "formal", "technical", "concise", "compact", "custom"]);

// A "project" is a bot configuration. It references an optional knowledge base and flow.
// Deleting a bot never touches the knowledge base, documents, or flow.
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  knowledgeBaseId: uuid("knowledge_base_id").references(() => knowledgeBases.id, { onDelete: "set null" }),
  flowId: uuid("flow_id").references(() => flows.id, { onDelete: "set null" }),
  flowTrigger: text("flow_trigger"),
  assistantType: text("assistant_type").notNull().default("ai_agent"),
  responseTimeText: text("response_time_text"),
  quickLinks: jsonb("quick_links").$type<Array<{ label: string; url: string }>>().default([]),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt"),
  tone: toneEnum("tone").notNull().default("friendly"),
  welcomeMessage: text("welcome_message").notNull().default("Hi! How can I help you today?"),
  fallbackMessage: text("fallback_message").notNull().default("Let me connect you with a human agent."),
  primaryColor: varchar("primary_color", { length: 7 }).notNull().default("#6366f1"),
  confidenceThreshold: real("confidence_threshold").notNull().default(0.35),
  widgetThemeId: uuid("widget_theme_id"),
  attachedFlows: jsonb("attached_flows").$type<Array<{ flowId: string; flowName: string; trigger: string }>>().default([]),
  quickActions: jsonb("quick_actions").$type<Array<{ type: string; label: string; flowId?: string; flowName?: string; url?: string }>>().default([]),
  fallbackFlowId: uuid("fallback_flow_id"),
  notificationEmail: text("notification_email"),
  notificationWebhook: text("notification_webhook"),
  // Widget window settings
  widgetPosition: varchar("widget_position", { length: 20 }).notNull().default("bottom-right"),
  widgetCompact: boolean("widget_compact").notNull().default(false),
  openingMessages: jsonb("opening_messages").$type<Array<{ text: string; delaySeconds: number }>>().default([]),
  repeatMessages: boolean("repeat_messages").notNull().default(false),
  // Widget content (owned by the bot, not the theme)
  homeGreeting: varchar("home_greeting", { length: 200 }).notNull().default("How can we help?"),
  homeSubgreeting: varchar("home_subgreeting", { length: 200 }).notNull().default("We usually reply in a few minutes."),
  conversationStarters: jsonb("conversation_starters").$type<Array<{ label: string; message?: string }>>().default([]),
  widgetQuickReplies: jsonb("widget_quick_replies").$type<Array<{ label: string }>>().default([]),
  showHelpCenter: boolean("show_help_center").notNull().default(false),
  helpCenterTitle: varchar("help_center_title", { length: 100 }).notNull().default("Help & Resources"),
  helpArticles: jsonb("help_articles").$type<Array<{ title: string; url?: string }>>().default([]),
  helpCenterUrl: text("help_center_url"),
  // Bot identity & branding (owned by bot, not the visual theme)
  botAvatarEmoji: varchar("bot_avatar_emoji", { length: 10 }).notNull().default("💬"),
  botAvatarUrl: text("bot_avatar_url"),
  botSubtitle: varchar("bot_subtitle", { length: 100 }),
  inputPlaceholder: varchar("input_placeholder", { length: 100 }).notNull().default("Type a message…"),
  showPoweredBy: boolean("show_powered_by").notNull().default(true),
  footerText: varchar("footer_text", { length: 100 }),
  footerLinkUrl: text("footer_link_url"),
  businessHoursText: varchar("business_hours_text", { length: 100 }),
  allowAttachments: boolean("allow_attachments").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
