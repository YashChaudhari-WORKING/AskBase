import { pgTable, uuid, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core";
import { documents } from "./documents";
import { tenants } from "./tenants";

export const chunks = pgTable("chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1024 }),
  chunkIndex: integer("chunk_index").notNull(),
  tokenCount: integer("token_count"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  embeddingIndex: index("chunks_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
}));

export type Chunk = typeof chunks.$inferSelect;
export type NewChunk = typeof chunks.$inferInsert;
