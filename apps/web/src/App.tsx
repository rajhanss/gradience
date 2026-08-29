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
import { CityInsightWorkspace } from "./components/CityInsightWorkspace";
import { DevelopmentPanel } from "./components/DevelopmentPanel";
import { MetricCard } from "./components/MetricCard";
import { MobilityPanel } from "./components/MobilityPanel";
import { HotspotPanel } from "./components/HotspotPanel";
import { WhatIfPanel } from "./components/WhatIfPanel";
import { ChatBot } from "./components/ChatBot";
import LandingPage from "./pages/LandingPage";
import { normalizeHeatmapCollection, type GeoJsonFeatureCollection } from "./utils/heatmap";
import { MapPin, RefreshCw, Layers } from "lucide-react";

type WorkflowTab = "observe" | "simulate" | "optimize";

const CITIES = [
  { name: "Phoenix, AZ", lat: 33.4484, lng: -112.0740, desc: "High Desert UHI" },
  { name: "Las Vegas, NV", lat: 36.1699, lng: -115.1398, desc: "Strip Heat Retention" },
  { name: "Houston, TX", lat: 29.7604, lng: -95.3698, desc: "Wet-Bulb Extreme" },
];

function navigate(page: WorkflowTab | "home" | "city" | "development" | "mobility") {
  if (page === "home") {
    window.location.hash = "";
  } else if (page === "observe" || page === "city") {
    window.location.hash = "/observe";
  } else if (page === "simulate" || page === "development") {
    window.location.hash = "/simulate";
  } else if (page === "optimize" || page === "mobility") {
    window.location.hash = "/optimize";
  }
}

