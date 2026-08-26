import type { MeasuredMetric } from "../api/client";
import { ProvenanceBadge } from "./ProvenanceBadge";

interface MetricCardProps {
  label: string;
  metric: MeasuredMetric | null | undefined;
  unavailableHint?: string;
}

export function MetricCard({ label, metric, unavailableHint }: MetricCardProps) {
  const provenance = metric?.provenance ?? "unavailable";
  const hasValue = metric?.value !== null && metric?.value !== undefined;

  return (
    <article className="metric-card">
      <div className="metric-card__header">
        <h3>{label}</h3>
        <ProvenanceBadge provenance={provenance} />
      </div>
      <p className="metric-card__value">
        {hasValue ? (
          <>
            {metric?.value}
            {metric?.unit ? <span className="metric-card__unit"> {metric.unit}</span> : null}
          </>
        ) : (
          <span className="metric-card__missing">{unavailableHint ?? "Not available from current data sources."}</span>
        )}
      </p>
      {metric?.source ? <p className="metric-card__meta">Source: {metric.source}</p> : null}
      {metric?.method ? <p className="metric-card__meta">Method: {metric.method}</p> : null}
    </article>
  );
}
