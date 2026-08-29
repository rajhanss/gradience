# Contributing to Gradience

Thank you for your interest in contributing to Gradience!

## Development Setup

1. **Backend (FastAPI)**:
   ```bash
   cd apps/api
   pip install -e .[dev] -e ../../packages/city-domain -e ../../packages/thermal-providers
   pytest tests/ -v
   ```

2. **Frontend (React / Vite)**:
   ```bash
   cd apps/web
   npm install
   npx oxlint@latest src/ --deny-warnings
   npm run build
   ```

## Code Guidelines & Data Provenance

- **Strict Data Provenance**: Every metric returned by the API must carry an explicit `provenance` tag (`real`, `modeled`, `derived`, `unavailable`).
- **No Fabricated Telemetry**: Baseline city-context endpoints for unsupported coordinates must return `provenance: "unavailable"` and `value: null`.
- **Honest AI & Reference Framing**: User-facing copy, chatbot headers, and badge labels must accurately distinguish between live satellite telemetry, LLM generated responses, compiled reference briefings, and deterministic models.
- **CI Gate**: All PRs must pass Python pytest suite and frontend oxlint/tsc build checks.
