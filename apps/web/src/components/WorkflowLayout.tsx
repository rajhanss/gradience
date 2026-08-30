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
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-black mb-2 transition text-sm font-semibold group cursor-pointer"
            >
              <ArrowLeft size={18} className="transition group-hover:-translate-x-1" />
              Back to home
            </button>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-0.5">{subtitle}</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">{title}</h1>
              <p className="text-gray-600 text-sm mt-1 max-w-3xl leading-relaxed">{description}</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-800">Location: {city}</span>
          </div>
        </div>
      </header>

      {/* Main Content - Stacked Layout: ChatBot (Top) -> Map (Middle) -> Metrics (Bottom) */}
      <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto overflow-y-auto">
        {/* 1. ChatBot (Positioned on top of Map space, same size as Map space) */}
        <div className="w-full h-[520px] border-b border-gray-200 bg-white flex flex-col overflow-hidden shadow-xs">
          <ChatBot workflowId={workflowId} city={city} />
        </div>

        {/* 2. Map space (Full size preserved, same size as ChatBot space) */}
        <div className="w-full h-[520px] border-b border-gray-200 bg-gray-100 relative overflow-hidden">
          <InteractiveMap workflowId={workflowId} city={city} />
        </div>

        {/* 3. Metrics Dashboard */}
        <div className="w-full bg-white">
          <MetricsDashboard workflowId={workflowId} city={city} />
        </div>
      </div>
    </div>
  );
}
export { WorkflowLayout };
