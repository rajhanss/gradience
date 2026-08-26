"""Climate-aware route optimization using deterministic multi-objective scoring."""

from datetime import timedelta
from math import asin, cos, radians, sin, sqrt
from uuid import uuid4

from gradience_city_domain import (
    DataProvenance,
    GeoPoint,
    MeasuredMetric,
    MobilityMode,
    RouteOption,
    RouteOptimizationResult,
    RouteRequest,
    TimeWindowOption,
)

METHOD = "gradience-mobility-v1: haversine routing + weighted multi-objective scoring"
SOURCE = "GRADIENCE mobility engine"


def _haversine_km(a: GeoPoint, b: GeoPoint) -> float:
    lat1, lon1, lat2, lon2 = map(radians, [a.latitude, a.longitude, b.latitude, b.longitude])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 6371.0 * 2 * asin(sqrt(h))


def _interpolate(origin: GeoPoint, destination: GeoPoint, factor: float) -> GeoPoint:
    return GeoPoint(
        latitude=origin.latitude + (destination.latitude - origin.latitude) * factor,
        longitude=origin.longitude + (destination.longitude - origin.longitude) * factor,
    )


def _modeled_metric(value: float, *, unit: str) -> MeasuredMetric[float]:
    return MeasuredMetric[float](
        value=round(value, 3),
        unit=unit,
        provenance=DataProvenance.MODELED,
        source=SOURCE,
        method=METHOD,
        uncertainty=0.25,
    )


class MobilityOperationsService:
    """Graph-free MVP router: compares candidate paths without inventing observed temperatures."""

    MODE_SPEED_KMH: dict[MobilityMode, float] = {
        MobilityMode.PERSONAL_TRIP: 35.0,
        MobilityMode.OUTDOOR_EVENT: 5.0,
        MobilityMode.DELIVERY: 28.0,
    }

    def optimize(self, request: RouteRequest) -> RouteOptimizationResult:
        direct_km = _haversine_km(request.origin, request.destination)
        candidates = [
            ("direct", 1.0, 1.0, 1.0),
            ("shaded-corridor", 1.08, 1.05, 0.82),
            ("balanced", 1.04, 1.02, 0.9),
        ]
        options: list[RouteOption] = []
        speed = self.MODE_SPEED_KMH[request.mode]
        weights = request.priorities.normalized()

        for route_id, dist_factor, time_factor, exposure_factor in candidates:
            distance = direct_km * dist_factor
            travel_time = (distance / speed) * 60 * time_factor
            exposure = exposure_factor * (1.0 + request.depart_at.hour / 24.0)
            composite = (
                weights.distance * (distance / max(direct_km * 1.08, 0.001))
                + weights.travel_time * (travel_time / max((direct_km / speed) * 60 * 1.05, 0.001))
                + weights.thermal_exposure * exposure
            )
            options.append(
                RouteOption(
                    route_id=route_id,
                    label=route_id.replace("-", " ").title(),
                    distance_km=_modeled_metric(distance, unit="km"),
                    travel_time_minutes=_modeled_metric(travel_time, unit="min"),
                    thermal_exposure_score=_modeled_metric(exposure, unit="index"),
                    composite_score=_modeled_metric(composite, unit="score"),
                    waypoints=[
                        request.origin,
                        _interpolate(request.origin, request.destination, 0.33),
                        _interpolate(request.origin, request.destination, 0.66),
                        request.destination,
                    ],
                )
            )

        recommended = min(options, key=lambda option: option.composite_score.value or float("inf"))
        time_windows = self._time_windows(request)
        recommended_window = min(time_windows, key=lambda option: option.thermal_exposure_score.value or float("inf"))
        return RouteOptimizationResult(
            request_id=str(uuid4()),
            method=METHOD,
            source=SOURCE,
            recommended_route_id=recommended.route_id,
            options=options,
            time_windows=time_windows,
            recommended_depart_at=recommended_window.depart_at,
            operational_guidance=self._guidance(request),
        )

    def _time_windows(self, request: RouteRequest) -> list[TimeWindowOption]:
        windows: list[TimeWindowOption] = []
        for offset in (-2, -1, 0, 1):
            depart_at = request.depart_at + timedelta(hours=offset)
            exposure = 1.0 + depart_at.hour / 24.0
            verdict = "lower modeled exposure" if exposure <= 1.3 else "higher modeled exposure"
            windows.append(
                TimeWindowOption(
                    depart_at=depart_at,
                    thermal_exposure_score=_modeled_metric(exposure, unit="index"),
                    verdict=MeasuredMetric[str](
                        value=verdict,
                        provenance=DataProvenance.MODELED,
                        source=SOURCE,
                        method=METHOD,
                        uncertainty=0.25,
                    ),
                )
            )
        return windows

    def _guidance(self, request: RouteRequest) -> list[str]:
        if request.mode is MobilityMode.OUTDOOR_EVENT:
            return [
                "Schedule around the lowest modeled exposure window.",
                "Validate heat, air quality, hydration, and medical operations with real event-day data.",
            ]
        if request.mode is MobilityMode.DELIVERY:
            return [
                "Use the lowest modeled exposure window to reduce external thermal load.",
                "Vehicle cargo temperature is not calculated without a validated vehicle thermal model or sensor feed.",
            ]
        return [
            "Choose the recommended route and departure window according to your selected priorities.",
            "Route geometry and heat exposure are modeled until live routing and environmental layers are connected.",
        ]
