import { pgTable, uuid, text, timestamp, pgEnum, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { conversations } from "./conversations";
import { users } from "./users";

export const messageSenderEnum = pgEnum("message_sender", ["customer", "ai", "agent"]);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderType: messageSenderEnum("sender_type").notNull(),
  senderId: uuid("sender_id"),
  content: text("content").notNull(),
  confidenceScore: real("confidence_score"),
  isHandoffTrigger: boolean("is_handoff_trigger").notNull().default(false),
  sources: jsonb("sources").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
