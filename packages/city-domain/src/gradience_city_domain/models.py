"""Shared, provider-neutral City Context contracts.

These models deliberately retain provenance and method metadata so that an API
consumer can distinguish observed data from derived, modeled, demo, or missing
values.
"""

from datetime import datetime
from enum import StrEnum
from typing import Annotated, Any, Generic, TypeVar

from pydantic import BaseModel, Field, HttpUrl, model_validator


class DataProvenance(StrEnum):
    """The origin classification required for every metric."""

    REAL = "real"
    DERIVED = "derived"
    MODELED = "modeled"
    SYNTHETIC = "synthetic"
    UNAVAILABLE = "unavailable"


class GeoPoint(BaseModel):
    """A WGS84 point expressed in conventional latitude/longitude order."""

    latitude: Annotated[float, Field(ge=-90, le=90)]
    longitude: Annotated[float, Field(ge=-180, le=180)]


class AreaOfInterest(BaseModel):
    """The selected location or GeoJSON area used to derive a City Context."""

    name: str | None = Field(default=None, min_length=1, max_length=200)
    centroid: GeoPoint
    geojson: dict[str, Any] | None = None


class ObservationWindow(BaseModel):
    """Time bounds and timezone for the context being represented."""

    starts_at: datetime
    ends_at: datetime
    timezone: str = Field(min_length=1, max_length=100)

    @model_validator(mode="after")
    def has_ordered_bounds(self) -> "ObservationWindow":
        if self.ends_at < self.starts_at:
            raise ValueError("ends_at must be at or after starts_at")
        return self


MetricValue = TypeVar("MetricValue", int, float, str, bool)


class MeasuredMetric(BaseModel, Generic[MetricValue]):
    """A single explainable metric, with provenance preserved at the value."""

    value: MetricValue | None = None
    unit: str | None = Field(default=None, max_length=50)
    provenance: DataProvenance
    source: str | None = Field(default=None, max_length=200)
    observed_at: datetime | None = None
    method: str | None = Field(default=None, max_length=500)
    uncertainty: Annotated[float | None, Field(ge=0, le=1)] = None
    source_url: HttpUrl | None = None

    @model_validator(mode="after")
    def is_honestly_described(self) -> "MeasuredMetric[MetricValue]":
        if self.provenance is DataProvenance.UNAVAILABLE:
            if self.value is not None:
                raise ValueError("unavailable metrics cannot have a value")
            return self

        if self.value is None:
            raise ValueError("available metrics require a value")
        if not self.source:
            raise ValueError("available metrics require a source")
        if self.provenance is DataProvenance.MODELED and not self.method:
            raise ValueError("modeled metrics require a method")
        return self


class ThermalState(BaseModel):
    surface_temperature: MeasuredMetric[float] | None = None
    thermal_anomaly: MeasuredMetric[float] | None = None
    heat_risk: MeasuredMetric[str] | None = None


class EnvironmentalState(BaseModel):
    aqi: MeasuredMetric[float] | None = None


class LandCoverState(BaseModel):
    vegetation_cover: MeasuredMetric[float] | None = None
    built_up_cover: MeasuredMetric[float] | None = None
    shade_cover: MeasuredMetric[float] | None = None


class ExposureState(BaseModel):
    population_exposed: MeasuredMetric[int] | None = None


class InfrastructureState(BaseModel):
    summary: MeasuredMetric[str] | None = None


class CityContext(BaseModel):
    """The shared intelligence contract consumed by every GRADIENCE interface."""

    context_id: str = Field(min_length=1, max_length=100)
    area: AreaOfInterest
    observation: ObservationWindow
    thermal: ThermalState = Field(default_factory=ThermalState)
    environmental: EnvironmentalState = Field(default_factory=EnvironmentalState)
    land_cover: LandCoverState = Field(default_factory=LandCoverState)
    exposure: ExposureState = Field(default_factory=ExposureState)
    infrastructure: InfrastructureState = Field(default_factory=InfrastructureState)
