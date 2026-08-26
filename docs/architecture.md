# Architecture direction

GRADIENCE will center on a shared **City Context**: location, time, thermal state, environmental state, land cover, vegetation, built environment, exposure, infrastructure, predictions, and recommendations.

The initial codebase will keep these boundaries separate:

1. Provider adapters retrieve external data without exposing provider-specific schemas to the application.
2. City-domain contracts normalize source data and preserve provenance, timestamps, methods, and uncertainty.
3. Decision services consume the shared context for city intelligence, development simulation, and climate-aware operations.
4. API and web applications remain thin interfaces over those services.

FortyGuard will be integrated later behind a thermal-data provider interface. Its API key will be read from `FORTYGUARD_API_KEY` locally and will never be committed.
