import { useState } from "react";
import type { CityContext } from "../api/client";
import { MetricCard } from "./MetricCard";

type InsightView = "thermal" | "trends" | "exposure" | "alerts";

interface CityInsightWorkspaceProps {
  context: CityContext | null;
  heatmapAvailable: boolean;
}

const UNAVAILABLE_MESSAGE = "This insight needs a validated data source that is not connected yet. GRADIENCE will not estimate it as observed data.";

export function CityInsightWorkspace({ context, heatmapAvailable }: CityInsightWorkspaceProps) {
  const [view, setView] = useState<InsightView>("thermal");

  return (
    <section className="panel city-insight-workspace">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">City intelligence</p>
          <h2>Understand the selected place</h2>
          <p>Move between current thermal conditions, historical evidence, exposure, and data-backed alerts.</p>
        </div>
        <span className={heatmapAvailable ? "status-pill status-online" : "status-pill status-warning"}>
          {heatmapAvailable ? "Thermal observation available" : "Awaiting thermal observation"}
        </span>
      </div>

      <div className="insight-tabs" role="tablist" aria-label="City intelligence views">
        {([
          ["thermal", "Thermal state"],
          ["trends", "Trends"],
          ["exposure", "Exposure"],
          ["alerts", "Alerts"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={view === key}
            className={view === key ? "insight-tab active" : "insight-tab"}
            onClick={() => setView(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "thermal" ? (
        <div className="insight-content">
          <p className="insight-lead">
            {heatmapAvailable
              ? "The metrics below are enriched from the completed FortyGuard heatmap and retain their source and method."
              : "Select a location and request a live thermal heatmap to populate observed thermal conditions."}
          </p>
          <div className="metric-grid">
            <MetricCard label="Surface temperature" metric={context?.thermal.surface_temperature ?? null} />
            <MetricCard label="Thermal anomaly" metric={context?.thermal.thermal_anomaly ?? null} />
            <MetricCard label="Heat risk" metric={context?.thermal.heat_risk ?? null} />
            <MetricCard label="AQI" metric={context?.environmental.aqi ?? null} />
          </div>
        </div>
      ) : null}

      {view === "trends" ? <UnavailableInsight title="Historical trends" detail="7-day, 30-day, and annual changes require stored, timestamped observations for this AOI." /> : null}
      {view === "exposure" ? <UnavailableInsight title="Exposure intelligence" detail="Population and vulnerable-group exposure require validated population, infrastructure, and methodology inputs." /> : null}
      {view === "alerts" ? <UnavailableInsight title="Data-backed alerts" detail="Alerts will appear only when repeated observations or approved thresholds support them." /> : null}
    </section>
  );
}

function UnavailableInsight({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="unavailable-insight">
      <span className="provenance-badge provenance-unavailable">Unavailable</span>
      <h3>{title}</h3>
      <p>{detail}</p>
      <p className="metric-card__meta">{UNAVAILABLE_MESSAGE}</p>
    </div>
  );
}
