import { useEffect, useState } from "react";
import { fetchHotspotAnalysis, type HotspotAnalysis } from "../api/client";
import { MetricCard } from "./MetricCard";
import { ProvenanceBadge } from "./ProvenanceBadge";

interface HotspotPanelProps {
  activityId: string | null;
  latitude: number;
  longitude: number;
}

export function HotspotPanel({ activityId, latitude, longitude }: HotspotPanelProps) {
  const [analysis, setAnalysis] = useState<HotspotAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activityId) {
      setAnalysis(null);
      setError(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchHotspotAnalysis(activityId, latitude, longitude);
        if (!cancelled) {
          setAnalysis(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setAnalysis(null);
          setError(loadError instanceof Error ? loadError.message : "Hotspot analysis failed.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [activityId, latitude, longitude]);

  if (!activityId) {
    return (
      <section className="panel hotspot-panel">
        <h2>Hotspot Analysis</h2>
        <p className="info-banner">Request a live heatmap, then click a location inside the AOI to analyze why it is hot.</p>
      </section>
    );
  }

  return (
    <section className="panel hotspot-panel">
      <div className="panel-heading">
        <div>
          <h2>Hotspot Analysis</h2>
          <p>Why is this area hot? Derived from FortyGuard tile + AOI statistics only.</p>
        </div>
        {loading ? <span className="loading-chip">Analyzing…</span> : null}
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      {analysis ? (
        <>
          <p className="hotspot-explanation">{analysis.explanation}</p>
          {analysis.alerts.length ? (
            <ul className="hotspot-alerts">
              {analysis.alerts.map((alert) => (
                <li key={alert}>{alert}</li>
              ))}
            </ul>
          ) : null}
          <div className="metric-grid">
            <MetricCard label="Tile temperature" metric={analysis.tile_temperature} />
            <MetricCard label="AOI mean temperature" metric={analysis.area_mean_temperature} />
            <MetricCard label="Thermal anomaly" metric={analysis.thermal_anomaly} />
            <MetricCard label="Risk score" metric={analysis.risk_score} />
            <MetricCard label="Risk level" metric={analysis.risk_level} />
            <MetricCard label="Historical trend" metric={analysis.historical_trend} />
          </div>
          {analysis.decomposition.length ? (
            <div className="hotspot-decomposition">
              <h3>Risk decomposition</h3>
              <ul>
                {analysis.decomposition.map((factor) => (
                  <li key={factor.label}>
                    <strong>{factor.label}</strong>
                    <span>{factor.detail}</span>
                    {factor.contribution ? <ProvenanceBadge provenance={factor.contribution.provenance} /> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
