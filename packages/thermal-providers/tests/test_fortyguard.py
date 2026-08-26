import asyncio
from datetime import date

import httpx

from gradience_thermal_providers import FortyGuardProvider, FortyGuardSettings, HeatmapRequest


def request() -> HeatmapRequest:
    return HeatmapRequest(
        polygon_aoi={"type": "FeatureCollection", "features": []},
        date_time={"start_date": date(2026, 8, 26), "start_time": "12:00", "filter_type": 1},
        granularity=100,
    )


def test_submits_provider_request_with_key_header() -> None:
    def handler(http_request: httpx.Request) -> httpx.Response:
        assert http_request.headers["api-key"] == "test-key"
        assert http_request.url.path == "/v1/heatmap"
        return httpx.Response(200, json={"error": False, "data": {"activity_id": "task-1"}})

    async def run() -> None:
        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        provider = FortyGuardProvider(FortyGuardSettings("test-key"), client)
        assert (await provider.submit_heatmap(request())).activity_id == "task-1"
        await client.aclose()

    asyncio.run(run())
