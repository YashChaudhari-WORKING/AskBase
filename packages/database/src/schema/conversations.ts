import { pgTable, uuid, varchar, text, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { customers } from "./customers";
import { users } from "./users";

export const conversationStatusEnum = pgEnum("conversation_status", ["open", "assigned", "resolved", "closed"]);
export const conversationChannelEnum = pgEnum("conversation_channel", ["widget", "whatsapp", "email", "instagram"]);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  assignedAgentId: uuid("assigned_agent_id").references(() => users.id),
  status: conversationStatusEnum("status").notNull().default("open"),
  channel: conversationChannelEnum("channel").notNull().default("widget"),
  subject: varchar("subject", { length: 500 }),
  metadata: jsonb("metadata").default({}),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
