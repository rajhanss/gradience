import { useState } from "react";
import type { DevelopmentProposal, SimulationComparison } from "../api/client";
import { simulateDevelopment } from "../api/client";
import { MetricCard } from "./MetricCard";

interface DevelopmentPanelProps {
  latitude: number;
  longitude: number;
}

const DEFAULT_PROPOSAL: DevelopmentProposal = {
  development_type: "mixed_use",
  footprint_hectares: 5,
  land_cover_changes: { vegetation_change_pct: -5, built_up_change_pct: 8 },
};

export function DevelopmentPanel({ latitude, longitude }: DevelopmentPanelProps) {
  const [proposal, setProposal] = useState<DevelopmentProposal>(DEFAULT_PROPOSAL);
  const [comparison, setComparison] = useState<SimulationComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      setComparison(await simulateDevelopment(latitude, longitude, proposal));
    } catch (simulationError) {
      setComparison(null);
      setError(simulationError instanceof Error ? simulationError.message : "Simulation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel workflow-panel">
      <div className="panel-heading">
        <div>
          <h2>Urban Impact Simulator</h2>
          <p>Baseline land-cover response model. All deltas are modeled and labeled.</p>
        </div>
        <button type="button" className="primary-button" disabled={loading} onClick={() => void runSimulation()}>
          {loading ? "Simulating…" : "Run simulation"}
        </button>
      </div>

      <div className="form-grid">
        <label>
          Development type
          <select
            value={proposal.development_type}
            onChange={(event) => setProposal({ ...proposal, development_type: event.target.value })}
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="mixed_use">Mixed use</option>
            <option value="industrial">Industrial</option>
            <option value="green_infrastructure">Green infrastructure</option>
          </select>
        </label>
        <label>
          Footprint (hectares)
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={proposal.footprint_hectares}
            onChange={(event) => setProposal({ ...proposal, footprint_hectares: Number(event.target.value) })}
          />
        </label>
        <label>
          Vegetation change (%)
          <input
            type="number"
            value={proposal.land_cover_changes.vegetation_change_pct}
            onChange={(event) =>
              setProposal({
                ...proposal,
                land_cover_changes: {
                  ...proposal.land_cover_changes,
                  vegetation_change_pct: Number(event.target.value),
                },
              })
            }
          />
        </label>
        <label>
          Built-up change (%)
          <input
            type="number"
            value={proposal.land_cover_changes.built_up_change_pct}
            onChange={(event) =>
              setProposal({
                ...proposal,
                land_cover_changes: {
                  ...proposal.land_cover_changes,
                  built_up_change_pct: Number(event.target.value),
                },
              })
            }
          />
        </label>
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      {comparison ? (
        <div className="comparison-grid">
          {(["current", "proposed", "optimized"] as const).map((label) => {
            const snapshot = comparison[label];
            return (
              <article key={label} className="comparison-card">
                <h3>{label}</h3>
                <MetricCard label="Δ surface temperature" metric={snapshot.delta_surface_temperature} />
                <p className="metric-card__meta">{comparison.method}</p>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
