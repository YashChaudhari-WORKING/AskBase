"use client";

import Script from "next/script";

/**
 * Embeds the live AskBase concierge bot on the marketing site.
 * The bundle is served from /askbase-widget.js (apps/web/public) and points
 * at the same API as the dashboard. Key + API URL are overridable via env.
 */
const WIDGET_KEY =
  process.env.NEXT_PUBLIC_ASKBASE_WIDGET_KEY ??
  "ask_live_33e8db86ee7d8f61258a498f4f0c1c18"; // AskBase Concierge

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export function AskBaseWidget() {
  return (
    <Script
      src="/askbase-widget.js"
      strategy="afterInteractive"
      data-key={WIDGET_KEY}
      data-api-url={API_URL}
    />
  );
}
