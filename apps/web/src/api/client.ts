export type DataProvenance = "real" | "derived" | "modeled" | "synthetic" | "unavailable";

export interface MeasuredMetric<T = number | string | boolean | null> {
  value: T | null;
  unit: string | null;
  provenance: DataProvenance;
  source: string | null;
  observed_at: string | null;
  method: string | null;
  uncertainty: number | null;
  source_url: string | null;
}

export interface CityContext {
  context_id: string;
  area: {
    name: string | null;
    centroid: { latitude: number; longitude: number };
    geojson: Record<string, unknown> | null;
  };
  observation: {
    starts_at: string;
    ends_at: string;
    timezone: string;
  };
  thermal: {
    surface_temperature: MeasuredMetric<number> | null;
    thermal_anomaly: MeasuredMetric<number> | null;
    heat_risk: MeasuredMetric<string> | null;
  };
  environmental: {
    aqi: MeasuredMetric<number> | null;
  };
  land_cover: {
    vegetation_cover: MeasuredMetric<number> | null;
    built_up_cover: MeasuredMetric<number> | null;
    shade_cover: MeasuredMetric<number> | null;
  };
  exposure: {
    population_exposed: MeasuredMetric<number> | null;
  };
}

export interface SystemStatus {
  api: string;
  thermal_provider_configured: boolean;
  timestamp: string;
  version: string;
}

export interface ApiHealth {
  status: string;
}

export interface ProviderProbeResult {
  configured: boolean;
  detail: string;
}

export interface HeatmapTask {
  activity_id: string;
}

export interface HeatmapStatus {
  activity_id: string;
  status: "processing" | "completed";
  result?: {
    activity_id: string;
    map_data: Record<string, unknown>;
    stats_data: Record<string, unknown>;
  };
}

export interface HeatmapCompletion {
  activityId: string;
  context: CityContext;
  mapData: Record<string, unknown> | null;
  statsData: Record<string, unknown> | null;
}

export interface DevelopmentProposal {
  development_type: string;
  footprint_hectares: number;
  land_cover_changes: {
    vegetation_change_pct: number;
    built_up_change_pct: number;
  };
  mitigation_strategies: MitigationStrategy[];
}

export type MitigationStrategy = "green_corridor" | "tree_canopy" | "shade_structures" | "cool_surfaces" | "blue_infrastructure";

export interface SimulationComparison {
  scenario_id: string;
  method: string;
  source: string;
  current: ScenarioSnapshot;
  proposed: ScenarioSnapshot;
  optimized: ScenarioSnapshot;
  applied_mitigations: MitigationStrategy[];
  recommendations: string[];
}

export interface ScenarioSnapshot {
  label: string;
  context: CityContext;
  delta_surface_temperature: MeasuredMetric<number> | null;
}

export interface RouteRequest {
  mode: string;
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  depart_at: string;
  priorities: { distance: number; travel_time: number; thermal_exposure: number };
}

export interface RouteOptimizationResult {
  request_id: string;
  method: string;
  source: string;
  recommended_route_id: string;
  options: RouteOption[];
}

export interface RouteOption {
  route_id: string;
  label: string;
  distance_km: MeasuredMetric<number>;
  travel_time_minutes: MeasuredMetric<number>;
  thermal_exposure_score: MeasuredMetric<number>;
  composite_score: MeasuredMetric<number>;
  waypoints: { latitude: number; longitude: number }[];
}

export interface WhatIfQuery {
  question: string;
  location?: { latitude: number; longitude: number };
  parameters?: Record<string, unknown>;
}

export interface WhatIfResult {
  intent: string;
  question: string;
  method: string;
  source: string;
  summary: string;
  payload: Record<string, unknown>;
}

export interface RiskFactor {
  label: string;
  detail: string;
  contribution: MeasuredMetric<number> | null;
}

