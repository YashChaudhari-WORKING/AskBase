import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { conversations } from "./conversations";
import { users } from "./users";
import { messages } from "./messages";

export const handoffStatusEnum = pgEnum("handoff_status", ["pending", "accepted", "resolved"]);

export const handoffs = pgTable("handoffs", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  triggeredByMessageId: uuid("triggered_by_message_id").references(() => messages.id),
  assignedAgentId: uuid("assigned_agent_id").references(() => users.id),
  status: handoffStatusEnum("status").notNull().default("pending"),
  reason: text("reason"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Handoff = typeof handoffs.$inferSelect;
export type NewHandoff = typeof handoffs.$inferInsert;
