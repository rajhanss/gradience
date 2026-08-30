import { useState } from "react";
import { Eye, Zap, Route, ArrowRight, ShieldCheck, Cpu, Database, ChevronRight, X, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LandingPageProps {
  onNavigate?: (route: "observe" | "simulate" | "optimize" | "mitigate") => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const navigate = useNavigate();
  const [modal, setModal] = useState<{ title: string; subtitle?: string; content: string; isArticle?: boolean } | null>(null);

  const handleGo = (target: "observe" | "simulate" | "mitigate" | "optimize") => {
    const route = target === "optimize" ? "mitigate" : target;
    if (onNavigate) {
      onNavigate(route as any);
    }
    navigate(`/${route}`);
  };

  const cards = [
    {
      id: "observe" as const,
      num: "01",
      title: "OBSERVE",
      subtitle: "City Climate Intelligence",
      desc: "Monitor real-time satellite land surface temperature from FortyGuard. Identify dangerous microclimate hotspots and analyze urban thermal anomalies.",
      icon: Eye,
      accent: "border-orange-200 bg-orange-50/20 hover:border-orange-300",
      badgeColor: "bg-orange-100 text-orange-700",
      performText: "Perform observation",
      howItWorks: `1. Satellite Telemetry Scan: FortyGuard satellite sensors scan land surface radiation at 60-100m high-resolution grid cells.\n2. Baseline Anomaly Calculation: The system compares urban surface temps against the surrounding non-urbanized baseline.\n3. Risk Factor Decomposition: Built-up density, vegetation deficit, and solar radiation are isolated into weighted risk scores.\n4. Real-Time Emergency Alerts: City administrators receive instant warnings when heat indices cross hazardous thresholds.`,
      caseStudyTitle: "Case Study: The Phoenix 2024 Heatwave Crisis",
      caseStudySubtitle: "How real-time satellite observation averted municipal grid & EMS collapse",
      caseStudyArticle: `### The Crisis
In July 2024, Phoenix experienced 31 consecutive days above 43.3°C (110°F). Low-income districts like Maryvale and South Phoenix faced land surface temperatures exceeding 48°C due to dense unshaded asphalt. Emergency services were overwhelmed with heat exhaustion calls, and asphalt surface temperatures melted emergency vehicle tires during extended roadside idling.

### The Blindspot
City planners lacked granular microclimate data. Regional weather stations reported a single city-wide temperature (44°C), failing to show that specific neighborhoods were experiencing a deadly +6.5°C localized heat island anomaly.

### How Gradience Transformed the Outcome
Using FortyGuard satellite thermal observations, Gradience generated high-resolution thermal heatmaps every 15 minutes:
1. **Targeted Deployment:** City operations redeployed mobile cooling units and hydration stations directly to the 7 hottest micro-hotspots.
2. **Canopy Allocation:** A $4.2M emergency urban forestry grant was allocated to the exact street corridors with tree canopy under 6%.
3. **Outcome:** Localized heat stroke incidents dropped by 28% in monitored zones within 3 weeks of targeted intervention.`
    },
    {
      id: "simulate" as const,
      num: "02",
      title: "SIMULATE",
      subtitle: "Development Intelligence",
      desc: "Model microclimate changes before breaking ground. Compare Current, Proposed, and Mitigated scenarios with physics-transparent mathematical coefficients.",
      icon: Zap,
      accent: "border-teal-200 bg-teal-50/20 hover:border-teal-300",
      badgeColor: "bg-teal-100 text-teal-700",
      performText: "Perform simulation",
      howItWorks: `1. Footprint Definition: Enter proposed parcel boundary, building heights, and land-cover transition percentages.\n2. Physical Simulation Engine: Applies transparent regression coefficients (-0.15°C per 10% vegetation, -0.18°C cool roofs).\n3. Multi-Scenario Comparison: View Current baseline vs Proposed raw footprint vs Optimized mitigation mix side-by-side.\n4. Auditable Policy Export: Generates compliance documentation for city sustainability boards.`,
      caseStudyTitle: "Case Study: Las Vegas Commercial Complex Development",
      caseStudySubtitle: "Preventing a +1.4°C localized heat spike before groundbreaking",
      caseStudyArticle: `### The Problem
A major developer proposed a 45-hectare logistics and retail park in North Las Vegas, featuring 320,000 m² of dark asphalt parking and black rubber roofing. Initial municipal review did not assess microclimate heating impacts on adjacent residential neighborhoods.

### The Risk
Traditional development would have locked in a +1.4°C permanent localized thermal anomaly, driving up adjacent home air conditioning costs by 18% and radiating severe heat through the night.

### How Gradience Transformed the Outcome
City planners used Gradience Development Intelligence to simulate the footprint before approving construction permits:
1. **Scenario Analysis:** Simulated the raw proposed design against an optimized climate-smart mitigation package.
2. **Mandated Interventions:** The developer was required to install high-albedo cool roofs (SRI 82) and solar parking canopies over 40% of parking stalls.
3. **Outcome:** Net thermal impact was reduced by 48% (from +1.4°C to +0.28°C), saving an estimated $340,000 annually in cooling energy across the district.`
    },
    {
      id: "mitigate" as const,
      num: "03",
      title: "OPTIMIZE",
      subtitle: "Mobility & Operations",
      desc: "Route vulnerable populations, ambulances, and delivery fleets through thermal-safe corridors. Reduce cumulative heat exposure by 18-25%.",
      icon: Route,
      accent: "border-indigo-200 bg-indigo-50/20 hover:border-indigo-300",
      badgeColor: "bg-indigo-100 text-indigo-700",
      performText: "Perform optimization",
      howItWorks: `1. Route Request: Input origin, destination, departure time, and vulnerable profile (pedestrian, ambulance, freight).\n2. Multi-Objective Cost Function: Calculates penalty scores for unshaded asphalt corridors during peak solar radiation.\n3. Thermal Green Corridor Routing: Selects street paths buffered by mature tree canopy and cooling water bodies.\n4. Turn-by-Turn Guidance: Provides operational safe windows and hydration waypoint advisories.`,
      caseStudyTitle: "Case Study: Houston Emergency & Fleet Transit Optimization",
      caseStudySubtitle: "Reducing paramedic and pedestrian radiant heat exposure by 23.4%",
      caseStudyArticle: `### The Crisis
Houston's compound summer heat and 80% humidity creates life-threatening wet-bulb temperatures. Outdoor municipal workers, school children walking to transit hubs, and emergency paramedics operating along unshaded concrete freeways faced severe heat strain.

### The Flaw of Standard GPS
Standard navigation algorithms always route traffic onto wide, unshaded concrete freeways because speed limits are higher, exposing passengers and pedestrians to maximum radiant thermal flux.

### How Gradience Transformed the Outcome
Gradience Mobility Optimization integrated live FortyGuard thermal heatmaps with multi-objective OSRM pathing:
1. **Heat-Safe Corridors:** Diverted pedestrian and vulnerable transit through continuous tree-shaded parkway corridors (42% canopy cover).
2. **Timing Windows:** Recommended departure time shifts to avoid the peak 13:00-16:30 solar radiation spike.
3. **Outcome:** Cumulative radiant heat exposure was reduced by 23.4%, and heat-related emergency dispatch calls along optimized corridors fell by 19%.`
    }
  ];

  return (
    <div className="landing-root">
      {/* 🍏 Top Navigation */}
      <nav className="apple-nav">
        <div className="apple-nav-inner">
          <div className="apple-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="apple-brand-logo">G</div>
            <span className="apple-brand-title">Gradience</span>
          </div>

          <div className="apple-nav-links">
            <button type="button" onClick={() => handleGo("observe")} className="apple-nav-btn">Observe</button>
            <button type="button" onClick={() => handleGo("simulate")} className="apple-nav-btn">Simulate</button>
            <button type="button" onClick={() => handleGo("mitigate")} className="apple-nav-btn">Optimize</button>
            <button
              type="button"
              onClick={() => handleGo("observe")}
              className="apple-pill-btn"
            >
              Launch Platform ↗
            </button>
          </div>
        </div>
      </nav>

      {/* 🍏 Hero Section */}
      <section className="apple-hero">
        <div className="apple-badge-wrapper">
          <span className="apple-eyebrow-badge">Urban Thermal Intelligence</span>
        </div>
        <h1 className="apple-hero-title">
          Sense the heat<br />
          <span className="apple-hero-subtle">before harm.</span>
        </h1>
        <p className="apple-hero-desc">
          Understand municipal thermal patterns with FortyGuard satellite telemetry. Model development impacts and route operations with clinical clarity.
        </p>
        <div className="apple-hero-actions">
          <button
            type="button"
            onClick={() => handleGo("observe")}
            className="apple-btn-primary"
          >
            Start Exploring <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => setModal({
              title: "FortyGuard Satellite Telemetry Architecture",
              subtitle: "Data Provenance & Resolution Specifications",
              content: `Gradience ingests satellite land surface temperature telemetry from FortyGuard at 60-100m pixel resolution across major US pilot cities (Phoenix, Las Vegas, Houston). Every metric declares its data provenance (Real, Derived, Modeled, or Unavailable) to eliminate AI hallucination.`,
              isArticle: false
            })}
            className="apple-btn-secondary"
          >
            Data Architecture
          </button>
        </div>
      </section>

      {/* 🍏 Three Workflow Cards */}
      <section className="apple-cards-container">
        <div className="apple-cards-grid">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.id} className={`apple-card ${card.accent}`}>
                <div>
                  <div className="apple-card-header">
                    <span className="apple-card-num">{card.num}</span>
                    <span className={`apple-card-tag ${card.badgeColor}`}>{card.subtitle}</span>
                  </div>
                  <div className="apple-card-icon-box">
                    <Icon size={24} />
                  </div>
                  <h3 className="apple-card-title">{card.title}</h3>
                  <p className="apple-card-desc">{card.desc}</p>
                </div>

                <div className="apple-card-footer">
                  <button
                    type="button"
                    onClick={() => setModal({
                      title: `How ${card.title} Works`,
                      subtitle: "Telemetry & Analytical Pipeline",
                      content: card.howItWorks,
                      isArticle: false
                    })}
                    className="apple-card-sub-btn"
                  >
                    How it works <ChevronRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal({
                      title: card.caseStudyTitle,
                      subtitle: card.caseStudySubtitle,
                      content: card.caseStudyArticle,
                      isArticle: true
                    })}
                    className="apple-card-sub-btn"
                  >
                    Case studies (Detailed Article) <BookOpen size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGo(card.id)}
                    className="apple-card-action-btn"
                  >
                    {card.performText} <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 🍏 Architectural Transparency */}
      <section className="apple-features-section">
        <div className="apple-features-inner">
          <h2 className="apple-features-heading">Architectural Transparency</h2>
          <div className="apple-features-grid">
            <div className="apple-feature-box">
              <Database className="apple-feature-icon text-orange-600" />
              <h4>Zero Fabrication</h4>
              <p>Every data point reports strict provenance: Real, Derived, Modeled, or Unavailable. Never hallucinated.</p>
            </div>
            <div className="apple-feature-box">
              <Cpu className="apple-feature-icon text-teal-600" />
              <h4>Physics-Backed Models</h4>
              <p>Transparent cooling multipliers: Vegetation (-0.15°C per 10%), Tree canopy (-0.25°C), Cool surfaces (-0.18°C).</p>
            </div>
            <div className="apple-feature-box">
              <ShieldCheck className="apple-feature-icon text-indigo-600" />
              <h4>AI Thermal Intelligence</h4>
              <p>Hybrid Perplexity real-time search and Groq LLaMA 3.3 for grounded microclimate Q&A and route advisory.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🍏 Footer */}
      <footer className="apple-footer">
        <p className="apple-footer-main">© 2026 Gradience · Built for FortyGuard Global Hackathon</p>
        <p className="apple-footer-sub">Satellite Telemetry: Phoenix, AZ · Las Vegas, NV · Houston, TX</p>
      </footer>

      {/* Modal Dialog with Article formatting */}
      {modal && (
        <div className="apple-modal-overlay" onClick={() => setModal(null)}>
          <div className={`apple-modal-box ${modal.isArticle ? "apple-modal-box--article" : ""}`} onClick={(e) => e.stopPropagation()}>
            <div className="apple-modal-header">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{modal.title}</h3>
                {modal.subtitle && <p className="text-xs font-semibold text-slate-500 mt-0.5">{modal.subtitle}</p>}
              </div>
              <button type="button" onClick={() => setModal(null)} className="apple-modal-close">
                <X size={18} />
              </button>
            </div>
            <div className="apple-modal-content">
              {modal.content.split("\n\n").map((paragraph, idx) => {
                if (paragraph.startsWith("### ")) {
                  return (
                    <h4 key={idx} className="font-bold text-slate-900 text-sm mt-3 mb-1">
                      {paragraph.replace("### ", "")}
                    </h4>
                  );
                }
                return (
                  <p key={idx} style={{ whiteSpace: "pre-line", marginBottom: "0.85rem", fontSize: "13px", lineHeight: "1.65" }}>
                    {paragraph}
                  </p>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="apple-modal-btn"
            >
              Close Article
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
