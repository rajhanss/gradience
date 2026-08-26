# GRADIENCE

**Build smarter. Move safer.**

GRADIENCE is a city climate intelligence platform for understanding urban environmental conditions, simulating development impacts, and making climate-aware operational decisions.

## Repository layout

- `apps/api` — future FastAPI service and API boundary.
- `apps/web` — future React map-centric application.
- `packages/city-domain` — shared city-context domain contracts.
- `tests` — unit, API, and integration test suites.
- `infra` — local container and future cloud infrastructure configuration.
- `docs` — architecture and product decisions.

## Data integrity

All values shown by GRADIENCE must declare their provenance: **real**, **derived**, **modeled**, **synthetic/demo**, or **unavailable**. Provider secrets belong only in local environment configuration.

## Current status

The repository foundation is in place. Application code, dependencies, provider integration, and deployment configuration will be introduced in approved stages.
