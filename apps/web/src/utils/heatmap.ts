export interface GeoJsonFeature {
  type: "Feature";
  properties?: Record<string, unknown> | null;
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

const TEMPERATURE_KEYS = [
  "temperature",
  "temp",
  "tcm",
  "value",
  "mean_temp",
  "surface_temperature",
  "Temperature",
];

export interface HeatmapScale {
  min: number;
  max: number;
}

export function isFeatureCollection(value: unknown): value is GeoJsonFeatureCollection {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as GeoJsonFeatureCollection).type === "FeatureCollection" &&
    Array.isArray((value as GeoJsonFeatureCollection).features)
  );
}

export function extractTileTemperature(properties: Record<string, unknown> | null | undefined): number | null {
  if (!properties) {
    return null;
  }
  for (const key of TEMPERATURE_KEYS) {
    const candidate = properties[key];
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
  }
  for (const value of Object.values(properties)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

export function computeHeatmapScale(collection: GeoJsonFeatureCollection): HeatmapScale | null {
  const values = collection.features
    .map((feature) => extractTileTemperature(feature.properties ?? undefined))
    .filter((value): value is number => value !== null);
  if (values.length === 0) {
    return null;
  }
  return { min: Math.min(...values), max: Math.max(...values) };
}

export function temperatureColor(value: number, scale: HeatmapScale): string {
  const span = Math.max(scale.max - scale.min, 0.001);
  const normalized = Math.min(1, Math.max(0, (value - scale.min) / span));
  const hue = 220 - normalized * 220;
  const lightness = 38 + normalized * 18;
  return `hsl(${hue.toFixed(0)} 88% ${lightness.toFixed(0)}%)`;
}

export function normalizeHeatmapCollection(mapData: Record<string, unknown>): GeoJsonFeatureCollection | null {
  if (isFeatureCollection(mapData)) {
    return mapData;
  }
  const nested = mapData.map_data ?? mapData.geojson ?? mapData.features;
  if (isFeatureCollection(nested)) {
    return nested;
  }
  if (Array.isArray(nested)) {
    return { type: "FeatureCollection", features: nested as GeoJsonFeature[] };
  }
  return null;
}
