import asyncio
import logging
import os

import httpx

from .models import HeatmapRequest, HeatmapResult, ThermalTask, ThermalTaskStatus

logger = logging.getLogger(__name__)


class FortyGuardError(RuntimeError):
    pass


class FortyGuardSettings:
    def __init__(self, api_key: str, base_url: str = "https://api.fortyguard.com", timeout_seconds: float = 30) -> None:
        if not api_key:
            raise ValueError("FORTYGUARD_API_KEY must be provided through the environment")
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds

    @classmethod
    def from_environment(cls) -> "FortyGuardSettings":
        return cls(os.environ.get("FORTYGUARD_API_KEY", ""), os.environ.get("FORTYGUARD_BASE_URL", "https://api.fortyguard.com"))


class FortyGuardProvider:
    """Async FortyGuard adapter with bounded polling and no secret logging."""

    def __init__(self, settings: FortyGuardSettings, client: httpx.AsyncClient | None = None, retries: int = 2) -> None:
        self._settings = settings
        self._client = client or httpx.AsyncClient(timeout=settings.timeout_seconds)
        self._owns_client = client is None
        self._retries = retries

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    async def submit_heatmap(self, request: HeatmapRequest) -> ThermalTask:
        payload = await self._request("POST", "/v1/heatmap", json=request.model_dump(mode="json", exclude_none=True))
        activity_id = payload.get("data", {}).get("activity_id")
        if not isinstance(activity_id, str):
            raise FortyGuardError("FortyGuard returned no activity_id")
        return ThermalTask(activity_id=activity_id)

    async def get_heatmap_result(self, activity_id: str) -> HeatmapResult | None:
        payload = await self._request("GET", f"/v1/status/{activity_id}")
        data = payload.get("data", {})
        status = str(data.get("status", "")).lower()
        if status == "failed":
            raise FortyGuardError(f"FortyGuard activity failed: {activity_id}")
        if status != ThermalTaskStatus.COMPLETED:
            return None
        result = data.get("result")
        if not isinstance(result, dict):
            raise FortyGuardError("Completed activity had no result")
        return HeatmapResult(activity_id=activity_id, map_data=result.get("map_data", {}), stats_data=result.get("stats_data", {}))

    async def _request(self, method: str, path: str, **kwargs: object) -> dict[str, object]:
        last_status: int | None = None
        for attempt in range(self._retries + 1):
            try:
                response = await self._client.request(method, f"{self._settings.base_url}{path}", headers={"api-key": self._settings.api_key}, **kwargs)
                last_status = response.status_code
                if response.status_code not in {429, 500, 502, 503, 504}:
                    if response.is_error:
                        try:
                            detail = response.json().get("message") or response.json().get("detail")
                        except ValueError:
                            detail = None
                        suffix = f": {detail}" if isinstance(detail, str) else ""
                        raise FortyGuardError(f"FortyGuard request failed (HTTP {response.status_code}){suffix}")
                    response.raise_for_status()
                    payload = response.json()
                    if payload.get("error"):
                        raise FortyGuardError("FortyGuard rejected the request")
                    return payload
            except (httpx.HTTPError, ValueError) as error:
                if attempt == self._retries:
                    suffix = f" (HTTP {last_status})" if last_status else ""
                    raise FortyGuardError(f"FortyGuard request failed{suffix}") from error
            if attempt < self._retries:
                await asyncio.sleep(0.25 * (2**attempt))
        suffix = f" (HTTP {last_status})" if last_status else ""
        raise FortyGuardError(f"FortyGuard request failed{suffix}")
