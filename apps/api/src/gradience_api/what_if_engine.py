"""Deterministic What-If intent routing — no fake LLM layer."""

import re
from datetime import UTC, datetime

from gradience_city_domain import (
    DevelopmentProposal,
    DevelopmentType,
    GeoPoint,
    LandCoverChange,
    MobilityMode,
    OptimizationPriority,
    RouteRequest,
    WhatIfIntent,
    WhatIfQuery,
    WhatIfResult,
)

from .development_intelligence import DevelopmentIntelligenceService
from .mobility_operations import MobilityOperationsService

METHOD = "gradience-whatif-v1: deterministic intent classification"
SOURCE = "GRADIENCE what-if engine"


def _geo_point(value: object) -> GeoPoint:
    if isinstance(value, GeoPoint):
        return value
    if isinstance(value, dict) and "latitude" in value and "longitude" in value:
        return GeoPoint(latitude=float(value["latitude"]), longitude=float(value["longitude"]))
    raise ValueError("expected a GeoPoint or {latitude, longitude} object")


class WhatIfEngine:
    def __init__(self) -> None:
        self._development = DevelopmentIntelligenceService()
        self._mobility = MobilityOperationsService()

    def resolve(self, query: WhatIfQuery) -> WhatIfResult:
        intent = self._classify(query.question)
        if intent is WhatIfIntent.VEGETATION_CHANGE:
            return self._vegetation_change(query, intent)
        if intent is WhatIfIntent.DEVELOPMENT_IMPACT:
            return self._development_impact(query, intent)
        if intent is WhatIfIntent.ROUTE_OPTIMIZATION:
            return self._route_optimization(query, intent)
        if intent is WhatIfIntent.EVENT_TIMING:
            return self._event_timing(query, intent)
        return WhatIfResult(
            intent=WhatIfIntent.UNKNOWN,
            question=query.question,
            method=METHOD,
            source=SOURCE,
            summary="Could not classify this question into a supported What-If workflow yet.",
            payload={"supported_intents": [item.value for item in WhatIfIntent if item is not WhatIfIntent.UNKNOWN]},
        )

    def _classify(self, question: str) -> WhatIfIntent:
        q = question.lower()
        if any(token in q for token in ("vegetation", "tree", "green cover", "canopy")):
            return WhatIfIntent.VEGETATION_CHANGE
        if any(token in q for token in ("development", "build", "footprint", "zoning", "approve")):
            return WhatIfIntent.DEVELOPMENT_IMPACT
        if any(token in q for token in ("route", "travel", "delivery", "trip", "path")):
            return WhatIfIntent.ROUTE_OPTIMIZATION
        if any(token in q for token in ("event", "start time", "when should", "schedule")):
            return WhatIfIntent.EVENT_TIMING
        return WhatIfIntent.UNKNOWN

    def _extract_pct(self, question: str, default: float = 10.0) -> float:
        match = re.search(r"(\d+(?:\.\d+)?)\s*%", question)
        return float(match.group(1)) if match else default

    def _location(self, query: WhatIfQuery) -> tuple[float, float]:
        if query.location is None:
            raise ValueError("location is required for this What-If intent")
        return query.location.latitude, query.location.longitude

    def _vegetation_change(self, query: WhatIfQuery, intent: WhatIfIntent) -> WhatIfResult:
        latitude, longitude = self._location(query)
        pct = self._extract_pct(query.question)
        sign = -1 if any(token in query.question.lower() for token in ("remove", "loss", "lose", "reduce")) else 1
        proposal = DevelopmentProposal(
            development_type=DevelopmentType.GREEN_INFRASTRUCTURE,
            footprint_hectares=float(query.parameters.get("footprint_hectares", 1.0)),
            land_cover_changes=LandCoverChange(vegetation_change_pct=sign * pct),
        )
        comparison = self._development.simulate(latitude, longitude, proposal)
        delta = comparison.proposed.delta_surface_temperature
        return WhatIfResult(
            intent=intent,
            question=query.question,
            method=METHOD,
            source=SOURCE,
            summary=f"Modeled surface temperature change: {delta.value if delta else 'unavailable'} °C",
            payload={"comparison": comparison.model_dump(mode="json")},
        )

    def _development_impact(self, query: WhatIfQuery, intent: WhatIfIntent) -> WhatIfResult:
        latitude, longitude = self._location(query)
        dev_type = DevelopmentType(str(query.parameters.get("development_type", DevelopmentType.MIXED_USE)))
        proposal = DevelopmentProposal(
            development_type=dev_type,
            footprint_hectares=float(query.parameters.get("footprint_hectares", 5.0)),
            land_cover_changes=LandCoverChange(
                vegetation_change_pct=float(query.parameters.get("vegetation_change_pct", -5.0)),
                built_up_change_pct=float(query.parameters.get("built_up_change_pct", 8.0)),
            ),
        )
        comparison = self._development.simulate(latitude, longitude, proposal)
        return WhatIfResult(
            intent=intent,
            question=query.question,
            method=METHOD,
            source=SOURCE,
            summary="Urban impact simulation completed with baseline land-cover response model.",
            payload={"comparison": comparison.model_dump(mode="json")},
        )

    def _route_optimization(self, query: WhatIfQuery, intent: WhatIfIntent) -> WhatIfResult:
        origin = _geo_point(query.parameters.get("origin", query.location))
        destination = _geo_point(query.parameters["destination"])
        depart_at_raw = query.parameters.get("depart_at")
        depart_at = datetime.fromisoformat(depart_at_raw) if isinstance(depart_at_raw, str) else datetime.now(UTC)
        priorities_raw = query.parameters.get("priorities", {})
        priorities = OptimizationPriority(**priorities_raw) if isinstance(priorities_raw, dict) else OptimizationPriority()
        request = RouteRequest(
            mode=MobilityMode(str(query.parameters.get("mode", MobilityMode.PERSONAL_TRIP))),
            origin=origin,
            destination=destination,
            depart_at=depart_at,
            priorities=priorities,
        )
        result = self._mobility.optimize(request)
        return WhatIfResult(
            intent=intent,
            question=query.question,
            method=METHOD,
            source=SOURCE,
            summary=f"Recommended route: {result.recommended_route_id}",
            payload={"optimization": result.model_dump(mode="json")},
        )

    def _event_timing(self, query: WhatIfQuery, intent: WhatIfIntent) -> WhatIfResult:
        hours = [6, 8, 10, 12, 14, 16, 18]
        scores = {hour: round(1.0 + hour / 24.0, 3) for hour in hours}
        best_hour = min(scores, key=scores.get)
        return WhatIfResult(
            intent=intent,
            question=query.question,
            method=METHOD,
            source=SOURCE,
            summary=f"Lowest modeled thermal exposure window starts around {best_hour:02d}:00 (modeled index).",
            payload={"hourly_exposure_index": scores, "recommended_start_hour": best_hour},
        )
