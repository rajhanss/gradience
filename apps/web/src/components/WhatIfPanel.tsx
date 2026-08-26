import { useState } from "react";
import type { WhatIfResult } from "../api/client";
import { askWhatIf } from "../api/client";

interface WhatIfPanelProps {
  latitude: number;
  longitude: number;
}

const EXAMPLES = [
  "What happens if we remove 10% vegetation in this zone?",
  "What happens if this development footprint is approved?",
  "Which route minimizes thermal exposure?",
  "When should this event start?",
];

export function WhatIfPanel({ latitude, longitude }: WhatIfPanelProps) {
  const [question, setQuestion] = useState(EXAMPLES[0]);
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(
        await askWhatIf({
          question,
          location: { latitude, longitude },
          parameters:
            question.toLowerCase().includes("route")
              ? {
                  origin: { latitude, longitude },
                  destination: { latitude: latitude + 0.06, longitude: longitude + 0.06 },
                }
              : {},
        }),
      );
    } catch (whatIfError) {
      setResult(null);
      setError(whatIfError instanceof Error ? whatIfError.message : "What-If request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel workflow-panel">
      <div className="panel-heading">
        <div>
          <h2>Universal City What-If</h2>
          <p>Deterministic intent routing today; LLM layer can plug in later.</p>
        </div>
        <button type="button" className="primary-button" disabled={loading} onClick={() => void submit()}>
          {loading ? "Analyzing…" : "Ask"}
        </button>
      </div>

      <label className="what-if-input">
        Question
        <textarea value={question} rows={3} onChange={(event) => setQuestion(event.target.value)} />
      </label>

      <div className="example-chips">
        {EXAMPLES.map((example) => (
          <button key={example} type="button" className="ghost-button" onClick={() => setQuestion(example)}>
            {example}
          </button>
        ))}
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      {result ? (
        <article className="what-if-result">
          <p className="what-if-intent">Intent: {result.intent}</p>
          <p>{result.summary}</p>
          <p className="metric-card__meta">
            {result.method} · {result.source}
          </p>
          <pre>{JSON.stringify(result.payload, null, 2)}</pre>
        </article>
      ) : null}
    </section>
  );
}
