import { useEffect, useState } from "react";
import type { CityContext, HistoricalTrendAnalysis } from "../api/client";
import { fetchHistoricalTrends } from "../api/client";
import { MetricCard } from "./MetricCard";

type InsightView = "thermal" | "trends" | "exposure" | "alerts";

interface CityInsightWorkspaceProps {
  context: CityContext | null;
  heatmapAvailable: boolean;
}

const UNAVAILABLE_MESSAGE = "This insight needs a validated data source that is not connected yet. GRADIENCE will not estimate it as observed data.";

export function CityInsightWorkspace({ context, heatmapAvailable }: CityInsightWorkspaceProps) {
  const [view, setView] = useState<InsightView>("thermal");
  const [trends, setTrends] = useState<HistoricalTrendAnalysis | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  const lat = context?.area.centroid.latitude ?? 33.4484;
  const lng = context?.area.centroid.longitude ?? -112.0740;

  useEffect(() => {
    if (view === "trends") {
      setTrendsLoading(true);
      setTrendsError(null);
      fetchHistoricalTrends(lat, lng, 3)
        .then((data) => {
          setTrends(data);
          setTrendsError(null);
        })
        .catch((err) => {
          setTrends(null);
          setTrendsError(err instanceof Error ? err.message : "Historical trends unavailable for this coordinate.");
        })
        .finally(() => setTrendsLoading(false));
    }
  }, [view, lat, lng]);

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
          ["trends", "Historical Trends (Multi-Year)"],
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

      {view === "trends" ? (
        <div className="insight-content">
          {trendsLoading ? (
            <p className="insight-lead">Loading multi-year historical climate baselines…</p>
          ) : trends ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{trends.city} Climate Trends ({trends.period_start} → {trends.period_end})</h3>
                  <p style={{ margin: "0.25rem 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>Classification: {trends.climate_classification}</p>
                </div>
                <span className="provenance-badge provenance-modeled">MODELED BASELINE</span>
              </div>

              <div className="metric-grid" style={{ marginBottom: "1.25rem" }}>
                <div className="metric-card">
                  <span className="metric-card__label">Decadal Trend Rate</span>
                  <span className="metric-card__value">+{trends.multi_year_trend_rate_c_per_decade}°C</span>
                  <span className="metric-card__meta">per 10 years</span>
                </div>
                <div className="metric-card">
                  <span className="metric-card__label">Summer Peak Mean</span>
                  <span className="metric-card__value">{trends.summer_peak_mean_c}°C</span>
                  <span className="metric-card__meta">Annual warmest month</span>
                </div>
                <div className="metric-card">
                  <span className="metric-card__label">Winter Low Mean</span>
                  <span className="metric-card__value">{trends.winter_low_mean_c}°C</span>
                  <span className="metric-card__meta">Annual coolest month</span>
                </div>
                <div className="metric-card">
                  <span className="metric-card__label">2030 Risk Projection</span>
                  <span className="metric-card__value">{trends.risk_projection_2030_c}°C</span>
                  <span className="metric-card__meta">Projected baseline</span>
                </div>
              </div>

              <div style={{ background: "#0f172a", borderRadius: "8px", padding: "1rem", border: "1px solid #334155" }}>
                <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", color: "#e2e8f0" }}>Recent Monthly Thermal Progression ({trends.data_points.length} months)</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "0.5rem", maxHeight: "180px", overflowY: "auto" }}>
                  {trends.data_points.slice(-12).map((pt) => (
                    <div key={pt.timestamp} style={{ background: "#1e293b", padding: "0.5rem", borderRadius: "6px", fontSize: "0.8rem", textAlign: "center" }}>
                      <div style={{ color: "#94a3b8", fontWeight: 600 }}>{pt.timestamp}</div>
                      <div style={{ color: "#f87171", fontWeight: 700, margin: "0.2rem 0" }}>{pt.surface_temp_c}°C</div>
                      <div style={{ color: "#64748b", fontSize: "0.75rem" }}>NDVI: {pt.vegetation_index_ndvi}</div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="metric-card__meta" style={{ marginTop: "0.75rem" }}>{trends.provenance_note}</p>
            </div>
          ) : (
            <UnavailableInsight
              title="Historical Trends"
              detail={trendsError || "Historical climate trend baselines are configured for pilot cities (Phoenix, Las Vegas, Houston). Select a supported location to view 36-month progression."}
            />
          )}
        </div>
      ) : null}

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

