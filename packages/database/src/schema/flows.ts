import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const flowModeEnum = pgEnum("flow_mode", ["standalone", "ai_tool"]);
export const flowLeadStatusEnum = pgEnum("flow_lead_status", ["new", "contacted", "qualified", "won", "lost"]);

export const flows = pgTable("flows", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  nodes: jsonb("nodes").notNull().default([]),
  edges: jsonb("edges").notNull().default([]),
  mode: flowModeEnum("mode").notNull().default("standalone"),
  toolDescription: text("tool_description"),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const flowLeads = pgTable("flow_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  flowId: uuid("flow_id").notNull().references(() => flows.id, { onDelete: "cascade" }),
  data: jsonb("data").notNull().default({}),
  status: flowLeadStatusEnum("status").notNull().default("new"),
  isPartial: boolean("is_partial").notNull().default(false),
  tags: text("tags").array().notNull().default([]),
  conversation: jsonb("conversation").notNull().default([]),
  notes: text("notes"),
  sourceUrl: text("source_url"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Flow = typeof flows.$inferSelect;
export type NewFlow = typeof flows.$inferInsert;
export type FlowLead = typeof flowLeads.$inferSelect;
