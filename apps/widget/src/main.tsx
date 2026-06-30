import { render } from "preact";
import { ChatWidget } from "./components/ChatWidget";

function init() {
  const script = document.currentScript as HTMLScriptElement | null;
  const fallbackScript = document.querySelector<HTMLScriptElement>("script[data-key]");

  const apiKey =
    script?.getAttribute("data-key") ??
    (window as any).__ASKBASE_KEY__ ??
    fallbackScript?.getAttribute("data-key") ??
    "";

  const apiUrl =
    script?.getAttribute("data-api-url") ??
    (window as any).__ASKBASE_API_URL ??
    fallbackScript?.getAttribute("data-api-url") ??
    (import.meta as any).env?.VITE_API_URL ??
    "http://localhost:4000/api";

  // Host element in the light DOM — Shadow DOM isolates the widget so the host
  // site's CSS (e.g. `button { width: 100% }`) can never leak in and break it.
  const host = document.createElement("div");
  host.id = "askbase-widget-host";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const container = document.createElement("div");
  container.id = "askbase-widget-root";
  shadow.appendChild(container);

  render(<ChatWidget apiKey={apiKey} apiUrl={apiUrl} />, container);
}

init();
