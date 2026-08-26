import { GeoJSON, MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import type { GeoJsonFeatureCollection } from "../utils/heatmap";
import { computeHeatmapScale } from "../utils/heatmap";
import { HeatmapLayer } from "./HeatmapLayer";
import { HeatmapLegend } from "./HeatmapLegend";

const markerIcon = L.divIcon({
  className: "gradience-marker",
  html: '<span aria-hidden="true"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
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

function MapClickHandler({ onSelect }: Pick<CityMapProps, "onSelect">) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapViewportSync({ latitude, longitude, heatmapData }: Pick<CityMapProps, "latitude" | "longitude" | "heatmapData">) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom(), { animate: true });
  }, [latitude, longitude, map]);

  useEffect(() => {
    if (!heatmapData?.features.length) {
      return;
    }
    const layer = L.geoJSON(heatmapData as never);
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
    }
  }, [heatmapData, map]);

  return null;
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
  const heatmapScale = heatmapData ? computeHeatmapScale(heatmapData) : null;

  return (
    <div className="city-map">
      <MapContainer center={[latitude, longitude]} zoom={11} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {heatmapData ? <HeatmapLayer data={heatmapData} /> : null}
        {aoiBoundary ? (
          <GeoJSON
            data={aoiBoundary as never}
            style={{ color: "#38bdf8", weight: 2, fillOpacity: 0, dashArray: "6 4" }}
          />
        ) : null}
        {routeLines?.map((route) => (
          <Polyline
            key={route.routeId}
            positions={route.coordinates}
            pathOptions={{ color: route.color, weight: 5, opacity: 0.85 }}
          />
        ))}
        <Marker position={[latitude, longitude]} icon={markerIcon} />
        {secondaryMarker ? <Marker position={[secondaryMarker.latitude, secondaryMarker.longitude]} icon={markerIcon} /> : null}
        <MapClickHandler onSelect={onSelect} />
        <MapViewportSync latitude={latitude} longitude={longitude} heatmapData={heatmapData} />
      </MapContainer>
      {heatmapScale ? <HeatmapLegend scale={heatmapScale} /> : null}
      <p className="city-map__hint">Click the map to inspect a different location.</p>
    </div>
  );
}
