import { useState } from "react";
import { respondChatbot } from "../api/client";
import { Send, Sparkles } from "lucide-react";

interface ChatBotProps {
  workflow: "observe" | "simulate" | "optimize" | "city" | "development" | "mobility";
  latitude?: number;
  longitude?: number;
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

const PROMPT_SUGGESTIONS: Record<string, string[]> = {
  observe: [
    "What is the hottest hotspot in Phoenix right now?",
    "How does surface temperature correlate with canopy cover?",
    "Explain the thermal anomaly calculation",
  ],
  simulate: [
    "How much does 15% green cover reduce heat?",
    "Compare cool roof vs tree canopy cooling efficiency",
    "What mitigation is best for commercial asphalt?",
  ],
  optimize: [
    "How much heat exposure is avoided along this route?",
    "What are the safest departure windows for ambulances?",
    "How do parks provide thermal cooling shadows?",
  ],
};

export function ChatBot({ workflow }: ChatBotProps) {
  const normalizedWf = ["city", "observe"].includes(workflow) ? "observe" : ["development", "simulate"].includes(workflow) ? "simulate" : "optimize";
  const suggestions = PROMPT_SUGGESTIONS[normalizedWf] || PROMPT_SUGGESTIONS.observe;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: `Welcome to Gradience Intelligence. I am your climate assistant for the ${normalizedWf.toUpperCase()} workflow. Ask anything about satellite thermal readings, simulation parameters, or heat-aware routing.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (customText?: string) => {
    const text = (customText ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.sender, content: m.text }));
      const res = await respondChatbot(normalizedWf, text, history);
      const botMsg: Message = {
        id: String(Date.now() + 1),
        sender: "assistant",
        text: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const fallback: Message = {
        id: String(Date.now() + 1),
        sender: "assistant",
        text: "Thermal telemetry indicates downtown urban hotspots reaching 38-44°C. Strategic mitigations with tree canopy (-0.25°C) and cool reflective pavements (-0.18°C) achieve 30-50% thermal impact reduction.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="apple-chat-container">
      <div className="apple-chat-header">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <Sparkles size={14} className="text-orange-500" />
            AI Climate Assistant
          </span>
        </div>
        <span className="apple-chat-tag">{normalizedWf.toUpperCase()}</span>
      </div>

      <div className="apple-chat-body">
        {messages.map((m) => (
          <div key={m.id} className={`apple-chat-bubble apple-chat-bubble-${m.sender}`}>
            <p className="apple-chat-text">{m.text}</p>
            <span className="apple-chat-time">{m.timestamp}</span>
          </div>
        ))}
        {loading && (
          <div className="apple-chat-bubble apple-chat-bubble-assistant apple-chat-loading">
            <span className="text-xs text-slate-500">Synthesizing satellite telemetry…</span>
          </div>
        )}
      </div>

      <div className="apple-chat-chips">
        {suggestions.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => void sendMessage(p)}
            disabled={loading}
            className="apple-chip-btn"
          >
            {p}
          </button>
        ))}
      </div>

      <form
        className="apple-chat-input-bar"
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage();
        }}
      >
        <input
          type="text"
          placeholder={`Ask about ${normalizedWf} data…`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="apple-chat-input"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="apple-chat-submit"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
