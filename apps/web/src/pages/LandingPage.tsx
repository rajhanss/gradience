import { ArrowRight, Eye, Zap, Route, Lightbulb, MapPin } from 'lucide-react';

interface LandingPageProps {
  onNavigate?: (page: 'observe' | 'simulate' | 'optimize') => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const navigate = (path: string) => {
    const cleanPath = path.replace('/', '') as 'observe' | 'simulate' | 'optimize';
    if (onNavigate) {
      onNavigate(cleanPath);
    } else {
      window.location.hash = path;
    }
  };

  const workflowCards = [
    {
      id: 'observe',
      number: '01',
      title: 'OBSERVE',
      subtitle: 'City Intelligence',
      description: 'Monitor real-time thermal conditions from satellite data. Identify urban heat hotspots and understand thermal patterns that affect your city.',
      icon: Eye,
      bgGradient: 'from-red-50 via-orange-50 to-yellow-50',
      borderColor: 'border-red-200',
      buttonColor: 'hover:bg-red-50',
      buttons: [
        { text: 'How it works', action: 'howItWorks' },
        { text: 'Case studies', action: 'caseStudies' },
        { text: 'Perform observation', action: 'perform' }
      ]
    },
    {
      id: 'simulate',
      number: '02',
      title: 'SIMULATE',
      subtitle: 'Development Intelligence',
      description: 'Model how new developments change thermal conditions. Compare current, proposed, and optimized scenarios. Understand climate impact before construction.',
      icon: Zap,
      bgGradient: 'from-blue-50 via-cyan-50 to-teal-50',
      borderColor: 'border-blue-200',
      buttonColor: 'hover:bg-blue-50',
      buttons: [
        { text: 'How it works', action: 'howItWorks' },
        { text: 'Case studies', action: 'caseStudies' },
        { text: 'Perform simulation', action: 'perform' }
      ]
    },
    {
      id: 'optimize',
      number: '03',
      title: 'OPTIMIZE',
      subtitle: 'Mobility & Operations',
      description: 'Route people and operations safely around heat zones. Reduce thermal exposure and climate risk. Balance speed, distance, and human comfort.',
      icon: Route,
      bgGradient: 'from-purple-50 via-pink-50 to-gray-50',
      borderColor: 'border-purple-200',
      buttonColor: 'hover:bg-purple-50',
      buttons: [
        { text: 'How it works', action: 'howItWorks' },
        { text: 'Case studies', action: 'caseStudies' },
        { text: 'Perform optimization', action: 'perform' }
      ]
    }
  ];

