import { pgTable, uuid, text, timestamp, real, boolean, integer, index } from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { conversations } from "./conversations";
import { users } from "./users";

export const learnedResponses = pgTable("learned_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  reviewedById: uuid("reviewed_by_id").references(() => users.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  embedding: vector("embedding", { dimensions: 1024 }),
  useCount: integer("use_count").notNull().default(0),
  isApproved: boolean("is_approved").notNull().default(true),
  confidenceBoost: real("confidence_boost").notNull().default(0.1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  embeddingIndex: index("learned_responses_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
}));

export type LearnedResponse = typeof learnedResponses.$inferSelect;
export type NewLearnedResponse = typeof learnedResponses.$inferInsert;
