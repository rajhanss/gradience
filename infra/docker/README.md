# Local containers

`docker compose up --build` starts the FastAPI API and the nginx-hosted web application.

- The web container is available at `http://127.0.0.1:8080` and proxies `/api` to the API service.
- The API reads `FORTYGUARD_API_KEY` only at runtime; keep it in your local environment or your cloud secret manager.
- For a separately hosted web application, build `Dockerfile.web` with `--build-arg VITE_API_BASE=https://YOUR_API_URL`.