  const handleCardAction = (workflowId: string, action: string) => {
    if (action === 'perform') {
      navigate(`/${workflowId}`);
    } else if (action === 'howItWorks') {
      alert(`How ${workflowId} works:\n\n${workflowId === 'observe' ? 'Step 1: FortyGuard satellite scans your city\nStep 2: AI analyzes thermal patterns\nStep 3: You see real-time hotspots\nStep 4: Make informed decisions' : workflowId === 'simulate' ? 'Step 1: Define your development\nStep 2: AI models 3 scenarios\nStep 3: Compare impacts\nStep 4: Choose best approach' : 'Step 1: Set start and end points\nStep 2: AI finds safest route\nStep 3: Avoid thermal exposure\nStep 4: Reduce climate risk'}`);
    } else if (action === 'caseStudies') {
      alert(`Case studies for ${workflowId}:\n\nPhoenix 2024: Reduced UHI by 2.3°C with green corridors\nLas Vegas 2024: Development impact reduced by 40%\nHouston 2024: Heat exposure reduced by 18% through optimization`);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/observe')}>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <h1 className="text-xl font-bold text-black tracking-tight">Gradience</h1>
          </div>
          
          <div className="hidden md:flex gap-8 items-center text-sm">
            <button type="button" onClick={() => navigate('/observe')} className="text-gray-600 hover:text-black transition">Observe</button>
            <button type="button" onClick={() => navigate('/simulate')} className="text-gray-600 hover:text-black transition">Simulate</button>
            <button type="button" onClick={() => navigate('/optimize')} className="text-gray-600 hover:text-black transition">Optimize</button>
            <button
              type="button"
              onClick={() => navigate('/observe')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-black font-medium transition shadow-sm"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-black text-black leading-tight mb-6 tracking-tight">
            Sense the heat<br />before harm.
          </h2>
          
          <p className="text-xl text-gray-700 mb-2 font-medium">
            Understand your city's climate. Model development impacts. Make decisions that work with nature, not against it.
          </p>
          
          <p className="text-sm text-gray-500 mb-8">
            Real-time thermal intelligence for city planners, climate operations, and infrastructure decisions.
          </p>

          <div className="flex gap-4 justify-center mb-16 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/observe')}
              className="px-8 py-3.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition flex items-center gap-2 shadow-md"
            >
              Start exploring <ArrowRight size={20} />
            </button>
            <button 
              type="button"
              onClick={() => handleCardAction('observe', 'howItWorks')}
              className="px-8 py-3.5 border-2 border-gray-300 text-black rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              How it works
            </button>
          </div>
        </div>
      </section>

      {/* Three Comprehensive Cards */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {workflowCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  className={`bg-gradient-to-br ${card.bgGradient} border-2 ${card.borderColor} rounded-2xl p-8 overflow-hidden group shadow-sm hover:shadow-md transition`}
                >
                  {/* Card Header */}
                  <div className="mb-6">
                    <p className="text-sm font-bold text-gray-500 mb-2">{card.number}</p>
                    <h3 className="text-3xl font-black text-black mb-1">{card.title}</h3>
                    <p className="text-sm text-gray-600 font-semibold">{card.subtitle}</p>
                  </div>

                  {/* Icon */}
                  <div className="mb-6 h-24 flex items-center justify-center bg-white/50 rounded-xl border border-white/60">
                    <Icon size={48} className="text-gray-600" />
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 mb-6 text-sm leading-relaxed min-h-[4rem]">
                    {card.description}
                  </p>

                  {/* Three Buttons */}
                  <div className="space-y-2 mb-4">
                    {card.buttons.map((btn, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleCardAction(card.id, btn.action)}
                        className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-black bg-white/70 transition ${card.buttonColor} text-left`}
                      >
                        {btn.text}
                      </button>
                    ))}
                  </div>

                  {/* Bottom CTA */}
                  <button
                    type="button"
                    onClick={() => handleCardAction(card.id, 'perform')}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    Launch <ArrowRight size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20 px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-black text-center mb-12 tracking-tight">Why Gradience</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Eye className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Real-time Data</h3>
              <p className="text-gray-600 text-sm leading-relaxed">FortyGuard satellite thermal data updated every 15 minutes. See what's actually hot, not predictions.</p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Lightbulb className="text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Transparent Models</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Every simulation coefficient is documented. No black boxes. City planners can tweak and decide.</p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Actionable</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Three interfaces for three stakeholders: observe, simulate, optimize. One platform for climate decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-2">Gradience</h3>
              <p className="text-gray-400 text-sm">Thermal clarity for urban climate decisions.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-200">Product</h4>
              <ul className="text-gray-400 text-sm space-y-2">
                <li><button type="button" onClick={() => navigate('/observe')} className="hover:text-white">Observe</button></li>
                <li><button type="button" onClick={() => navigate('/simulate')} className="hover:text-white">Simulate</button></li>
                <li><button type="button" onClick={() => navigate('/optimize')} className="hover:text-white">Optimize</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-200">Company</h4>
              <ul className="text-gray-400 text-sm space-y-2">
                <li><a href="#" className="hover:text-white">Docs</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
                <li><a href="https://github.com/rajhanss/gradience" target="_blank" rel="noreferrer" className="hover:text-white">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-200">Legal</h4>
              <ul className="text-gray-400 text-sm space-y-2">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            © 2026 Gradience. Built for FortyGuard Hackathon. Thermal clarity for resilient cities.
          </div>
        </div>
      </footer>
    </div>
  );
}
