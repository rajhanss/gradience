import { useState } from "react";
import type { DevelopmentProposal, MitigationStrategy, SimulationComparison } from "../api/client";
import { simulateDevelopment, simulateDevelopmentML } from "../api/client";
import { MetricCard } from "./MetricCard";

interface DevelopmentPanelProps {
  latitude: number;
  longitude: number;
}

const DEFAULT_PROPOSAL: DevelopmentProposal = {
  development_type: "mixed_use",
  footprint_hectares: 5,
  land_cover_changes: { vegetation_change_pct: -5, built_up_change_pct: 8 },
  mitigation_strategies: ["green_corridor", "tree_canopy", "cool_surfaces"],
};

const MITIGATION_OPTIONS: Array<{ value: MitigationStrategy; label: string; detail: string }> = [
  { value: "green_corridor", label: "Green corridor", detail: "Modeled cooling: 0.35°C" },
  { value: "tree_canopy", label: "Tree canopy", detail: "Modeled cooling: 0.25°C" },
  { value: "shade_structures", label: "Shade structures", detail: "Modeled cooling: 0.12°C" },
  { value: "cool_surfaces", label: "Cool surfaces", detail: "Modeled cooling: 0.18°C" },
  { value: "blue_infrastructure", label: "Blue infrastructure", detail: "Modeled cooling: 0.20°C" },
];

export function DevelopmentPanel({ latitude, longitude }: DevelopmentPanelProps) {
  const [proposal, setProposal] = useState<DevelopmentProposal>(DEFAULT_PROPOSAL);
  const [engineMode, setEngineMode] = useState<"deterministic" | "ml">("deterministic");
  const [comparison, setComparison] = useState<SimulationComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMitigation = (strategy: MitigationStrategy) => {
    const selected = proposal.mitigation_strategies.includes(strategy);
    setProposal({
      ...proposal,
      mitigation_strategies: selected
        ? proposal.mitigation_strategies.filter((item) => item !== strategy)
        : [...proposal.mitigation_strategies, strategy],
    });
  };

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      if (engineMode === "ml") {
        setComparison(await simulateDevelopmentML(latitude, longitude, proposal));
      } else {
        setComparison(await simulateDevelopment(latitude, longitude, proposal));
      }
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
          <p>
            {engineMode === "ml"
              ? "Trained LinearRegression ML model (300 development profiles + uncertainty bounds)."
              : "Deterministic land-cover response model from published climate literature."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select
            value={engineMode}
            onChange={(e) => setEngineMode(e.target.value as "deterministic" | "ml")}
            style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem", borderRadius: "6px", background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
          >
            <option value="deterministic">📐 Literature Model (Deterministic)</option>
            <option value="ml">🤖 ML Simulator (LinearRegression)</option>
          </select>
          <button type="button" className="primary-button" disabled={loading} onClick={() => void runSimulation()}>
            {loading ? "Simulating…" : `Run ${engineMode === "ml" ? "ML" : ""} Simulation`}
          </button>
        </div>
      </div>

      <section className="mitigation-picker" aria-labelledby="mitigation-heading">
        <div>
          <p className="eyebrow">Mitigate</p>
          <h3 id="mitigation-heading">Optimize the proposed design</h3>
          <p>Select interventions. Their documented baseline cooling coefficients are applied only to the optimized scenario.</p>
        </div>
        <div className="mitigation-options">
          {MITIGATION_OPTIONS.map((option) => (
            <label key={option.value} className="mitigation-option">
              <input
                type="checkbox"
                checked={proposal.mitigation_strategies.includes(option.value)}
                onChange={() => toggleMitigation(option.value)}
              />
              <span><strong>{option.label}</strong><small>{option.detail}</small></span>
            </label>
          ))}
        </div>
      </section>

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
          <article className="comparison-card simulation-explanation">
            <h3>Decision explanation</h3>
            <p>Method: {comparison.method}</p>
            <p>Applied mitigation: {comparison.recommendations.length ? comparison.recommendations.join(" · ") : "None selected — optimized result matches proposed scenario."}</p>
            <p className="metric-card__meta">This is a transparent baseline model, not an observed or ML prediction.</p>
          </article>
        </div>
      ) : null}

      <section className="monitoring-card">
        <p className="eyebrow">Monitor</p>
        <h3>Predicted vs observed impact</h3>
        <span className="provenance-badge provenance-unavailable">Unavailable</span>
        <p>Observed post-development thermal data has not been linked to a completed project. GRADIENCE will show prediction error only when matched observations exist.</p>
      </section>
    </section>
  );
}
