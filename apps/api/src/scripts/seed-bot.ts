/**
 * Seed a bot with realistic test data for every configurable field.
 *
 * Usage:
 *   pnpm --filter @askbase/api tsx src/scripts/seed-bot.ts <botId>
 *
 * Example:
 *   pnpm --filter @askbase/api tsx src/scripts/seed-bot.ts abc123-uuid-here
 */

import { config } from "dotenv";
import { resolve } from "path";
// Try root .env first, fall back to local
config({ path: resolve(__dirname, "../../../../../.env") });
config({ path: resolve(__dirname, "../../../../.env") });
config({ path: resolve(process.cwd(), "../../.env") });
config();
import { db, projects } from "@askbase/database";
import { eq } from "drizzle-orm";

const botId = process.argv[2];

if (!botId) {
  console.error("Usage: tsx src/scripts/seed-bot.ts <botId>");
  console.error("Find your bot ID in the URL: /dashboard/bots/<botId>");
  process.exit(1);
}

async function main() {
  const [existing] = await db.select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(eq(projects.id, botId))
    .limit(1);

  if (!existing) {
    console.error(`Bot not found: ${botId}`);
    process.exit(1);
  }

  console.log(`Seeding bot: "${existing.name}" (${botId})`);

  const [updated] = await db
    .update(projects)
    .set({
      // ── Core ────────────────────────────────────────────────────────────
      welcomeMessage: "👋 Hey there! I'm your AI support assistant. Ask me anything about our products.",
      fallbackMessage: "I'll connect you with a human agent right away. One moment please!",
      systemPrompt: "You are a friendly, knowledgeable support assistant. Always answer concisely. If you don't know something, say so honestly and offer to connect the user with a human agent.",
      tone: "friendly",
      primaryColor: "#6366f1",
      responseTimeText: "Typically replies in under 30 seconds",

      // ── Auto trigger ────────────────────────────────────────────────────
      openingMessages: [
        { text: "👋 Need help getting started? I can answer any questions!", delaySeconds: 4 },
        { text: "💡 Try asking me about pricing, features, or how to set up your account.", delaySeconds: 12 },
      ],
      repeatMessages: false,

      // ── Home tab ────────────────────────────────────────────────────────
      homeGreeting: "Hi! How can we help you today? 👋",
      homeSubgreeting: "Our AI assistant is here 24/7. Ask anything.",

      // ── Conversation starters ───────────────────────────────────────────
      conversationStarters: [
        { label: "How does pricing work?", message: "Can you explain your pricing plans?" },
        { label: "I need help setting up", message: "I need help getting started with the setup process." },
        { label: "What integrations do you support?", message: "What third-party integrations are available?" },
        { label: "Talk to a human", message: "I'd like to speak with a human support agent." },
      ],

      // ── Quick replies ───────────────────────────────────────────────────
      widgetQuickReplies: [
        { label: "👍 That helped!" },
        { label: "I need more help" },
        { label: "Talk to a human" },
      ],

      // ── Quick links ──────────────────────────────────────────────────────
      quickLinks: [
        { label: "Documentation", url: "https://docs.example.com" },
        { label: "Status page", url: "https://status.example.com" },
        { label: "Community forum", url: "https://community.example.com" },
      ],

      // ── Help center ──────────────────────────────────────────────────────
      showHelpCenter: true,
      helpCenterTitle: "Help & Resources",
      helpArticles: [
        { title: "Getting started guide", url: "https://docs.example.com/getting-started" },
        { title: "How to connect your knowledge base", url: "https://docs.example.com/knowledge-base" },
        { title: "Widget customization options", url: "https://docs.example.com/widget" },
        { title: "Billing & subscription FAQ", url: "https://docs.example.com/billing" },
      ],
      helpCenterUrl: "https://docs.example.com",

      // ── Notifications ────────────────────────────────────────────────────
      notificationEmail: "support@example.com",

      // ── Confidence ───────────────────────────────────────────────────────
      confidenceThreshold: 0.35,

      // ── Widget window ────────────────────────────────────────────────────
      widgetPosition: "bottom-right",
      widgetCompact: false,

      updatedAt: new Date(),
    })
    .where(eq(projects.id, botId))
    .returning({ id: projects.id, name: projects.name });

  console.log(`\n✓ Bot "${updated.name}" seeded successfully!\n`);
  console.log("Fields populated:");
  console.log("  • welcomeMessage, fallbackMessage, systemPrompt, tone, primaryColor");
  console.log("  • openingMessages (2 messages — fires at 4s and 12s)");
  console.log("  • homeGreeting, homeSubgreeting");
  console.log("  • conversationStarters (4 starters)");
  console.log("  • widgetQuickReplies (3 chips)");
  console.log("  • quickLinks (3 links)");
  console.log("  • helpArticles (4 articles) + helpCenterUrl");
  console.log("  • notificationEmail, confidenceThreshold");
  console.log("\nNow open the bot overview page and wait 4 seconds to see the auto-trigger bubble.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