function currentPage(): WorkflowTab | "home" {
  const raw = window.location.hash.replace(/^#\/?/, "").toLowerCase();
  if (raw === "observe" || raw === "city") return "observe";
  if (raw === "simulate" || raw === "development") return "simulate";
  if (raw === "optimize" || raw === "mobility") return "optimize";
  return "home";
}

export function App() {
  const [page, setPage] = useState<WorkflowTab | "home">(currentPage);

  useEffect(() => {
    const update = () => setPage(currentPage());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  if (page === "home") {
    return <LandingPage onNavigate={(tab) => navigate(tab)} />;
  }

  return <AppShell initialTab={page} onNavigateHome={() => navigate("home")} onNavigateTab={(t) => navigate(t)} />;
}

interface AppShellProps {
  initialTab: WorkflowTab;
  onNavigateHome: () => void;
  onNavigateTab: (tab: WorkflowTab) => void;
}

export function AppShell({ initialTab, onNavigateHome, onNavigateTab }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<WorkflowTab>(initialTab);
  const [latitude, setLatitude] = useState(CITIES[0].lat);
  const [longitude, setLongitude] = useState(CITIES[0].lng);
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
      setHeatmapDetail("Configure FORTYGUARD_API_KEY to request live satellite thermal data.");
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
        setHeatmapDetail(status.status === "processing" ? "Scanning FortyGuard satellite AOI…" : "Heatmap completed.");
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
    setActiveTab(initialTab);
  }, [initialTab]);

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

  const setCity = (c: typeof CITIES[0]) => {
    setLatitude(c.lat);
    setLongitude(c.lng);
    setHeatmapState("idle");
    setHeatmapDetail(null);
    setHeatmapActivityId(null);
    setHeatmapLayer(null);
    setAoiBoundary(null);
  };

  return (
    <div className="apple-app-root">
      {/* 🍏 Top Clean Header */}
      <header className="apple-app-header">
        <div className="flex items-center gap-3">
          <button type="button" className="apple-brand" onClick={onNavigateHome}>
            <div className="apple-brand-logo">G</div>
            <span className="apple-brand-title">Gradience</span>
          </button>
          <div className="h-4 w-[1px] bg-slate-200" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{activeTab}</span>
        </div>

        {/* 3 US Pilot Cities Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-full border border-slate-200">
          {CITIES.map((c) => {
            const isSelected = Math.abs(latitude - c.lat) < 0.01;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setCity(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  isSelected ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Workflow Tabs Switcher + Health */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 mr-2">
            <span className={`w-2 h-2 rounded-full ${healthStatus === "online" ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span>API {healthStatus}</span>
            {systemStatus?.thermal_provider_configured && (
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">FortyGuard Live</span>
            )}
          </div>
          {(
            [
              ["observe", "01 Observe"],
              ["simulate", "02 Simulate"],
              ["optimize", "03 Optimize"],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                activeTab === tab ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => onNavigateTab(tab)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* 🍏 Main Dual Layout: 1/3 Left ChatBot + 2/3 Right (Top Map + Bottom Metrics) */}
      <div className="apple-main-grid">
        {/* 1/3 LEFT: Apple-grade AI Chatbot */}
        <aside className="apple-sidebar-col">
          <ChatBot workflow={activeTab} latitude={latitude} longitude={longitude} />
        </aside>

        {/* 2/3 RIGHT: Map + Metrics */}
        <main className="apple-content-col">
          {activeTab === "observe" && (
            <div className="space-y-6">
              {/* Map Panel */}
              <section className="apple-panel">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <MapPin size={18} className="text-orange-500" />
                      Land Surface Temperature Telemetry
                    </h2>
                    <p className="text-xs text-slate-500">Select any municipal coordinate to analyze thermal anomaly.</p>
                  </div>
                  <div className="text-xs font-mono bg-slate-100 px-3 py-1 rounded-full text-slate-700 font-semibold border border-slate-200">
                    {Math.abs(latitude).toFixed(4)}°{latitude >= 0 ? "N" : "S"}, {Math.abs(longitude).toFixed(4)}°{longitude >= 0 ? "E" : "W"}
                  </div>
                </div>

                <div className="h-[380px] rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner">
                  <CityMap
                    latitude={latitude}
                    longitude={longitude}
                    onSelect={handleMapSelect}
                    heatmapData={heatmapLayer}
                    aoiBoundary={aoiBoundary}
                  />
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    {/* Task 3: data-state provenance badge */}
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: heatmapState === "completed" ? "#10b981"
                           : (heatmapState === "submitting" || heatmapState === "processing") ? "#f59e0b"
                           : "#64748b"
                    }}>
                      {heatmapState === "completed" ? "⬤ Live FortyGuard data"
                       : (heatmapState === "submitting" || heatmapState === "processing") ? "⬤ Requesting satellite scan…"
                       : "⬤ Baseline estimate"}
                    </span>
                    <button
                      type="button"
                      disabled={heatmapState === "submitting" || heatmapState === "processing"}
                      onClick={() => void requestLiveThermal()}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-60"
                    >
                      <RefreshCw size={14} className={heatmapState === "processing" ? "animate-spin" : ""} />
                      {heatmapState === "submitting" || heatmapState === "processing" ? "Requesting Satellite Scan…" : "Request Live FortyGuard Heatmap"}
                    </button>
                  </div>
                  {heatmapDetail && <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">{heatmapDetail}</span>}
                </div>
              </section>

              {/* Metrics Panel */}
              <section className="apple-panel">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Layers size={16} className="text-teal-600" />
                      Observed Microclimate Metrics
                    </h3>
                    <p className="text-xs text-slate-500">Real-time land cover and thermal metrics with explicit provenance.</p>
                  </div>
                  {loadingContext && <span className="text-xs text-slate-400 animate-pulse">Syncing…</span>}
                </div>

                {error && <p className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 mb-4">{error}</p>}
                {providerStatus && !providerStatus.configured && (
                  <p className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200 mb-4">
                    {providerStatus.detail}
                  </p>
                )}

                {cityContext && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MetricCard label="Surface Temperature" metric={cityContext.thermal.surface_temperature} />
                    <MetricCard label="Thermal Anomaly" metric={cityContext.thermal.thermal_anomaly} />
                    <MetricCard label="Heat Risk Level" metric={cityContext.thermal.heat_risk} />
                    <MetricCard label="Air Quality (AQI)" metric={cityContext.environmental.aqi} />
                    <MetricCard label="Vegetation Cover" metric={cityContext.land_cover.vegetation_cover} />
                    <MetricCard label="Built-up Cover" metric={cityContext.land_cover.built_up_cover} />
                    <MetricCard label="Shade Index" metric={cityContext.land_cover.shade_cover} />
                    <MetricCard label="Exposed Population" metric={cityContext.exposure.population_exposed} />
                  </div>
                )}
              </section>

              {/* City Hotspots & Workspaces */}
              <CityInsightWorkspace context={cityContext} heatmapAvailable={heatmapState === "completed"} />
              <HotspotPanel activityId={heatmapActivityId} latitude={latitude} longitude={longitude} />
              <WhatIfPanel latitude={latitude} longitude={longitude} />
            </div>
          )}

          {activeTab === "simulate" && <DevelopmentPanel latitude={latitude} longitude={longitude} />}
          {activeTab === "optimize" && <MobilityPanel originLat={latitude} originLng={longitude} />}
        </main>
      </div>
    </div>
  );
}
