# Gradience
**Thermal Intelligence Platform for Urban Thermal Decision-Making**

> Built for FortyGuard Hackathon 2026 (Aug 18–30)

[![Live Web Application](https://img.shields.io/badge/Live%20App-gradience--web.railway.app-emerald?style=for-the-badge&logo=react)](https://gradience-web-production.up.railway.app)
[![Live API & Docs](https://img.shields.io/badge/Live%20API-gradience--api.railway.app-blue?style=for-the-badge&logo=fastapi)](https://gradience-api-production.up.railway.app/docs)
[![CI Status](https://img.shields.io/badge/CI%20Workflow-100%25%20Passing-success?style=for-the-badge&logo=githubactions)](https://github.com/rajhanss/gradience/actions)

## Live Deployments & Links

- 🖥️ **Live Web Application:** [https://gradience-web-production.up.railway.app](https://gradience-web-production.up.railway.app)
- 📖 **Interactive API Documentation (Swagger / OpenAPI):** [https://gradience-api-production.up.railway.app/docs](https://gradience-api-production.up.railway.app/docs)
- 🛰️ **FortyGuard API Service:** [https://gradience-api-production.up.railway.app/v1/system/status](https://gradience-api-production.up.railway.app/v1/system/status)

## What This Is

Gradience is a comprehensive platform demonstrating three workflows for urban thermal decision-making:

1. **Observe** — Real-time heatmap visualization using FortyGuard satellite data (60–100m resolution) with ML-based Anomaly Detection
2. **Simulate** — Dual-engine thermal impact calculators for proposed municipal developments:
   - **Trained ML Model (`LinearRegression`)** with uncertainty bounds & feature interaction learning
   - **Deterministic Literature Model** for 100% explainable urban planning
3. **Optimize** — Heat-aware route planning with AI-powered strategic reasoning (Groq LLM) to reduce thermal exposure

This is a working prototype with:
- ✅ Real FortyGuard API integration (async polling)
- ✅ **ML-based anomaly detection** (Isolation Forest on thermal heatmap distributions)
- ✅ **Trained thermal simulator** (LinearRegression on 300 synthetic developments)
- ✅ **AI-powered route optimization** (Groq LLM + thermal reasoning)
- ✅ **Multi-year historical trends** (36-month monthly thermal progression & decadal trend rates for pilot cities)
- ✅ **Live Production Deployments** (Deployed on Railway with live Web + API services)
- ✅ LLM-powered chatbot (Groq + reference fallback)
- ✅ Data provenance tracking (REAL / DERIVED / MODELED / UNAVAILABLE)
- ✅ 100% test coverage for core and ML logic (36/36 tests passing)
- ✅ Docker containerization

---

## Key Features & Production Status

| Feature | Status | Deployment & Notes |
|---------|--------|---------------------|
| Real-time heatmap visualization | ✅ Complete | Uses FortyGuard API + Leaflet Map Layers |
| ML-based anomaly detection | ✅ Complete | Isolation Forest on heatmap telemetry distributions (`/v1/anomaly/detect`) |
| Trained ML thermal simulator | ✅ Complete | LinearRegression model on 300 synthetic developments (`/v1/development-intelligence/simulate-ml`) |
| Deterministic thermal simulator | ✅ Complete | Rule-based coefficients from published climate literature (`/v1/development-intelligence/simulate`) |
| AI-powered route optimization | ✅ Complete | Groq LLM (`llama-3.3-70b-versatile`) + rule-based fallback (`/v1/mobility/optimize-ai`) |
| Multi-year historical trends | ✅ Complete | 36-month monthly thermal progression, decadal warming rates, & 2030 projections (`/v1/historical-trends`) |
| Live city deployments | ✅ Complete | Live on Railway (`gradience-web` & `gradience-api`) |
| AI chatbot assistant | ✅ Complete | Groq LLM + keyword-regex reference fallback (`/v1/chatbot/respond`) |
| Multi-objective route routing | ✅ Complete | Distance + radiant solar exposure avoidance (`/v1/mobility/optimize`) |
| Data provenance tracking | ✅ Complete | REAL/DERIVED/MODELED/UNAVAILABLE tags across all metrics |

---

## How It Actually Works

### Architecture
```
FortyGuard Satellite API (real data)
         ↓
FastAPI Backend + ML Models (IsolationForest, LinearRegression, Groq LLM)
         ↓
React 19 Frontend + Leaflet Maps
         ↓
User Workflows: Observe / Simulate / Optimize
```

---

## Machine Learning & AI Components

### 1. Thermal Anomaly Detection (Isolation Forest)
Detects spatial and statistical thermal anomalies in heatmap distributions using unsupervised learning.

```bash
POST /v1/anomaly/detect?mean=47.0&max_temp=50.0&min_temp=45.0&std=0.5&pixel_count=200

# Response:
{
  "is_anomaly": true,
  "anomaly_score": -0.6196,
  "severity": "critical",
  "interpretation": "🚨 CRITICAL: Extreme thermal anomaly detected. Surface temperatures exceed 45°C with high concentration...",
  "recommendation": "Recommend immediate thermal inspection and emergency response coordination.",
  "model": "IsolationForest (trained on synthetic thermal data)",
  "confidence": 0.87
}
```

**Use Case:** Detect cooling system failures, microclimate hotspots, infrastructure faults, or sudden urban heat island anomalies.

### 2. Dual-Engine Urban Impact Simulator (ML + Deterministic)
Planners can select between:
- **Trained ML Engine (`LinearRegression`):** Trained on 300 development profiles with uncertainty estimation.
- **Deterministic Literature Engine:** Explainable coefficients from published climate literature.

```bash
POST /v1/development-intelligence/simulate-ml?latitude=33.4484&longitude=-112.0740
Content-Type: application/json

{
  "development_type": "commercial",
  "footprint_hectares": 10.0,
  "land_cover_changes": {
    "vegetation_change_pct": -8.0,
    "built_up_change_pct": 12.0
  },
  "mitigation_strategies": ["green_corridor", "tree_canopy"]
}
```

### 3. AI-Powered Strategic Route Optimization (Groq LLM)
Uses Groq LLM (`llama-3.3-70b-versatile`) to generate tactical route guidance, safe departure windows avoiding peak solar flux, hydration/cooling stops, and thermal exposure reduction estimates.

```bash
POST /v1/mobility/optimize-ai
Content-Type: application/json

{
  "mode": "personal_trip",
  "origin": {"latitude": 33.4484, "longitude": -112.0740},
  "destination": {"latitude": 33.4500, "longitude": -112.0600},
  "depart_at": "2026-08-30T06:00:00Z"
}
```

### 4. Multi-Year Historical Climate Trends
Provides 36-month monthly thermal progression, decadal warming rates (+0.85°C/decade in Phoenix), summer peak and winter low baselines, and 2030 projected heat risk for supported pilot cities.

```bash
GET /v1/historical-trends?latitude=33.4484&longitude=-112.0740&years=3
```

---

## Development Timeline

**Aug 3–17 (Hackathon Period):**
- ✅ Monorepo setup (packages + apps)
- ✅ FortyGuard provider adapter (async, retry logic)
- ✅ City domain models + data provenance contracts
- ✅ FastAPI backend (4 service layers)
- ✅ React frontend (3 workflows)
- ✅ Docker Compose local dev
- ✅ Initial test suite

**Aug 18–25 (Post-Hackathon, Polish Phase):**
- ✅ Chatbot enhancement (city keyword matching)
- ✅ Historical trends service & 36-month progression engine
- ✅ Production deployments to Railway (`gradience-web` & `gradience-api`)
- ✅ Hotspot analysis service & Decision assistant UI

**Aug 26–29 (Final Sprint, ML Features & Audit):**
- ✅ 100% pytest pass rate (36/36 tests green)
- ✅ ML Anomaly Detection (`IsolationForest`)
- ✅ Trained ML Thermal Simulator (`LinearRegression`)
- ✅ AI Route Optimization (`Groq LLM`)
- ✅ Dual simulation engine selector in frontend
- ✅ Multi-Year Historical Trends view wired in frontend workspace
- ✅ Full transparency audit & documentation

**Submission:** Aug 30, 2026, 11:59 PM IST

---

## Running Locally

```bash
# Prerequisites
Node.js 18+, Python 3.11+, Docker Compose

# Setup
git clone https://github.com/rajhanss/gradience.git
cd gradience
cp apps/api/.env.example apps/api/.env
# Add FORTYGUARD_API_KEY, GROQ_API_KEY (optional, fallback works)

# Run
docker compose up --build

# Test
python -m pytest apps/api/tests/ -v

# Access
Frontend: http://localhost:3000
API: http://localhost:8000
Docs: http://localhost:8000/docs
```

---

## Testing

```bash
# Run full test suite (36 tests including all ML modules)
pytest apps/api/tests/ -v

# Specific test suites:
pytest apps/api/tests/test_anomaly_detection.py -v
pytest apps/api/tests/test_ml_simulator.py -v
pytest apps/api/tests/test_ai_optimization.py -v
```

**Coverage:** 
- Anomaly detection (Isolation Forest normal/extreme/edge cases)
- ML simulator (Linear Regression positive/negative developments, uncertainty scaling)
- AI optimization (Groq LLM reasoning + fallback handling)
- Baseline simulation coefficients, chatbot fallback, heatmap polling, hotspot clustering, mobility routing.
- **Total:** 36 test cases, 100% pass rate.

