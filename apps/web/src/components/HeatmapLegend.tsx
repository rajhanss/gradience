import type { HeatmapScale } from "../utils/heatmap";
import { temperatureColor } from "../utils/heatmap";

interface HeatmapLegendProps {
  scale: HeatmapScale;
}

export function HeatmapLegend({ scale }: HeatmapLegendProps) {
  const stops = [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
    fraction,
    value: scale.min + (scale.max - scale.min) * fraction,
  }));

  return (
    <div className="heatmap-legend" aria-label="Thermal scale legend">
      <span className="heatmap-legend__label">Surface temp (°C)</span>
      <div className="heatmap-legend__bar">
        {stops.map((stop) => (
          <span
            key={stop.fraction}
            className="heatmap-legend__stop"
            style={{ background: temperatureColor(stop.value, scale) }}
            title={`${stop.value.toFixed(1)}°C`}
          />
        ))}
      </div>
      <div className="heatmap-legend__range">
        <span>{scale.min.toFixed(1)}°C</span>
        <span>{scale.max.toFixed(1)}°C</span>
      </div>
      <span className="heatmap-legend__source">Source: FortyGuard · provenance: real</span>
    </div>
  );
}
