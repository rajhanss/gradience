# Railway deployment

Deploy GRADIENCE as two services from `github.com/rajhanss/gradience`: `gradience-api` and `gradience-web`. The existing Dockerfiles build each service directly, so no local Docker installation is required.

## 1. API service

1. In Railway, create a project and add a service from the GitHub repository.
2. In **Build**, choose Dockerfile path `infra/docker/Dockerfile.api`.
3. In **Variables**, add:
   - `FORTYGUARD_API_KEY` — the real FortyGuard API key.
   - `GRADIENCE_ENV=production`
   - `GRADIENCE_CORS_ORIGINS=https://YOUR_WEB_PUBLIC_DOMAIN`
4. Generate a public domain after the first successful deployment. Railway provides `PORT`; do not add it manually.

`GROQ_API_KEY` is deliberately not configured: the shipped Decision Assistant uses GRADIENCE's deterministic What-If engine and does not call Groq or expose an LLM key in the browser.

## 2. Web service

1. Add a second service from the same repository.
2. In **Build**, choose Dockerfile path `infra/docker/Dockerfile.web`.
3. Set `API_UPSTREAM=http://${{gradience-api.RAILWAY_PRIVATE_DOMAIN}}:${{gradience-api.PORT}}`, replacing `gradience-api` with the actual API service name. Railway resolves this reference at deployment time. The web server proxies `/api` privately, so no browser API key is needed.
4. Generate a public domain and copy it into the API service's `GRADIENCE_CORS_ORIGINS` value, then redeploy the API.

## Validation

Open the web public domain and then confirm `https://YOUR_API_DOMAIN/health` returns a JSON health response. Use Railway's deployment logs to diagnose a failed build; never paste secret values into logs, GitHub, or chat.
