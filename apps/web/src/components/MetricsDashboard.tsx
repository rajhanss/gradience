import { useEffect, useState } from 'react';
import { AlertTriangle, Thermometer, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Metrics {
  avgTemp: number;
  maxTemp: number;
  hotspots: number;
  trend: string;
  timeSeriesData: Array<{ time: string; temp: number }>;
}

interface MetricsDashboardProps {
  workflowId: string;
  city?: string;
}

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

const FALLBACK_METRICS: Record<string, Metrics> = {
  observe: {
    avgTemp: 32.4,
    maxTemp: 41.2,
    hotspots: 5,
    trend: '↑ +0.3°C/week',
    timeSeriesData: [
      { time: '00:00', temp: 28 },
      { time: '06:00', temp: 26 },
      { time: '12:00', temp: 35 },
      { time: '18:00', temp: 40 },
      { time: '24:00', temp: 32 }
    ]
  },
  simulate: {
    avgTemp: 30.1,
    maxTemp: 38.5,
    hotspots: 3,
    trend: '↓ -2.1°C (optimized)',
    timeSeriesData: [
      { time: 'Current', temp: 32 },
      { time: 'Proposed', temp: 33 },
      { time: 'Optimized', temp: 30 }
    ]
  },
  mitigate: {
    avgTemp: 28.7,
    maxTemp: 35.2,
    hotspots: 2,
    trend: '↓ -18% thermal exposure',
    timeSeriesData: [
      { time: 'Original', temp: 35 },
      { time: 'Route 1', temp: 32 },
      { time: 'Route 2', temp: 29 }
    ]
  }
};

export default function MetricsDashboard({ workflowId }: MetricsDashboardProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, [workflowId]);

  const loadMetrics = async () => {
    setLoading(true);

    const fallback = FALLBACK_METRICS[workflowId] || FALLBACK_METRICS.observe;

    try {
      console.log(`[Metrics] Loading for ${workflowId}`);
      
      const response = await fetch(
        `${API_BASE}/v1/city-intelligence/hotspots/${workflowId}`,
        { method: 'GET' }
      );

      if (response.ok) {
        const data = await response.json();
        setMetrics({
          avgTemp: data.avg_temp ?? data.tile_temperature?.value ?? fallback.avgTemp,
          maxTemp: data.max_temp ?? data.area_mean_temperature?.value ?? fallback.maxTemp,
          hotspots: data.hotspot_count ?? data.alerts?.length ?? fallback.hotspots,
          trend: data.trend ?? data.historical_trend?.value ?? fallback.trend,
          timeSeriesData: data.time_series ?? fallback.timeSeriesData
        });
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('[Metrics] Error:', err);
    }

    // Fallback to mock data
    console.log('[Metrics] Using fallback data');
    setMetrics(fallback);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 p-6">
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
          Loading thermal metrics...
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 p-6">
        <p className="text-gray-600 text-sm">No metrics data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto bg-white border-t border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-black">Thermal Metrics</h3>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 uppercase">
          {workflowId}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          ⚠️ {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 transition hover:border-gray-300">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer size={18} className="text-red-500" />
            <span className="text-xs font-semibold text-gray-600">Avg Temp</span>
          </div>
          <p className="text-2xl font-bold text-black">{metrics.avgTemp.toFixed(1)}°C</p>
          <p className="text-xs text-gray-500 mt-1">Average thermal reading</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 transition hover:border-gray-300">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-orange-500" />
            <span className="text-xs font-semibold text-gray-600">Max Temp</span>
          </div>
          <p className="text-2xl font-bold text-black">{metrics.maxTemp.toFixed(1)}°C</p>
          <p className="text-xs text-gray-500 mt-1">Peak temperature</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 transition hover:border-gray-300">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-yellow-500" />
            <span className="text-xs font-semibold text-gray-600">Hotspots</span>
          </div>
          <p className="text-2xl font-bold text-black">{metrics.hotspots}</p>
          <p className="text-xs text-gray-500 mt-1">Critical zones</p>
        </div>
      </div>

      {/* Trend */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3.5">
        <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
          📈 <span className="font-bold">Trend:</span> {metrics.trend}
        </p>
      </div>

      {/* Chart */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-black mb-3 text-sm">Temperature Over Time</h4>
        <div style={{ width: '100%', height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.timeSeriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="time" fontSize={11} stroke="#6b7280" />
              <YAxis fontSize={11} stroke="#6b7280" domain={['dataMin - 3', 'dataMax + 3']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                formatter={(val: any) => [`${val}°C`, 'Temperature']}
              />
              <Line type="monotone" dataKey="temp" stroke="#ff6b35" strokeWidth={2.5} dot={{ r: 3, fill: '#ff6b35' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-semibold text-red-900 mb-2 text-sm flex items-center gap-1.5">
          <span>⚠️</span> Active Alerts & Thermal Advisories
        </h4>
        <ul className="text-xs text-red-800 space-y-1.5 leading-relaxed font-medium">
          <li className="flex items-start gap-1.5">
            <span className="text-red-500">•</span>
            <span>Peak thermal zone detected in downtown municipal core</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-red-500">•</span>
            <span>Temperature {metrics.maxTemp > 40 ? 'exceeds' : 'approaching'} critical 40°C threshold</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-red-500">•</span>
            <span>{metrics.hotspots} heat exposure zones identified requiring tree canopy or shade structures</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
export { MetricsDashboard };
