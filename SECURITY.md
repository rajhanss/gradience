# Security & Transparency Notes

## API Keys & Secrets

- **Never commit .env files** (included in `.gitignore`)
- **FORTYGUARD_API_KEY:** Used for thermal satellite heatmap data requests
- **GROQ_API_KEY:** Used for LLM inference (optional - system gracefully falls back to compiled reference models)

## Data Privacy

- No user personal data collected
- All thermal data sourced from FortyGuard API (public/sandbox satellite telemetry)
- Chatbot queries processed in-memory only (not persisted to disk)
- Zero third-party tracking or analytics scripts

## Deployment Security

### Local Development
- CORS restricted to configured localhost origins
- No authentication required (sandbox prototyping mode)

### Production (Railway / Cloud Run)
- CORS configured for specific frontend deployment domains via `GRADIENCE_CORS_ORIGINS`
- Wildcard CORS origins explicitly set `allow_credentials=False` for browser security compliance
- API rate limiting enforced at ingress/provider layer
- HTTPS enforced across all endpoints
- Platform secret managers used for environment variables

## Vulnerability Reporting

If you find a security issue or credential exposure, please email `security@gradience.dev` or open a private issue on GitHub.

---

*Note: Authentication is intentionally omitted from this hackathon prototype to allow seamless grading and review by hackathon judges.*