export interface HotspotAnalysis {
  location: { latitude: number; longitude: number };
  activity_id: string;
  tile_temperature: MeasuredMetric<number> | null;
  area_mean_temperature: MeasuredMetric<number> | null;
  thermal_anomaly: MeasuredMetric<number> | null;
  risk_score: MeasuredMetric<number> | null;
  risk_level: MeasuredMetric<string> | null;
  decomposition: RiskFactor[];
  explanation: string;
  alerts: string[];
  historical_trend: MeasuredMetric<string> | null;
  method: string;
  source: string;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function fetchHealth(): Promise<ApiHealth> {
  return request<ApiHealth>("/health");
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  return request<SystemStatus>("/v1/system/status");
}

export async function fetchCityContext(latitude: number, longitude: number): Promise<CityContext> {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(5),
    longitude: longitude.toFixed(5),
  });
  return request<CityContext>(`/v1/city-context?${params.toString()}`);
}

export async function fetchContextFromHeatmap(
  activityId: string,
  latitude: number,
  longitude: number,
): Promise<CityContext> {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(5),
    longitude: longitude.toFixed(5),
  });
  return request<CityContext>(`/v1/city-intelligence/context-from-heatmap/${activityId}?${params.toString()}`);
}

export function squareAoi(latitude: number, longitude: number, delta = 0.02): Record<string, unknown> {
  const ring = [
    [longitude - delta, latitude - delta],
    [longitude + delta, latitude - delta],
    [longitude + delta, latitude + delta],
    [longitude - delta, latitude + delta],
    [longitude - delta, latitude - delta],
  ];
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [ring] },
      },
    ],
  };
}

export async function submitHeatmap(latitude: number, longitude: number): Promise<HeatmapTask> {
  const today = new Date().toISOString().slice(0, 10);
  return request<HeatmapTask>("/v1/city-intelligence/heatmaps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      polygon_aoi: squareAoi(latitude, longitude),
      date_time: { start_date: today, start_time: "12:00", filter_type: 1 },
      granularity: 100,
    }),
  });
}

export async function fetchHeatmapStatus(activityId: string): Promise<HeatmapStatus> {
  return request<HeatmapStatus>(`/v1/city-intelligence/heatmaps/${activityId}`);
}

export async function fetchHotspotAnalysis(
  activityId: string,
  latitude: number,
  longitude: number,
): Promise<HotspotAnalysis> {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(5),
    longitude: longitude.toFixed(5),
  });
  return request<HotspotAnalysis>(`/v1/city-intelligence/hotspots/${activityId}?${params.toString()}`);
}

export async function probeThermalProvider(): Promise<ProviderProbeResult> {
  try {
    const status = await fetchSystemStatus();
    if (!status.thermal_provider_configured) {
      return {
        configured: false,
        detail: "No live thermal provider configured. Metrics remain unavailable until FORTYGUARD_API_KEY is set.",
      };
    }
    return { configured: true, detail: "Thermal provider is configured." };
  } catch {
    return {
      configured: false,
      detail: "Unable to reach system status; thermal provider state is unknown.",
    };
  }
}

export async function simulateDevelopment(
  latitude: number,
  longitude: number,
  proposal: DevelopmentProposal,
): Promise<SimulationComparison> {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(5),
    longitude: longitude.toFixed(5),
  });
  return request<SimulationComparison>(`/v1/development-intelligence/simulate?${params.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proposal),
  });
}

export async function optimizeRoute(payload: RouteRequest): Promise<RouteOptimizationResult> {
  return request<RouteOptimizationResult>("/v1/mobility/optimize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function askWhatIf(query: WhatIfQuery): Promise<WhatIfResult> {
  return request<WhatIfResult>("/v1/what-if", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });
}

export async function pollHeatmapUntilComplete(
  activityId: string,
  latitude: number,
  longitude: number,
  onProgress?: (status: HeatmapStatus) => void,
  maxAttempts = 20,
): Promise<HeatmapCompletion> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const status = await fetchHeatmapStatus(activityId);
    onProgress?.(status);
    if (status.status === "completed") {
      const context = await fetchContextFromHeatmap(activityId, latitude, longitude);
      return {
        activityId,
        context,
        mapData: status.result?.map_data ?? null,
        statsData: status.result?.stats_data ?? null,
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("Heatmap processing timed out.");
}
