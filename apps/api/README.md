# API application

FastAPI application boundary. It currently exposes a health check and a provider-neutral City Context endpoint.

The City Context endpoint labels unavailable metrics explicitly. It will only surface real values after an approved provider result has been normalized into the shared domain model.
