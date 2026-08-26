import { GeoJSON } from "react-leaflet";
import type { Layer, PathOptions } from "leaflet";
import type { GeoJsonFeatureCollection } from "../utils/heatmap";
import { computeHeatmapScale, extractTileTemperature, temperatureColor } from "../utils/heatmap";

interface HeatmapLayerProps {
  data: GeoJsonFeatureCollection;
}

export function HeatmapLayer({ data }: HeatmapLayerProps) {
  const scale = computeHeatmapScale(data);
  if (!scale) {
    return null;
  }

  const style = (feature?: { properties?: Record<string, unknown> | null }): PathOptions => {
    const temperature = extractTileTemperature(feature?.properties ?? undefined);
    const fillColor = temperature === null ? "#64748b" : temperatureColor(temperature, scale);
    return {
      color: fillColor,
      weight: 0.5,
      fillColor,
      fillOpacity: 0.62,
    };
  };

  const onEachFeature = (feature: { properties?: Record<string, unknown> | null }, layer: Layer) => {
    const temperature = extractTileTemperature(feature.properties ?? undefined);
    if (temperature !== null) {
      layer.bindPopup(`<strong>${temperature.toFixed(1)}°C</strong><br/>FortyGuard tile (observed)`);
    }
  };

  return <GeoJSON data={data as never} style={style} onEachFeature={onEachFeature} />;
}
