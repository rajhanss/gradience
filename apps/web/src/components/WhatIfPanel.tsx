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
          <div className="what-if-result__heading">
            <div>
              <p className="what-if-intent">Resolved workflow · {result.intent.replaceAll("_", " ")}</p>
              <h3>{result.summary}</h3>
            </div>
            <span className="provenance-badge provenance-modeled">Deterministic model</span>
          </div>
          <WhatIfDetails intent={result.intent} payload={result.payload} />
          <p className="metric-card__meta">{result.method} · {result.source}</p>
        </article>
      ) : null}
    </section>
  );
}

function WhatIfDetails({ intent, payload }: Pick<WhatIfResult, "intent" | "payload">) {
  if (intent === "event_timing") {
    const recommended = payload.recommended_start_hour;
    return <p className="what-if-result__detail">Recommended modeled start: <strong>{typeof recommended === "number" ? `${String(recommended).padStart(2, "0")}:00` : "Unavailable"}</strong>. This is a comparative thermal-exposure index, not a weather forecast.</p>;
  }
  if (intent === "route_optimization") {
    const optimization = payload.optimization as { recommended_route_id?: string } | undefined;
    return <p className="what-if-result__detail">Recommended modeled route: <strong>{optimization?.recommended_route_id?.replaceAll("-", " ") ?? "Unavailable"}</strong>. Open Mobility &amp; Operations for full route and timing comparison.</p>;
  }
  if (intent === "vegetation_change" || intent === "development_impact") {
    const comparison = payload.comparison as { proposed?: { delta_surface_temperature?: { value?: number | null; unit?: string | null } }; optimized?: { delta_surface_temperature?: { value?: number | null; unit?: string | null } } } | undefined;
    const proposed = comparison?.proposed?.delta_surface_temperature;
    const optimized = comparison?.optimized?.delta_surface_temperature;
    return <div className="what-if-result__metrics"><span>Proposed <strong>{proposed?.value ?? "Unavailable"}{proposed?.unit ? ` ${proposed.unit}` : ""}</strong></span><span>Optimized <strong>{optimized?.value ?? "Unavailable"}{optimized?.unit ? ` ${optimized.unit}` : ""}</strong></span></div>;
  }
  return <p className="what-if-result__detail">Choose one of the suggested questions to route it to a currently supported decision workflow.</p>;
}
