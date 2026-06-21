import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChatWidget } from "./components/ChatWidget";

function init() {
  const script = document.currentScript as HTMLScriptElement | null;
  // currentScript is null for dynamically injected scripts — fall back to global or last script tag
  const apiKey =
    script?.getAttribute("data-key") ??
    (window as any).__ASKBASE_KEY__ ??
    document.querySelector<HTMLScriptElement>("script[data-key]")?.getAttribute("data-key") ??
    "";

  const container = document.createElement("div");
  container.id = "askbase-widget-root";
  document.body.appendChild(container);

  createRoot(container).render(
    <StrictMode>
      <ChatWidget apiKey={apiKey} />
    </StrictMode>
  );
}

init();
