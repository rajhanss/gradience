import os
import logging
from time import perf_counter
from uuid import uuid4
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import Body, FastAPI, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from gradience_city_domain import (
    AreaOfInterest,
    CityContext,
    DataProvenance,
    DevelopmentProposal,
    EnvironmentalState,
    ExposureState,
    GeoPoint,
    LandCoverState,
    MeasuredMetric,
    ObservationWindow,
    RouteRequest,
    ThermalState,
    WhatIfQuery,
)
from gradience_thermal_providers import FortyGuardError, FortyGuardProvider, FortyGuardSettings, HeatmapRequest, ThermalDataProvider

from .chatbot_service import chatbot_service
from .city_intelligence import CityIntelligenceService, HeatmapStatus
from .development_intelligence import DevelopmentIntelligenceService
from .heatmap_mapper import apply_heatmap_stats
from .hotspot_analysis import HotspotAnalysis, HotspotAnalysisService
from .mobility_operations import MobilityOperationsService
from .system_status import SystemStatus
from .what_if_engine import WhatIfEngine

logger = logging.getLogger(__name__)


class ChatbotPayload(BaseModel):
    workflow: str = Field(default="observe")
    message: str = Field(default="")
    history: list[dict[str, Any]] = Field(default_factory=list)


def cors_origins_from_environment() -> list[str]:
    """Read approved browser origins without opening CORS to every domain."""
    configured = os.environ.get("GRADIENCE_CORS_ORIGINS", "")
    origins = [origin.strip() for origin in configured.split(",") if origin.strip()]
    return origins or ["http://127.0.0.1:5173", "http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8080"]


def unavailable_metric() -> MeasuredMetric[float]:
    return MeasuredMetric[float](provenance=DataProvenance.UNAVAILABLE)


def provider_from_environment() -> ThermalDataProvider | None:
    """Configure the live provider only when its secret is supplied at runtime."""
    if not os.environ.get("FORTYGUARD_API_KEY"):
        return None
    return FortyGuardProvider(FortyGuardSettings.from_environment())


def create_app(provider: ThermalDataProvider | None = None, *, use_environment_provider: bool = False) -> FastAPI:
    active_provider = provider or (provider_from_environment() if use_environment_provider else None)
    development_service = DevelopmentIntelligenceService()
    mobility_service = MobilityOperationsService()
    what_if_engine = WhatIfEngine()
    hotspot_service = HotspotAnalysisService()

    app = FastAPI(title="GRADIENCE API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins_from_environment(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def request_observability(request: Request, call_next: object) -> Response:
        request_id = request.headers.get("x-request-id", str(uuid4()))
        started_at = perf_counter()
        response = await call_next(request)  # type: ignore[operator]
        response.headers["x-request-id"] = request_id
        logger.info(
            "api_request request_id=%s method=%s path=%s status=%s duration_ms=%.1f",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            (perf_counter() - started_at) * 1000,
        )
        return response

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/v1/system/status", response_model=SystemStatus)
    async def system_status() -> SystemStatus:
        return SystemStatus.current(thermal_provider_configured=active_provider is not None)

    @app.post("/v1/chatbot/respond")
    async def chatbot_respond(
        body: ChatbotPayload | None = None,
        workflow: str | None = Query(default=None),
        message: str | None = Query(default=None),
        history: list = Body(default=[]),
    ) -> dict[str, Any]:
        """
        AI-powered thermal intelligence chatbot.
        Uses Perplexity (search) + Groq (generation) with fallback knowledge base.
        """
        target_wf = (body.workflow if body and body.workflow else workflow) or "observe"
        target_msg = (body.message if body and body.message else message) or ""
        target_hist = (body.history if body and body.history else history) or []
        try:
            response_text = await chatbot_service.answer(target_wf, target_msg, target_hist)
            return {
                "workflow": target_wf,
                "response": response_text,
                "timestamp": datetime.now(UTC).isoformat()
            }
        except Exception as e:
            logger.error("Chatbot error: %s", e)
            fallback_text = await chatbot_service.fallback_answer(target_msg, target_wf)
            return {
                "workflow": target_wf,
                "response": fallback_text,
                "timestamp": datetime.now(UTC).isoformat()
            }

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

    @app.get("/v1/city-intelligence/context-from-heatmap/{activity_id}", response_model=CityContext)
    async def context_from_heatmap(
        activity_id: str,
        latitude: float = Query(ge=-90, le=90),
        longitude: float = Query(ge=-180, le=180),
    ) -> CityContext:
        heatmap = await city_service().status(activity_id)
        if heatmap.status != "completed" or heatmap.result is None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Heatmap is still processing")
        base = await city_context(latitude=latitude, longitude=longitude)
        return apply_heatmap_stats(base, heatmap.result.stats_data)

    @app.get("/v1/city-intelligence/hotspots/{activity_id}", response_model=HotspotAnalysis)
    async def hotspot_analysis(
        activity_id: str,
        latitude: float = Query(ge=-90, le=90),
        longitude: float = Query(ge=-180, le=180),
    ) -> HotspotAnalysis:
        heatmap = await city_service().status(activity_id)
        if heatmap.status != "completed" or heatmap.result is None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Heatmap is still processing")
        return hotspot_service.analyze(
            activity_id=activity_id,
            latitude=latitude,
            longitude=longitude,
            map_data=heatmap.result.map_data,
            stats_data=heatmap.result.stats_data,
        )

    @app.post("/v1/development-intelligence/simulate")
    async def simulate_development(
        proposal: DevelopmentProposal,
        latitude: float = Query(ge=-90, le=90),
        longitude: float = Query(ge=-180, le=180),
    ) -> object:
        return development_service.simulate(latitude, longitude, proposal)

    @app.post("/v1/mobility/optimize")
    async def optimize_route(request: RouteRequest) -> object:
        return mobility_service.optimize(request)

    @app.post("/v1/what-if")
    async def what_if(query: WhatIfQuery) -> object:
        try:
            return what_if_engine.resolve(query)
        except ValueError as error:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error

    return app


app = create_app(use_environment_provider=True)
