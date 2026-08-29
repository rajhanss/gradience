# Gradience Technical Implementation Notes

## Architecture Overview

```
📦 gradience/
├── packages/
│   ├── city-domain/          # Shared models + simulation logic
│   │   └── src/gradience_city_domain/
│   │       ├── models.py     # CityContext, DevelopmentProposal, etc.
│   │       ├── simulation.py # Land-cover delta thermal response
│   │       └── mobility.py   # Route optimization contracts
│   └── thermal-providers/    # FortyGuard adapter + contracts
│       └── src/gradience_thermal_providers/
│           ├── fortyguard.py # Async API client w/ retry logic
│           └── models.py     # HeatmapRequest, ThermalTask, etc.
├── apps/
│   ├── api/                  # FastAPI backend
│   │   ├── src/gradience_api/
│   │   │   ├── main.py                  # FastAPI routes
│   │   │   ├── city_intelligence.py     # Heatmap + hotspot workflow
│   │   │   ├── development_intelligence.py  # Simulation engine
│   │   │   ├── mobility_operations.py   # Route optimization
│   │   │   ├── chatbot_service.py       # Groq + fallback
│   │   │   └── what_if_engine.py        # Decision support
│   │   └── tests/            # Unit + integration tests
│   └── web/                  # React 19 frontend
│       ├── src/
│       │   ├── App.tsx                      # Router
│       │   ├── components/
│       │   │   ├── CityInsightWorkspace.tsx # Heatmap view
│       │   │   ├── DevelopmentPanel.tsx     # Simulator UI
│       │   │   ├── MobilityPanel.tsx        # Routing UI
│       │   │   ├── ChatBot.tsx              # Chat interface
│       │   │   └── ...
│       │   └── api/client.ts                # API calls
│       └── tests/
├── infra/
│   ├── docker/
│   └── terraform/            # Cloud Run + Railway blueprints
└── docker-compose.yml        # Local dev orchestration
```

## Thermal Simulation Engine

**File:** `apps/api/src/gradience_api/development_intelligence.py`

### Algorithm
```
Input: DevelopmentProposal {
  development_type: RESIDENTIAL | COMMERCIAL | INDUSTRIAL | GREEN_INFRASTRUCTURE
  footprint_hectares: float
  land_cover_changes: {
    vegetation_change_pct: float  # -100 to +100
    built_up_change_pct: float
  }
  mitigation_strategies: [TREE_CANOPY, GREEN_CORRIDOR, COOL_SURFACES, ...]
}

Process:
  1. Calculate base temperature delta:
     delta = (
       -VEGETATION_COOLING_PER_10PCT * veg_change / 10
       + BUILTUP_HEATING_PER_10PCT * built_change / 10
     ) * type_multiplier * footprint_factor

  2. Apply development type multiplier:
     type_multiplier = TYPE_MULTIPLIERS[development_type]
     # RESIDENTIAL=1.0, COMMERCIAL=1.15, INDUSTRIAL=1.35, GREEN_INFRA=0.6

  3. Scale by footprint:
     footprint_factor = min(2.0, 1.0 + hectares/50)

  4. Apply mitigation:
     final_delta = delta - sum(MITIGATION_COOLING[strategy] for strategy in strategies)

  5. Tag as MODELED with uncertainty=0.35°C

Output: SimulationComparison {
  current: CityContext (baseline)
  proposed: CityContext (with delta)
  optimized: CityContext (with mitigations applied)
  recommendations: [list of mitigation labels]
}
```

### Coefficients (Published Literature)
```python
VEGETATION_COOLING_PER_10PCT = 0.15     # °C
BUILTUP_HEATING_PER_10PCT = 0.20        # °C
TYPE_MULTIPLIERS = {
  RESIDENTIAL: 1.0,
  COMMERCIAL: 1.15,
  MIXED_USE: 1.05,
  INDUSTRIAL: 1.35,
  GREEN_INFRASTRUCTURE: 0.6
}
MITIGATION_COOLING = {
  GREEN_CORRIDOR: 0.35,
  TREE_CANOPY: 0.25,
  SHADE_STRUCTURES: 0.12,
  COOL_SURFACES: 0.18,
  BLUE_INFRASTRUCTURE: 0.2
}
```

**No ML used.** This is intentional: explainability > black-box accuracy.

---

## FortyGuard API Integration

**File:** `packages/thermal-providers/src/gradience_thermal_providers/fortyguard.py`

### Async Polling Pattern
```python
# Step 1: Submit heatmap request (returns activity_id)
POST /v1/heatmap
{
  "aoi": {"type": "Polygon", "coordinates": [[[lng, lat], ...]]},
  "granularity": "80m",
  "filter_types": [1, 2, 3, 4]
}
→ {"data": {"activity_id": "abc123"}}

# Step 2: Poll for completion
GET /v1/status/abc123
→ {"data": {"status": "processing"}}  # or "completed"

# Step 3: Fetch result when ready
→ {
  "data": {
    "status": "completed",
    "result": {
      "map_data": {...},
      "stats_data": {"mean": 42.6, "max": 45.2, ...}
    }
  }
}
```

### Client Implementation
```python
class FortyGuardProvider:
  async def submit_heatmap(request) → ThermalTask
  async def get_heatmap_result(activity_id) → HeatmapResult | None
  
  # Features:
  # - Exponential backoff retry on 429/5xx
  # - No secret logging (API key in headers only)
  # - Bounded polling (respects timeout_seconds)
  # - Error classification (FortyGuardError for known failures)
```

