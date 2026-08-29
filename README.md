# GRADIENCE

**Build smarter. Move safer.**

GRADIENCE is a city climate intelligence platform for understanding urban environmental conditions, simulating development impacts, and making climate-aware operational decisions.

## Repository layout

- `apps/api` — FastAPI service and API boundary
- `apps/web` — React map-centric dashboard
- `packages/city-domain` — shared City Context domain contracts
- `packages/thermal-providers` — FortyGuard and mock thermal adapters
- `tests` — reserved for cross-cutting test suites
- `infra/docker` — container definitions
- `docs` — architecture notes

## Quick start (local)

### Backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e packages/city-domain -e packages/thermal-providers -e "apps/api[dev]"
uvicorn gradience_api.main:app --app-dir apps/api/src --reload --host 127.0.0.1 --port 8000
```

### Frontend

```powershell
cd apps/web
npm install
npm run dev
```

Open http://127.0.0.1:5173/ — the Vite dev server proxies `/api` to the backend on port 8000.

### Optional live thermal data

Copy `.env.example` to `.env` and set:

```env
FORTYGUARD_API_KEY=your_key_here
```

Without a key, the API remains honest: metrics stay `unavailable` and the UI labels that clearly.

## API surface

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness |
| `GET /v1/system/status` | API + provider configuration |
| `GET /v1/city-context` | Shared City Context (no fabricated metrics) |
| `POST /v1/city-intelligence/heatmaps` | Submit FortyGuard heatmap job |
| `GET /v1/city-intelligence/heatmaps/{id}` | Poll heatmap status |
| `GET /v1/city-intelligence/context-from-heatmap/{id}` | Enrich context from completed stats |
| `POST /v1/development-intelligence/simulate` | Urban Impact Simulator (baseline model) |
| `POST /v1/mobility/optimize` | Climate-aware route optimization |
| `POST /v1/what-if` | Deterministic What-If intent routing |

## Docker

```powershell
docker compose up --build
```

- API: http://127.0.0.1:8000/
- Web: http://127.0.0.1:8080/ (nginx proxies `/api` → api service)

## Data integrity

Every metric declares provenance: **real**, **derived**, **modeled**, **synthetic/demo**, or **unavailable**.

- FortyGuard observations map to `real` / `derived`
- Development and mobility engines use transparent baseline models labeled `modeled`
- Missing sources never masquerade as observed data

## Tests

```powershell
pytest apps/api/tests packages/city-domain/tests packages/thermal-providers/tests -q
cd apps/web
npm run build
```

## Architecture loop

```
OBSERVE → UNDERSTAND → SIMULATE → MITIGATE → OPTIMIZE → OBSERVE AGAIN
```

Three interfaces share one backend core:

1. **City Intelligence** — current thermal/environmental state
2. **Development Intelligence** — Urban Impact Simulator
3. **Mobility & Operations** — climate-aware routing

## Current status

- Reference-inspired dark homepage with three dedicated product interfaces
- Shared City Context contracts with provenance enforcement
- FortyGuard provider adapter (async, retries, no secret logging)
- Live heatmap submit/poll workflow with stats enrichment
- City Intelligence workspace with thermal, hotspot, trends, exposure, and alerts states
- Development simulator with current / proposed / optimized comparison and explicit mitigation strategies
- Mobility workspace for personal trips, outdoor events, and temperature-sensitive deliveries
- Deterministic What-If decision layer (LLM-ready interface)
- In-app deterministic Decision Assistant, with clear provenance and no invented live data
- React map-centric dashboard with dedicated City, Development, and Mobility pages
- Docker Compose for local production-like runs
- Cloud Run Terraform configuration with Secret Manager-based FortyGuard key injection

## Remaining / future work

- Real OSRM/graph routing integration
- Historical trend storage (no fabricated history)
- LLM-backed What-If intent parsing
- Development monitoring feedback loop (predicted vs observed ΔT)
