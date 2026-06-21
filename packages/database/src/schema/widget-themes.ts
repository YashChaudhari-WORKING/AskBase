import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const widgetThemes = pgTable("widget_themes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull().default("My Theme"),

  // Branding
  botName: varchar("bot_name", { length: 100 }).notNull().default("Assistant"),
  botSubtitle: varchar("bot_subtitle", { length: 200 }).notNull().default("We reply in minutes"),
  botAvatarUrl: text("bot_avatar_url"),
  botAvatarEmoji: varchar("bot_avatar_emoji", { length: 10 }).notNull().default("⚡"),

  // Colors
  primaryColor: varchar("primary_color", { length: 7 }).notNull().default("#6366f1"),
  headerBgColor: varchar("header_bg_color", { length: 7 }).notNull().default("#6366f1"),
  headerTextColor: varchar("header_text_color", { length: 7 }).notNull().default("#ffffff"),
  chatBgColor: varchar("chat_bg_color", { length: 7 }).notNull().default("#f9fafb"),

  // Styling
  borderRadius: varchar("border_radius", { length: 10 }).notNull().default("xl"),

  // Messages
  botBubbleBg: varchar("bot_bubble_bg", { length: 7 }).notNull().default("#f3f4f6"),
  botBubbleText: varchar("bot_bubble_text", { length: 7 }).notNull().default("#111827"),
  userBubbleBg: varchar("user_bubble_bg", { length: 7 }).notNull().default("#6366f1"),
  userBubbleText: varchar("user_bubble_text", { length: 7 }).notNull().default("#ffffff"),
  showTimestamps: boolean("show_timestamps").notNull().default(false),

  // Launcher
  launcherPosition: varchar("launcher_position", { length: 20 }).notNull().default("bottom-right"),
  launcherBgColor: varchar("launcher_bg_color", { length: 7 }).notNull().default("#6366f1"),
  launcherIconEmoji: varchar("launcher_icon_emoji", { length: 10 }).notNull().default("💬"),
  launcherIconUrl: text("launcher_icon_url"),

  // Typography
  fontSize: varchar("font_size", { length: 10 }).notNull().default("14px"),

  // Input
  inputPlaceholder: varchar("input_placeholder", { length: 100 }).notNull().default("Type a message…"),
  sendButtonColor: varchar("send_button_color", { length: 7 }).notNull().default("#6366f1"),
  allowAttachments: boolean("allow_attachments").notNull().default(false),

  // Footer
  showPoweredBy: boolean("show_powered_by").notNull().default(true),
  footerText: varchar("footer_text", { length: 100 }),
  footerLinkUrl: text("footer_link_url"),

  // Quick replies
  quickReplies: jsonb("quick_replies").$type<Array<{ label: string }>>().default([]),

  // Home screen
  homeGreeting: varchar("home_greeting", { length: 200 }).notNull().default("How can we help?"),
  homeSubgreeting: varchar("home_subgreeting", { length: 200 }).notNull().default("We usually reply in a few minutes."),
  conversationStarters: jsonb("conversation_starters").$type<Array<{ label: string; message?: string }>>().default([]),

  // Help center
  showHelpCenter: boolean("show_help_center").notNull().default(false),
  helpCenterTitle: varchar("help_center_title", { length: 100 }).notNull().default("Help & Resources"),
  helpArticles: jsonb("help_articles").$type<Array<{ title: string; url?: string }>>().default([]),
  helpCenterUrl: text("help_center_url"),

  // Business hours
  businessHoursText: varchar("business_hours_text", { length: 200 }),

  // Advanced
  customCss: text("custom_css"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WidgetTheme = typeof widgetThemes.$inferSelect;
export type NewWidgetTheme = typeof widgetThemes.$inferInsert;
