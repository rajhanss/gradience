import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatBot from './ChatBot';
import InteractiveMap from './InteractiveMap';
import MetricsDashboard from './MetricsDashboard';

interface WorkflowLayoutProps {
  workflowId: 'observe' | 'simulate' | 'mitigate';
  title: string;
  subtitle: string;
  description: string;
}

const CITY_MAP: Record<string, string> = {
  observe: 'Phoenix, AZ',
  simulate: 'Las Vegas, NV',
  mitigate: 'Houston, TX'
};

export default function WorkflowLayout({
  workflowId,
  title,
  subtitle,
  description
}: WorkflowLayoutProps) {
  const navigate = useNavigate();
  const city = CITY_MAP[workflowId] || 'Phoenix, AZ';

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">

      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-500 hover:text-black mb-1 transition text-sm font-medium cursor-pointer"
            >
              <ArrowLeft size={16} />
              Back to home
            </button>
            <div className="flex items-center gap-3">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-600">{subtitle}</p>
              <span className="text-gray-300">|</span>
              <h1 className="text-lg font-extrabold text-black tracking-tight">{title}</h1>
              <span className="text-gray-300 hidden sm:block">—</span>
              <p className="text-gray-500 text-xs hidden sm:block max-w-xl">{description}</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-gray-700">Live · {city}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        {/* Top section: Chat (left) + Map (right) side by side */}
        <div className="flex" style={{ height: '540px' }}>

          {/* ChatBot - Left panel */}
          <div className="flex flex-col border-r border-gray-200 bg-white" style={{ width: '380px', minWidth: '320px', flexShrink: 0 }}>
            <ChatBot workflowId={workflowId} city={city} />
          </div>

          {/* Interactive Map - Right panel */}
          <div className="flex-1 relative bg-gray-100 overflow-hidden">
            <InteractiveMap workflowId={workflowId} city={city} />
          </div>
        </div>

        {/* Bottom section: Metrics Dashboard full width */}
        <div className="w-full border-t border-gray-200 bg-white">
          <MetricsDashboard workflowId={workflowId} city={city} />
        </div>

      </div>
    </div>
  );
}

export { WorkflowLayout };
