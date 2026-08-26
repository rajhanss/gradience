import { useCallback, useEffect, useState } from "react";
import {
  fetchCityContext,
  fetchHealth,
  fetchSystemStatus,
  pollHeatmapUntilComplete,
  probeThermalProvider,
  squareAoi,
  submitHeatmap,
  type CityContext,
  type HeatmapStatus,
  type ProviderProbeResult,
  type SystemStatus,
} from "./api/client";
import { CityMap } from "./components/CityMap";
import { DevelopmentPanel } from "./components/DevelopmentPanel";
import { MetricCard } from "./components/MetricCard";
import { MobilityPanel } from "./components/MobilityPanel";
import { HotspotPanel } from "./components/HotspotPanel";
import { WhatIfPanel } from "./components/WhatIfPanel";
import { normalizeHeatmapCollection, type GeoJsonFeatureCollection } from "./utils/heatmap";

const DEFAULT_LATITUDE = 33.4484;
const DEFAULT_LONGITUDE = -112.074;

type InterfaceTab = "city" | "development" | "mobility" | "whatif";

export function AppShell() {
  const [activeTab, setActiveTab] = useState<InterfaceTab>("city");
  const [latitude, setLatitude] = useState(DEFAULT_LATITUDE);
  const [longitude, setLongitude] = useState(DEFAULT_LONGITUDE);
  const [healthStatus, setHealthStatus] = useState<"loading" | "online" | "offline">("loading");
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderProbeResult | null>(null);
  const [cityContext, setCityContext] = useState<CityContext | null>(null);
  const [heatmapState, setHeatmapState] = useState<"idle" | "submitting" | "processing" | "completed" | "error">("idle");
  const [heatmapDetail, setHeatmapDetail] = useState<string | null>(null);
  const [heatmapActivityId, setHeatmapActivityId] = useState<string | null>(null);
  const [heatmapLayer, setHeatmapLayer] = useState<GeoJsonFeatureCollection | null>(null);
  const [aoiBoundary, setAoiBoundary] = useState<GeoJsonFeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  const refreshStatus = useCallback(async () => {
    setHealthStatus("loading");
    try {
      await fetchHealth();
      setHealthStatus("online");
      setSystemStatus(await fetchSystemStatus());
      setProviderStatus(await probeThermalProvider());
    } catch {
      setHealthStatus("offline");
      setSystemStatus(null);
      setProviderStatus(null);
    }
  }, []);

  const refreshContext = useCallback(async (lat: number, lng: number) => {
    setLoadingContext(true);
    setError(null);
    try {
      setCityContext(await fetchCityContext(lat, lng));
    } catch (contextError) {
      setCityContext(null);
      setError(contextError instanceof Error ? contextError.message : "Unable to load city context.");
    } finally {
      setLoadingContext(false);
    }
  }, []);

  const requestLiveThermal = useCallback(async () => {
    if (!providerStatus?.configured) {
      setHeatmapDetail("Configure FORTYGUARD_API_KEY to request live thermal data.");
      return;
    }
    setHeatmapState("submitting");
    setHeatmapDetail(null);
    setError(null);
    try {
      const task = await submitHeatmap(latitude, longitude);
      setHeatmapState("processing");
      setAoiBoundary(normalizeHeatmapCollection(squareAoi(latitude, longitude) as Record<string, unknown>));
      const completion = await pollHeatmapUntilComplete(task.activity_id, latitude, longitude, (status: HeatmapStatus) => {
        setHeatmapDetail(status.status === "processing" ? "FortyGuard is processing the AOI heatmap…" : "Heatmap completed.");
      });
      setCityContext(completion.context);
      setHeatmapActivityId(completion.activityId);
      setHeatmapLayer(completion.mapData ? normalizeHeatmapCollection(completion.mapData) : null);
      setHeatmapState("completed");
    } catch (heatmapError) {
      setHeatmapState("error");
      setError(heatmapError instanceof Error ? heatmapError.message : "Heatmap request failed.");
    }
  }, [latitude, longitude, providerStatus?.configured]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    void refreshContext(latitude, longitude);
  }, [latitude, longitude, refreshContext]);

  const handleMapSelect = (lat: number, lng: number) => {
    setLatitude(Number(lat.toFixed(5)));
    setLongitude(Number(lng.toFixed(5)));
    setHeatmapState("idle");
    setHeatmapDetail(null);
    setHeatmapActivityId(null);
    setHeatmapLayer(null);
    setAoiBoundary(null);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">City Climate Intelligence Platform</p>
          <h1>GRADIENCE</h1>
          <p className="tagline">Build smarter. Move safer.</p>
        </div>
        <div className="status-panel">
          <div className={`status-pill status-${healthStatus}`}>
            API {healthStatus === "loading" ? "checking…" : healthStatus}
          </div>
          {systemStatus ? (
            <div className={`status-pill status-${systemStatus.thermal_provider_configured ? "online" : "warning"}`}>
              Thermal provider {systemStatus.thermal_provider_configured ? "configured" : "not configured"}
            </div>
          ) : null}
          <button type="button" className="ghost-button" onClick={() => void refreshStatus()}>
            Refresh status
          </button>
        </div>
      </header>

      <nav className="interface-nav" aria-label="GRADIENCE interfaces">
        {(
          [
            ["city", "City Intelligence"],
            ["development", "Development Intelligence"],
            ["mobility", "Mobility & Operations"],
            ["whatif", "City What-If"],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "nav-tab active" : "nav-tab"}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "city" ? (
        <main className="dashboard-grid">
          <section className="panel panel-map">
            <div className="panel-heading">
              <div>
                <h2>City Thermal State</h2>
                <p>Select a location, then request live thermal enrichment when the provider is configured.</p>
              </div>
              <div className="coordinate-readout">
                <span>
                  {Math.abs(latitude).toFixed(5)}°{latitude >= 0 ? "N" : "S"}
                </span>
                <span>
                  {Math.abs(longitude).toFixed(5)}°{longitude >= 0 ? "E" : "W"}
                </span>
              </div>
            </div>
            <CityMap
              latitude={latitude}
              longitude={longitude}
              onSelect={handleMapSelect}
              heatmapData={heatmapLayer}
              aoiBoundary={aoiBoundary}
            />
            <div className="map-actions">
              <button
                type="button"
                className="primary-button"
                disabled={heatmapState === "submitting" || heatmapState === "processing"}
                onClick={() => void requestLiveThermal()}
              >
                {heatmapState === "submitting" || heatmapState === "processing" ? "Requesting live thermal…" : "Request live thermal"}
              </button>
              {heatmapDetail ? <span className="loading-chip">{heatmapDetail}</span> : null}
            </div>
          </section>

          <section className="panel panel-metrics">
            <div className="panel-heading">
              <div>
                <h2>Current Context</h2>
                <p>Every metric shows provenance. Unavailable values are never presented as observed data.</p>
              </div>
              {loadingContext ? <span className="loading-chip">Loading…</span> : null}
            </div>

            {error ? <p className="error-banner">{error}</p> : null}
            {providerStatus && !providerStatus.configured ? (
              <p className="info-banner">{providerStatus.detail}</p>
            ) : null}

            {cityContext ? (
              <>
                <div className="context-meta">
                  <span>Context ID: {cityContext.context_id}</span>
                  <span>Window: {new Date(cityContext.observation.starts_at).toLocaleString()}</span>
                </div>
                <div className="metric-grid">
                  <MetricCard label="Surface temperature" metric={cityContext.thermal.surface_temperature} />
                  <MetricCard label="Thermal anomaly" metric={cityContext.thermal.thermal_anomaly} />
                  <MetricCard label="Heat risk" metric={cityContext.thermal.heat_risk} />
                  <MetricCard label="AQI" metric={cityContext.environmental.aqi} />
                  <MetricCard label="Vegetation cover" metric={cityContext.land_cover.vegetation_cover} />
                  <MetricCard label="Built-up cover" metric={cityContext.land_cover.built_up_cover} />
                  <MetricCard label="Shade cover" metric={cityContext.land_cover.shade_cover} />
                  <MetricCard label="Population exposed" metric={cityContext.exposure.population_exposed} />
                </div>
              </>
            ) : null}
          </section>
          <HotspotPanel activityId={heatmapActivityId} latitude={latitude} longitude={longitude} />
        </main>
      ) : null}

      {activeTab === "development" ? <DevelopmentPanel latitude={latitude} longitude={longitude} /> : null}
      {activeTab === "mobility" ? <MobilityPanel originLat={latitude} originLng={longitude} /> : null}
      {activeTab === "whatif" ? <WhatIfPanel latitude={latitude} longitude={longitude} /> : null}

      <footer className="app-footer">
        <p>Data integrity first: real, derived, modeled, demo/synthetic, and unavailable states are always visible.</p>
      </footer>
    </div>
  );
}
