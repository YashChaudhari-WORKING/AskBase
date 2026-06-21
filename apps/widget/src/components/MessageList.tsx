import type { Message } from "../types";

interface Props {
  messages: Message[];
  primaryColor: string;
  agentTyping: boolean;
}

export function MessageList({ messages, primaryColor, agentTyping }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, overflowY: "auto", flex: 1 }}>
      {messages.map((msg) => (
        <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
          <div
            style={{
              maxWidth: "80%",
              borderRadius: 18,
              padding: "10px 16px",
              fontSize: 14,
              lineHeight: 1.5,
              ...(msg.role === "user"
                ? { backgroundColor: primaryColor, color: "#fff" }
                : { backgroundColor: "#f3f4f6", color: "#111827" }),
            }}
          >
            {msg.isHandoff && (
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, fontWeight: 600 }}>Connecting to agent...</div>
            )}
            {msg.content}
          </div>
        </div>
      ))}
      {agentTyping && (
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <div style={{ backgroundColor: "#f3f4f6", borderRadius: 18, padding: "10px 16px", fontSize: 14, color: "#6b7280" }}>
            Agent is typing...
          </div>
        </div>
      )}
    </div>
  );
}
