import os
from datetime import UTC, datetime, timedelta

from fastapi import FastAPI, HTTPException, Query, status

from gradience_city_domain import (
    AreaOfInterest,
    CityContext,
    DataProvenance,
    EnvironmentalState,
    ExposureState,
    GeoPoint,
    LandCoverState,
    MeasuredMetric,
    ObservationWindow,
    ThermalState,
)
from gradience_thermal_providers import FortyGuardError, FortyGuardProvider, FortyGuardSettings, HeatmapRequest, ThermalDataProvider

from .city_intelligence import CityIntelligenceService, HeatmapStatus


def unavailable_metric() -> MeasuredMetric[float]:
    return MeasuredMetric[float](provenance=DataProvenance.UNAVAILABLE)


def provider_from_environment() -> ThermalDataProvider | None:
    """Configure the live provider only when its secret is supplied at runtime."""
    if not os.environ.get("FORTYGUARD_API_KEY"):
        return None
    return FortyGuardProvider(FortyGuardSettings.from_environment())


def create_app(provider: ThermalDataProvider | None = None, *, use_environment_provider: bool = False) -> FastAPI:
    active_provider = provider or (provider_from_environment() if use_environment_provider else None)
    app = FastAPI(title="GRADIENCE API", version="0.1.0")

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/v1/city-context", response_model=CityContext)
    async def city_context(
        latitude: float = Query(ge=-90, le=90),
        longitude: float = Query(ge=-180, le=180),
    ) -> CityContext:
        now = datetime.now(UTC)
        return CityContext(
            context_id=f"point:{latitude:.5f},{longitude:.5f}",
            area=AreaOfInterest(centroid=GeoPoint(latitude=latitude, longitude=longitude)),
            observation=ObservationWindow(starts_at=now, ends_at=now + timedelta(hours=1), timezone="UTC"),
            thermal=ThermalState(surface_temperature=unavailable_metric(), thermal_anomaly=unavailable_metric()),
            environmental=EnvironmentalState(aqi=unavailable_metric()),
            land_cover=LandCoverState(vegetation_cover=unavailable_metric(), built_up_cover=unavailable_metric()),
            exposure=ExposureState(),
        )

    def city_service() -> CityIntelligenceService:
        if active_provider is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Thermal provider is not configured; no live climate data is available.",
            )
        return CityIntelligenceService(active_provider)

    @app.post("/v1/city-intelligence/heatmaps", response_model=None, status_code=status.HTTP_202_ACCEPTED)
    async def submit_heatmap(request: HeatmapRequest) -> object:
        try:
            return await city_service().submit(request)
        except FortyGuardError as error:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error

    @app.get("/v1/city-intelligence/heatmaps/{activity_id}", response_model=HeatmapStatus)
    async def heatmap_status(activity_id: str) -> HeatmapStatus:
        return await city_service().status(activity_id)

    return app


app = create_app(use_environment_provider=True)
