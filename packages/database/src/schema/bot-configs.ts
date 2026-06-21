import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, real } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const botConfigs = pgTable("bot_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }).unique(),
  botName: varchar("bot_name", { length: 100 }).notNull().default("Assistant"),
  welcomeMessage: text("welcome_message").notNull().default("Hi! How can I help you today?"),
  fallbackMessage: text("fallback_message").notNull().default("I'm not sure about that. Let me connect you with a human agent."),
  primaryColor: varchar("primary_color", { length: 7 }).notNull().default("#6366f1"),
  logoUrl: text("logo_url"),
  confidenceThreshold: real("confidence_threshold").notNull().default(0.7),
  maxContextMessages: integer("max_context_messages").notNull().default(10),
  model: varchar("model", { length: 100 }).notNull().default("gpt-4o"),
  systemPrompt: text("system_prompt"),
  allowedDomains: jsonb("allowed_domains").default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type BotConfig = typeof botConfigs.$inferSelect;
export type NewBotConfig = typeof botConfigs.$inferInsert;
