import { useState } from "react";
import type { RouteOptimizationResult } from "../api/client";
import { optimizeRoute } from "../api/client";
import { MetricCard } from "./MetricCard";

interface MobilityPanelProps {
  originLat: number;
  originLng: number;
}

export function MobilityPanel({ originLat, originLng }: MobilityPanelProps) {
  const [destinationLat, setDestinationLat] = useState(originLat + 0.06);
  const [destinationLng, setDestinationLng] = useState(originLng + 0.06);
  const [thermalWeight, setThermalWeight] = useState(0.5);
  const [result, setResult] = useState<RouteOptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runOptimization = async () => {
    setLoading(true);
    setError(null);
    const remaining = Math.max(0, 1 - thermalWeight);
    try {
      setResult(
        await optimizeRoute({
          mode: "personal_trip",
          origin: { latitude: originLat, longitude: originLng },
          destination: { latitude: destinationLat, longitude: destinationLng },
          depart_at: new Date().toISOString(),
          priorities: {
            distance: remaining / 2,
            travel_time: remaining / 2,
            thermal_exposure: thermalWeight,
          },
        }),
      );
    } catch (optimizationError) {
      setResult(null);
      setError(optimizationError instanceof Error ? optimizationError.message : "Optimization failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel workflow-panel">
      <div className="panel-heading">
        <div>
          <h2>Climate-Aware Operations</h2>
          <p>Multi-objective route scoring — distance, time, and modeled thermal exposure.</p>
        </div>
        <button type="button" className="primary-button" disabled={loading} onClick={() => void runOptimization()}>
          {loading ? "Optimizing…" : "Optimize route"}
        </button>
      </div>

      <div className="form-grid">
        <label>
          Destination latitude
          <input type="number" step="0.0001" value={destinationLat} onChange={(event) => setDestinationLat(Number(event.target.value))} />
        </label>
        <label>
          Destination longitude
          <input type="number" step="0.0001" value={destinationLng} onChange={(event) => setDestinationLng(Number(event.target.value))} />
        </label>
        <label>
          Thermal exposure priority ({Math.round(thermalWeight * 100)}%)
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={thermalWeight}
            onChange={(event) => setThermalWeight(Number(event.target.value))}
          />
        </label>
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      {result ? (
        <div className="comparison-grid">
          {result.options.map((option) => (
            <article
              key={option.route_id}
              className={option.route_id === result.recommended_route_id ? "comparison-card recommended" : "comparison-card"}
            >
              <h3>
                {option.label}
                {option.route_id === result.recommended_route_id ? " (recommended)" : ""}
              </h3>
              <MetricCard label="Distance" metric={option.distance_km} />
              <MetricCard label="Travel time" metric={option.travel_time_minutes} />
              <MetricCard label="Thermal exposure" metric={option.thermal_exposure_score} />
              <MetricCard label="Composite score" metric={option.composite_score} />
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
