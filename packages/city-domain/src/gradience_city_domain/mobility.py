"""Climate-aware mobility and operations contracts."""

from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field

from .models import GeoPoint, MeasuredMetric


class MobilityMode(StrEnum):
    PERSONAL_TRIP = "personal_trip"
    OUTDOOR_EVENT = "outdoor_event"
    DELIVERY = "delivery"


class OptimizationPriority(BaseModel):
    distance: float = Field(default=0.33, ge=0, le=1)
    travel_time: float = Field(default=0.33, ge=0, le=1)
    thermal_exposure: float = Field(default=0.34, ge=0, le=1)

    def normalized(self) -> "OptimizationPriority":
        total = self.distance + self.travel_time + self.thermal_exposure
        if total <= 0:
            return OptimizationPriority(distance=1 / 3, travel_time=1 / 3, thermal_exposure=1 / 3)
        return OptimizationPriority(
            distance=self.distance / total,
            travel_time=self.travel_time / total,
            thermal_exposure=self.thermal_exposure / total,
        )


class RouteRequest(BaseModel):
    mode: MobilityMode
    origin: GeoPoint
    destination: GeoPoint
    depart_at: datetime
    priorities: OptimizationPriority = Field(default_factory=OptimizationPriority)


class RouteOption(BaseModel):
    route_id: str
    label: str
    distance_km: MeasuredMetric[float]
    travel_time_minutes: MeasuredMetric[float]
    thermal_exposure_score: MeasuredMetric[float]
    composite_score: MeasuredMetric[float]
    waypoints: list[GeoPoint]


class RouteOptimizationResult(BaseModel):
    request_id: str
    method: str
    source: str
    recommended_route_id: str
    options: list[RouteOption]
