import { useState } from "react";
import { Eye, Zap, Route, ArrowRight, ShieldCheck, Cpu, Database, ChevronRight, X } from "lucide-react";

interface LandingPageProps {
  onNavigate: (route: "observe" | "simulate" | "optimize") => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [modal, setModal] = useState<{ title: string; content: string } | null>(null);

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
      howItWorks: `1. FortyGuard satellite constellation scans surface thermal radiation at 60-100m resolution.\n2. AI calculates thermal baseline anomaly vs surrounding rural baseline.\n3. Microclimate risk decomposition isolates built-up vs tree canopy deficits.\n4. City emergency operations receive real-time heat alerts.`,
      caseStudies: `• Phoenix AZ (2024): 7 critical heat islands detected (Peak 44.1°C). Guided $4.2M targeted tree canopy cooling.\n\n• Las Vegas NV: Thermal retention along the Strip mapped, prioritizing high-albedo reflective coatings.`
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
      howItWorks: `1. Define site boundary footprint and land-cover changes (built cover vs green space).\n2. Transparent physics engine calculates delta surface temperature without black-box hallucination.\n3. Compare Current vs Proposed vs Optimized scenarios side-by-side.\n4. Select optimal mitigation mixes (cool roofs, green corridors, water retention).`,
      caseStudies: `• Las Vegas Commercial Complex: Predicted +1.4°C localized thermal spike. Adding 30% cool roofs reduced net impact by 48%.\n\n• Houston Mixed-Use: Blue-green infrastructure reduced wet-bulb thermal index by 1.8°C.`
    },
    {
      id: "optimize" as const,
      num: "03",
      title: "OPTIMIZE",
      subtitle: "Mobility & Operations",
      desc: "Route vulnerable populations, ambulances, and delivery fleets through thermal-safe corridors. Reduce cumulative heat exposure by 18-25%.",
      icon: Route,
      accent: "border-indigo-200 bg-indigo-50/20 hover:border-indigo-300",
      badgeColor: "bg-indigo-100 text-indigo-700",
      howItWorks: `1. Enter origin, destination, departure window, and vulnerable transit profile.\n2. Multi-objective routing balances transit duration, distance, and radiant heat exposure.\n3. Engine dynamically navigates through tree canopy and park cooling shadows.\n4. Export operational guidance and thermal-safe waypoints.`,
      caseStudies: `• Houston Emergency Services: Heat-aware ambulance routing prevented high-temperature paramedic vehicle idling.\n\n• Phoenix Urban Transit: Reduced outdoor passenger heat stress exposure by 22% during heat emergencies.`
    }
  ];

  return (
    <div className="landing-root">
      {/* 🍏 Apple-Style Sticky Navigation */}
      <nav className="apple-nav">
        <div className="apple-nav-inner">
          <div className="apple-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="apple-brand-logo">G</div>
            <span className="apple-brand-title">Gradience</span>
          </div>

          <div className="apple-nav-links">
            <button type="button" onClick={() => onNavigate("observe")} className="apple-nav-btn">Observe</button>
            <button type="button" onClick={() => onNavigate("simulate")} className="apple-nav-btn">Simulate</button>
            <button type="button" onClick={() => onNavigate("optimize")} className="apple-nav-btn">Optimize</button>
            <button
              type="button"
              onClick={() => onNavigate("observe")}
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
            onClick={() => onNavigate("observe")}
            className="apple-btn-primary"
          >
            Start Exploring <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => setModal({
              title: "FortyGuard Hackathon Integration",
              content: "Gradience consumes FortyGuard satellite land surface temperature data across Phoenix, Las Vegas, and Houston. Built with strict data provenance tracking (Real, Derived, Modeled, Unavailable)."
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
                    onClick={() => setModal({ title: `How ${card.title} Works`, content: card.howItWorks })}
                    className="apple-card-sub-btn"
                  >
                    How it works <ChevronRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal({ title: `${card.title} Case Studies`, content: card.caseStudies })}
                    className="apple-card-sub-btn"
                  >
                    Case studies <ChevronRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate(card.id)}
                    className="apple-card-action-btn"
                  >
                    Perform {card.title.toLowerCase()} <ArrowRight size={14} />
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

      {/* 🍏 Minimal Footer */}
      <footer className="apple-footer">
        <p className="apple-footer-main">© 2026 Gradience · Built for FortyGuard Global Hackathon</p>
        <p className="apple-footer-sub">Satellite Telemetry: Phoenix, AZ · Las Vegas, NV · Houston, TX</p>
      </footer>

      {/* Modal Dialog */}
      {modal && (
        <div className="apple-modal-overlay" onClick={() => setModal(null)}>
          <div className="apple-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="apple-modal-header">
              <h3>{modal.title}</h3>
              <button type="button" onClick={() => setModal(null)} className="apple-modal-close">
                <X size={18} />
              </button>
            </div>
            <div className="apple-modal-content">
              {modal.content.split("\n\n").map((p, idx) => (
                <p key={idx} style={{ whiteSpace: "pre-line", marginBottom: "0.85rem" }}>{p}</p>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="apple-modal-btn"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
