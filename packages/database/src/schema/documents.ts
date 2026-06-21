import { pgTable, uuid, varchar, text, timestamp, pgEnum, integer, jsonb } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";
import { knowledgeBases } from "./knowledge-bases";

export const documentStatusEnum = pgEnum("document_status", ["processing", "ready", "failed"]);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  uploadedById: uuid("uploaded_by_id").references(() => users.id),
  knowledgeBaseId: uuid("knowledge_base_id").references(() => knowledgeBases.id, { onDelete: "set null" }),
  title: varchar("title", { length: 500 }).notNull(),
  fileName: varchar("file_name", { length: 500 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  fileSize: integer("file_size").notNull(),
  storagePath: text("storage_path").notNull(),
  status: documentStatusEnum("status").notNull().default("processing"),
  chunkCount: integer("chunk_count").notNull().default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
