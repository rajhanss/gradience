from typing import Literal

from pydantic import BaseModel

from gradience_thermal_providers import HeatmapRequest, HeatmapResult, ThermalDataProvider, ThermalTask


class HeatmapStatus(BaseModel):
    activity_id: str
    status: Literal["processing", "completed"]
    result: HeatmapResult | None = None


class CityIntelligenceService:
    """Application service; provider-specific behavior stays behind its port."""

    def __init__(self, provider: ThermalDataProvider) -> None:
        self._provider = provider

    async def submit(self, request: HeatmapRequest) -> ThermalTask:
        return await self._provider.submit_heatmap(request)

    async def status(self, activity_id: str) -> HeatmapStatus:
        result = await self._provider.get_heatmap_result(activity_id)
        if result is None:
            return HeatmapStatus(activity_id=activity_id, status="processing")
        return HeatmapStatus(activity_id=activity_id, status="completed", result=result)
