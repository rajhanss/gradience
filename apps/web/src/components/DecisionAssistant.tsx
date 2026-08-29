import { useState } from "react";
import { askWhatIf, type WhatIfResult } from "../api/client";

interface DecisionAssistantProps {
  latitude: number;
  longitude: number;
}

const PROMPTS = [
  "What happens if we remove 10% vegetation in this zone?",
  "What happens if this development footprint is approved?",
  "When should this event start?",
];

export function DecisionAssistant({ latitude, longitude }: DecisionAssistantProps) {
  const [question, setQuestion] = useState(PROMPTS[0]);
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    setLoading(true); setError(null);
    try { setResult(await askWhatIf({ question, location: { latitude, longitude } })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Assistant request failed."); }
    finally { setLoading(false); }
  };

  return <aside className="panel decision-assistant">
    <p className="eyebrow">Decision assistant</p>
    <h2>Ask Gradience</h2>
    <p>This assistant uses the deterministic What-If engine. It does not claim LLM analysis or invent live conditions.</p>
    <label className="what-if-input">Question<textarea rows={3} value={question} onChange={(event) => setQuestion(event.target.value)} /></label>
    <div className="assistant-prompts">{PROMPTS.map((prompt) => <button key={prompt} type="button" className="ghost-button" onClick={() => setQuestion(prompt)}>{prompt}</button>)}</div>
    <button type="button" className="primary-button" disabled={loading} onClick={() => void ask()}>{loading ? "Analyzing…" : "Ask assistant"}</button>
    {error ? <p className="error-banner">{error}</p> : null}
    {result ? <div className="assistant-response"><span className="provenance-badge provenance-modeled">Deterministic</span><p>{result.summary}</p><small>{result.intent.replaceAll("_", " ")}</small></div> : null}
  </aside>;
}