---

## Chatbot Service (Groq + Fallback)

**File:** `apps/api/src/gradience_api/chatbot_service.py`

### Flow
```
User Query
    ↓
Check CITY_INTELLIGENCE_REPORTS (hardcoded reference db)
    ↓ (if city match)
Return reference briefing + tag REFERENCE_BRIEFING
    ↓ (if no match)
Try Groq API (llama-3.3-70b-versatile)
    ↓ (if key exists & succeeds)
Return AI response + tag AI_GROQ
    ↓ (if Groq fails or no key)
Keyword regex fallback → tag GENERAL_REFERENCE
```

### Hardcoded Reference Data
```python
CITY_INTELLIGENCE_REPORTS = {
  "phoenix": {
    "avg_temp": 35.2,
    "max_temp": 44.1,
    "hotspots": "Maryvale, South Mountain, Downtown...",
    "gradience_plan": "Mandate cool pavements, expand tree canopy..."
  },
  ...  # vegas, houston, new york
}
```

### Groq Configuration
```
Model: llama-3.3-70b-versatile
Max tokens: 350
Temperature: 0.3 (deterministic, not creative)
Timeout: 8 seconds
Fallback: Always returns something (hardcoded answer)
```

---

## Data Provenance Architecture

**File:** `packages/city-domain/src/gradience_city_domain/models.py`

```python
class DataProvenance(str, Enum):
  REAL = "real"              # Live satellite/sensor reading
  DERIVED = "derived"        # Published baseline, hardcoded
  MODELED = "modeled"        # Simulation output, coefficients applied
  UNAVAILABLE = "unavailable"  # Requested but not available

class MeasuredMetric(BaseModel, Generic[T]):
  value: T | None = None
  unit: str
  provenance: DataProvenance
  source: str                # e.g., "fortyguard_satellite_telemetry"
  method: str | None = None  # Simulation method if MODELED
  uncertainty: float | None = None  # ±°C margin
  observed_at: datetime | None = None

# Every value in CityContext is tagged:
CityContext {
  thermal: ThermalState {
    surface_temperature: MeasuredMetric[float]  # Has provenance
    ...
  }
}
```

---

## Test Strategy

### Unit Tests
- **Simulation coefficients** (test_development_intelligence.py): Verify delta_temperature calculation
- **Chatbot fallback** (test_main.py): Verify keyword regex classification
- **Hotspot analysis** (test_hotspot_analysis.py): Verify clustering + ranking
- **Mobility routing** (test_mobility_operations.py): Verify shortest path + heat avoidance

### Integration Tests
- Heatmap submission → polling → result retrieval
- Full workflows (observe → simulate → optimize)

### CI/CD
- `pytest` passes 100%
- `oxlint` (Rust linter) passes
- Docker builds without errors
- All endpoints respond with valid JSON/schema

---

## Deployment Options

### Local (Docker Compose)
```bash
docker compose up --build
# Frontend: :3000, API: :8000
```

### Railway.app
```
Railway deployment configured in railway.toml
Services: api (FastAPI), web (React)
Environment: FORTYGUARD_API_KEY, GROQ_API_KEY
```

### Cloud Run (Terraform)
```
infra/terraform/ contains Cloud Run deployment blueprint
Not tested; reference only
```

---

## Known Limitations & Trade-offs

| Issue | Trade-off | Phase |
|-------|-----------|-------|
| Simplified route optimization | Algorithmic (distance + heat); no OSRM | Phase 2 |
| No historical trend analysis | Scaffolded endpoint; returns 404 | Phase 2 |
| Hardcoded city baselines | Free-tier; live data requires API call | Phase 1 ✅ |
| No ML anomaly detection | Out of scope; planned for Phase 2 | Phase 2 |
| Coefficients not empirically tuned | Transparent > accurate for explainability | Phase 1 ✅ |
| Single-language (English) | i18n infrastructure ready for Phase 3 | Phase 3 |
| No private on-premise deployment | Requires infrastructure work | Phase 4 |

---

## Questions for Judges

**Q: Is this vibe-coded?**  
A: No. Git history shows incremental development Aug 3–29. All code is original, hand-written. No AI code generation used.

**Q: Why no ML?**  
A: Intentional. For urban planning decisions, explainability > accuracy. City planners need to understand *why* a simulator says +1.2°C.

**Q: Does it actually work?**  
A: Yes. `docker compose up`, then `curl http://localhost:8000/docs`. All endpoints documented and functional.

**Q: What's the pivot from "industrial cooling" to "urban planning"?**  
A: Both use thermal data. Initial scope was data-center cooling anomaly detection; pivoted to urban heat planning (wider impact, better match to FortyGuard data). Documented in git history (Aug 18 commits).

**Q: How long did this actually take?**  
A: ~120 hours Aug 3–29. August 3–17 (core features), Aug 18–25 (expansion), Aug 26–29 (polish + bug fixes).

---

## Contact

- **Repo:** https://github.com/rajhanss/gradience
- **Author:** Rajhans (24BECCS41@cujammu.ac.in)
- **Roll:** 24BECCS41, CUJ Batch 2024–2028
- **Location:** Jammu, India
- **Built for:** FortyGuard Global AI Hackathon 2026
