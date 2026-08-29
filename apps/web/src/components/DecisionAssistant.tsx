import { useState } from "react";
import { askWhatIf, respondChatbot, type WhatIfResult } from "../api/client";

interface DecisionAssistantProps {
  latitude: number;
  longitude: number;
  workflow?: "observe" | "simulate" | "optimize" | "city" | "development" | "mobility";
}

const WHAT_IF_PROMPTS = [
  "What happens if we remove 10% vegetation in this zone?",
  "What happens if this development footprint is approved?",
  "When should this event start?",
];

const AI_PROMPTS = [
  "What is the hottest microclimate in this zone and why?",
  "What mitigation strategy gives the highest cooling per dollar?",
  "How can emergency operations avoid peak heat exposure?",
];

export function DecisionAssistant({ latitude, longitude, workflow = "observe" }: DecisionAssistantProps) {
  const [mode, setMode] = useState<"ai" | "whatif">("ai");
  const [question, setQuestion] = useState(AI_PROMPTS[0]);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      if (mode === "whatif") {
        const res = await askWhatIf({ question, location: { latitude, longitude } });
        setWhatIfResult(res);
        setAiResult(null);
      } else {
        const wfKey = ["city", "observe"].includes(workflow) ? "observe" : ["development", "simulate"].includes(workflow) ? "simulate" : "optimize";
        const res = await respondChatbot(wfKey, question);
        setAiResult(res.response);
        setWhatIfResult(null);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Assistant request failed.");
    } finally {
      setLoading(false);
    }
  };

  const prompts = mode === "ai" ? AI_PROMPTS : WHAT_IF_PROMPTS;

  return (
    <aside className="panel decision-assistant">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <p className="eyebrow" style={{ margin: 0 }}>Decision Assistant</p>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button
            type="button"
            className={mode === "ai" ? "primary-button" : "ghost-button"}
            style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
            onClick={() => {
              setMode("ai");
              setQuestion(AI_PROMPTS[0]);
              setError(null);
            }}
          >
            AI Search & Chat
          </button>
          <button
            type="button"
            className={mode === "whatif" ? "primary-button" : "ghost-button"}
            style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
            onClick={() => {
              setMode("whatif");
              setQuestion(WHAT_IF_PROMPTS[0]);
              setError(null);
            }}
          >
            What-If Engine
          </button>
        </div>
      </div>

      <h2>Ask Gradience</h2>
      <p>
        {mode === "ai"
          ? "AI thermal intelligence powered by Perplexity & Groq with real-world microclimate knowledge base."
          : "Deterministic engine with strict physical coefficients for development and land-cover queries."}
      </p>

      <label className="what-if-input">
        Question
        <textarea
          rows={3}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={mode === "ai" ? "Ask any climate, thermal pattern, or routing question..." : "Enter a scenario question..."}
        />
      </label>

      <div className="assistant-prompts">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="ghost-button"
            onClick={() => setQuestion(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="primary-button"
        disabled={loading || !question.trim()}
        onClick={() => void handleAsk()}
      >
        {loading ? "Analyzing..." : mode === "ai" ? "Ask AI Assistant" : "Run What-If Analysis"}
      </button>

      {error ? <p className="error-banner">{error}</p> : null}

      {aiResult ? (
        <div className="assistant-response">
          <span className="provenance-badge provenance-derived">AI Thermal Intelligence</span>
          <p style={{ whiteSpace: "pre-wrap" }}>{aiResult}</p>
        </div>
      ) : null}

      {whatIfResult ? (
        <div className="assistant-response">
          <span className="provenance-badge provenance-modeled">Deterministic</span>
          <p>{whatIfResult.summary}</p>
          <small>{whatIfResult.intent.replaceAll("_", " ")}</small>
        </div>
      ) : null}
    </aside>
  );
}
