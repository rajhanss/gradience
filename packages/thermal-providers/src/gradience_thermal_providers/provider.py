from typing import Protocol

from .models import HeatmapRequest, HeatmapResult, ThermalTask


class ThermalDataProvider(Protocol):
    async def submit_heatmap(self, request: HeatmapRequest) -> ThermalTask: ...

    async def get_heatmap_result(self, activity_id: str) -> HeatmapResult | None: ...


class MockThermalDataProvider:
    """Deterministic test provider; it never invents a temperature result."""

    def __init__(self, *, result: HeatmapResult | None = None) -> None:
        self.result = result
        self.last_request: HeatmapRequest | None = None

    async def submit_heatmap(self, request: HeatmapRequest) -> ThermalTask:
        self.last_request = request
        return ThermalTask(activity_id="mock-activity")

    async def get_heatmap_result(self, activity_id: str) -> HeatmapResult | None:
        return self.result if activity_id == "mock-activity" else None
