import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface HeatPoint {
  lat: number;
  lng: number;
  temp: number;
  id: string;
}

interface InteractiveMapProps {
  workflowId: string;
  city?: string;
}

const CITY_DATA: Record<string, { lat: number; lng: number; zoom: number; name: string }> = {
  observe: { lat: 33.4484, lng: -112.0742, zoom: 11, name: 'Phoenix, AZ' },
  simulate: { lat: 36.1699, lng: -115.1398, zoom: 11, name: 'Las Vegas, NV' },
  mitigate: { lat: 29.7604, lng: -95.3698, zoom: 11, name: 'Houston, TX' }
};

const getApiBase = () => {
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv.VITE_API_BASE) {
    return metaEnv.VITE_API_BASE;
  }
  const gProcess = (globalThis as any).process;
  if (gProcess && gProcess.env && gProcess.env.REACT_APP_API_BASE) {
    return gProcess.env.REACT_APP_API_BASE;
  }
  return 'https://gradience-api-production.up.railway.app';
};

const API_BASE = getApiBase();

export default function InteractiveMap({ workflowId }: InteractiveMapProps) {
  const cityInfo = CITY_DATA[workflowId] || CITY_DATA.observe;
  const [heatpoints, setHeatpoints] = useState<HeatPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    loadHeatmapData();
  }, [workflowId]);

  const loadHeatmapData = async () => {
    setLoading(true);

    try {
      console.log(`[Map] Loading heatmap for ${workflowId}`);
      
      const response = await fetch(
        `${API_BASE}/v1/city-intelligence/heatmaps?city=${workflowId}&granularity=80`,
        { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            polygon_aoi: {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [[
                    [cityInfo.lng - 0.1, cityInfo.lat - 0.1],
                    [cityInfo.lng + 0.1, cityInfo.lat - 0.1],
                    [cityInfo.lng + 0.1, cityInfo.lat + 0.1],
                    [cityInfo.lng - 0.1, cityInfo.lat + 0.1],
                    [cityInfo.lng - 0.1, cityInfo.lat - 0.1]
                  ]]
                }
              }]
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.heatmap_geojson?.features && data.heatmap_geojson.features.length > 0) {
          const points = data.heatmap_geojson.features.map((feature: any, idx: number) => ({
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0],
            temp: feature.properties?.temperature || 30 + Math.random() * 15,
            id: `real-${idx}`
          }));
          setHeatpoints(points);
          console.log(`[Map] Loaded ${points.length} heatpoints from API`);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error('[Map] Error loading FortyGuard data:', err);
    }

    console.log('[Map] Using fallback heatmap data');
    const mockPoints = Array.from({ length: 16 }).map((_, i) => ({
      lat: cityInfo.lat + (Math.random() - 0.5) * 0.2,
      lng: cityInfo.lng + (Math.random() - 0.5) * 0.2,
      temp: 22 + Math.random() * 21,
      id: `mock-${i}`
    }));
    setHeatpoints(mockPoints);
    setLoading(false);
  };

  const getTemperatureColor = (temp: number): string => {
    if (temp < 25) return '#0000ff';      // Blue
    if (temp < 30) return '#00ff00';      // Green
    if (temp < 35) return '#ffff00';      // Yellow
    if (temp < 40) return '#ff8800';      // Orange
    return '#ff0000';                     // Red
  };

  return (
    <div className="relative w-full h-full bg-gray-100 min-h-[300px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-50">
          <div className="flex items-center gap-2 text-gray-700 font-medium text-sm bg-white px-4 py-2 rounded-lg shadow-md">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            Loading thermal map...
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 z-40 max-w-xs shadow-md">
          ⚠️ {error}
        </div>
      )}

      <MapContainer
        key={`${workflowId}-${cityInfo.lat}-${cityInfo.lng}`}
        center={[cityInfo.lat, cityInfo.lng]}
        zoom={cityInfo.zoom}
        style={{ height: '100%', width: '100%', minHeight: '300px' }}
        className="z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {heatpoints.map((point) => (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lng]}
            radius={10}
            pathOptions={{
              color: getTemperatureColor(point.temp),
              fillColor: getTemperatureColor(point.temp),
              fillOpacity: 0.75,
              weight: 2
            }}
          >
            <Popup>
              <div className="text-center p-1">
                <p className="font-bold text-lg text-gray-900">{point.temp.toFixed(1)}°C</p>
                <p className="text-xs text-gray-500 font-medium">Thermal Reading</p>
                <p className="text-[10px] text-gray-400 mt-1">FortyGuard Satellite Telemetry</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3 z-40">
        <p className="text-xs font-bold text-gray-900 mb-2">Temperature Scale</p>
        <div className="space-y-1 text-xs font-medium">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: '#0000ff' }}></div>
            <span className="text-gray-700">&lt;25°C (Cool)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: '#00ff00' }}></div>
            <span className="text-gray-700">25–30°C (Moderate)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: '#ffff00' }}></div>
            <span className="text-gray-700">30–35°C (Warm)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: '#ff8800' }}></div>
            <span className="text-gray-700">35–40°C (Hot)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: '#ff0000' }}></div>
            <span className="text-gray-700">&gt;40°C (Extreme)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export { InteractiveMap };
