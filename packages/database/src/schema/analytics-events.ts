import { pgTable, uuid, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { conversations } from "./conversations";

export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  payload: jsonb("payload").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
