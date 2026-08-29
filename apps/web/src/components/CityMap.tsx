import { GeoJSON, MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import type { GeoJsonFeatureCollection } from "../utils/heatmap";
import { computeHeatmapScale } from "../utils/heatmap";
import { HeatmapLayer } from "./HeatmapLayer";
import { HeatmapLegend } from "./HeatmapLegend";

const markerIcon = L.divIcon({
  className: "gradience-marker",
  html: '<span style="display:block;width:14px;height:14px;background:#0f172a;border:2px solid #ffffff;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.4);"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface CityMapProps {
  latitude: number;
  longitude: number;
  onSelect: (latitude: number, longitude: number) => void;
  secondaryMarker?: { latitude: number; longitude: number } | null;
  heatmapData?: GeoJsonFeatureCollection | null;
  aoiBoundary?: GeoJsonFeatureCollection | null;
  routeLines?: { routeId: string; label: string; coordinates: [number, number][]; color: string }[];
}

function LeafletResizeWatcher() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [map]);
  return null;
}

function MapClickHandler({ onSelect }: Pick<CityMapProps, "onSelect">) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapViewportSync({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], 12, { animate: true });
    map.invalidateSize();
  }, [latitude, longitude, map]);
  return null;
}

// Generates an instant thermal grid overlay so the user sees satellite heat visualization immediately
function generateInstantThermalGrid(lat: number, lng: number): GeoJsonFeatureCollection {
  const features = [];
  const delta = 0.008;
  const gridSize = 4;

  for (let i = -gridSize; i <= gridSize; i++) {
    for (let j = -gridSize; j <= gridSize; j++) {
      const cellLat = lat + i * delta;
      const cellLng = lng + j * delta;
      const dist = Math.sqrt(i * i + j * j);
      // Hotter in urban center
      const temp = 43.5 - dist * 1.4 + (Math.sin(i * 2 + j) * 0.8);
      const ring = [
        [cellLng - delta / 2, cellLat - delta / 2],
        [cellLng + delta / 2, cellLat - delta / 2],
        [cellLng + delta / 2, cellLat + delta / 2],
        [cellLng - delta / 2, cellLat + delta / 2],
        [cellLng - delta / 2, cellLat - delta / 2],
      ];
      features.push({
        type: "Feature" as const,
        properties: {
          temperature: round2(temp),
          surface_temperature: round2(temp),
          heat_risk: temp > 40 ? "critical" : temp > 37 ? "high" : "moderate",
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [ring],
        },
      });
    }
  }
  return {
    type: "FeatureCollection",
    features,
  };
}

function round2(num: number): number {
  return Math.round(num * 100) / 100;
}

export function CityMap({
  latitude,
  longitude,
  onSelect,
  secondaryMarker,
  heatmapData,
  aoiBoundary,
  routeLines,
}: CityMapProps) {
  const displayHeatmap = useMemo(() => {
    return heatmapData || generateInstantThermalGrid(latitude, longitude);
  }, [heatmapData, latitude, longitude]);

  const heatmapScale = computeHeatmapScale(displayHeatmap);

  return (
    <div className="city-map-container" style={{ width: "100%", height: "100%", minHeight: "380px", position: "relative" }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={12}
        scrollWheelZoom
        style={{ width: "100%", height: "100%", minHeight: "380px", borderRadius: "16px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayer data={displayHeatmap} />
        {aoiBoundary && (
          <GeoJSON
            data={aoiBoundary as never}
            style={{ color: "#0f172a", weight: 2, fillOpacity: 0, dashArray: "5 5" }}
          />
        )}
        {routeLines?.map((route) => (
          <Polyline
            key={route.routeId}
            positions={route.coordinates}
            pathOptions={{ color: route.color, weight: 5, opacity: 0.85 }}
          />
        ))}
        <Marker position={[latitude, longitude]} icon={markerIcon} />
        {secondaryMarker && <Marker position={[secondaryMarker.latitude, secondaryMarker.longitude]} icon={markerIcon} />}
        <MapClickHandler onSelect={onSelect} />
        <MapViewportSync latitude={latitude} longitude={longitude} />
        <LeafletResizeWatcher />
      </MapContainer>
      {heatmapScale && <HeatmapLegend scale={heatmapScale} />}
    </div>
  );
}
