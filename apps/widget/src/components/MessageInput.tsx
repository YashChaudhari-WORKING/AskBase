import { useState } from "react";
import { SendHorizonal } from "lucide-react";

interface Props {
  onSend: (content: string) => void;
  loading: boolean;
  primaryColor: string;
}

export function MessageInput({ onSend, loading, primaryColor }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || loading) return;
    onSend(value.trim());
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, borderTop: "1px solid #e5e7eb" }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type a message..."
        disabled={loading}
        style={{
          flex: 1,
          fontSize: 14,
          border: "1px solid #e5e7eb",
          borderRadius: 999,
          padding: "8px 16px",
          outline: "none",
          opacity: loading ? 0.5 : 1,
          fontFamily: "inherit",
        }}
      />
      <button
        type="submit"
        disabled={!value.trim() || loading}
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          backgroundColor: primaryColor,
          border: "none",
          cursor: "pointer",
          opacity: !value.trim() || loading ? 0.4 : 1,
          transition: "opacity 0.15s",
        }}
      >
        <SendHorizonal style={{ width: 16, height: 16, color: "#fff" }} />
      </button>
    </form>
  );
}
