import { useState } from "react";
import type { RouteOptimizationResult, RouteRequest } from "../api/client";
import { optimizeRoute } from "../api/client";
import { MetricCard } from "./MetricCard";

interface MobilityPanelProps { originLat: number; originLng: number; }
type OperationMode = "personal_trip" | "outdoor_event" | "delivery";

const MODE_CONTENT: Record<OperationMode, { title: string; description: string }> = {
  personal_trip: { title: "Personal trip", description: "Balance distance, travel time, and modeled thermal exposure." },
  outdoor_event: { title: "Outdoor event", description: "Compare potential start windows and operational planning guidance." },
  delivery: { title: "Temperature-sensitive delivery", description: "Reduce modeled external thermal load for a delivery operation." },
};

export function MobilityPanel({ originLat, originLng }: MobilityPanelProps) {
  const [mode, setMode] = useState<OperationMode>("personal_trip");
  const [destinationLat, setDestinationLat] = useState(originLat + 0.06);
  const [destinationLng, setDestinationLng] = useState(originLng + 0.06);
  const [thermalWeight, setThermalWeight] = useState(0.5);
  const [eventName, setEventName] = useState("Outdoor event");
  const [participants, setParticipants] = useState(250);
  const [cargoMaxTemperature, setCargoMaxTemperature] = useState(8);
  const [result, setResult] = useState<RouteOptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runOptimization = async () => {
    setLoading(true); setError(null);
    const remaining = Math.max(0, 1 - thermalWeight);
    const request: RouteRequest = {
      mode, origin: { latitude: originLat, longitude: originLng }, destination: { latitude: destinationLat, longitude: destinationLng },
      depart_at: new Date().toISOString(), priorities: { distance: remaining / 2, travel_time: remaining / 2, thermal_exposure: thermalWeight },
    };
    if (mode === "outdoor_event") { request.event_name = eventName; request.participants = participants; }
    if (mode === "delivery") { request.cargo_max_temperature_c = cargoMaxTemperature; }
    try { setResult(await optimizeRoute(request)); }
    catch (cause) { setResult(null); setError(cause instanceof Error ? cause.message : "Optimization failed."); }
    finally { setLoading(false); }
  };

  return <section className="panel workflow-panel">
    <div className="panel-heading"><div><p className="eyebrow">Optimize</p><h2>Climate-Aware Operations</h2><p>{MODE_CONTENT[mode].description}</p></div><button type="button" className="primary-button" disabled={loading} onClick={() => void runOptimization()}>{loading ? "Optimizing…" : "Optimize operation"}</button></div>
    <div className="operation-mode-picker" role="tablist" aria-label="Operation type">
      {(Object.keys(MODE_CONTENT) as OperationMode[]).map((option) => <button key={option} type="button" role="tab" aria-selected={mode === option} className={mode === option ? "operation-mode active" : "operation-mode"} onClick={() => setMode(option)}><strong>{MODE_CONTENT[option].title}</strong><span>{MODE_CONTENT[option].description}</span></button>)}
    </div>
    <div className="form-grid">
      <label>Destination latitude<input type="number" step="0.0001" value={destinationLat} onChange={(event) => setDestinationLat(Number(event.target.value))} /></label>
      <label>Destination longitude<input type="number" step="0.0001" value={destinationLng} onChange={(event) => setDestinationLng(Number(event.target.value))} /></label>
      <label>Thermal exposure priority ({Math.round(thermalWeight * 100)}%)<input type="range" min={0} max={1} step={0.05} value={thermalWeight} onChange={(event) => setThermalWeight(Number(event.target.value))} /></label>
      {mode === "outdoor_event" ? <><label>Event name<input value={eventName} onChange={(event) => setEventName(event.target.value)} /></label><label>Participants<input type="number" min={1} value={participants} onChange={(event) => setParticipants(Number(event.target.value))} /></label></> : null}
      {mode === "delivery" ? <label>Maximum cargo temperature (°C)<input type="number" value={cargoMaxTemperature} onChange={(event) => setCargoMaxTemperature(Number(event.target.value))} /></label> : null}
    </div>
    {error ? <p className="error-banner">{error}</p> : null}
    {result ? <>
      <div className="recommendation-banner"><strong>Recommended departure:</strong> {result.recommended_depart_at ? new Date(result.recommended_depart_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Unavailable"} · <strong>Route:</strong> {result.recommended_route_id}</div>
      <div className="comparison-grid">{result.options.map((option) => <article key={option.route_id} className={option.route_id === result.recommended_route_id ? "comparison-card recommended" : "comparison-card"}><h3>{option.label}{option.route_id === result.recommended_route_id ? " (recommended)" : ""}</h3><MetricCard label="Distance" metric={option.distance_km} /><MetricCard label="Travel time" metric={option.travel_time_minutes} /><MetricCard label="Thermal exposure" metric={option.thermal_exposure_score} /><MetricCard label="Composite score" metric={option.composite_score} /></article>)}</div>
      <section className="time-window-section"><h3>Route × time comparison</h3><div className="time-window-grid">{result.time_windows.map((window) => <article key={window.depart_at} className="time-window-card"><strong>{new Date(window.depart_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong><MetricCard label="Thermal exposure" metric={window.thermal_exposure_score} /><MetricCard label="Verdict" metric={window.verdict} /></article>)}</div></section>
      <section className="monitoring-card"><p className="eyebrow">Operational guidance</p><ul>{result.operational_guidance.map((guidance) => <li key={guidance}>{guidance}</li>)}</ul><p className="metric-card__meta">All route and timing results are modeled until live routing, shade, air quality, and sensor feeds are connected.</p></section>
    </> : null}
  </section>;
}
