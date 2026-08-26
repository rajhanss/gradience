from datetime import date
from enum import StrEnum
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


class HeatmapTimeFilter(BaseModel):
    start_date: date
    filter_type: Literal[1, 2, 3, 4]
    start_time: str | None = None
    end_time: str | None = None
    end_date: date | None = None

    @model_validator(mode="after")
    def validate_required_times(self) -> "HeatmapTimeFilter":
        if self.filter_type in (1, 2) and not self.start_time:
            raise ValueError("single-hour and range-hour filters require start_time")
        if self.filter_type == 2 and not self.end_time:
            raise ValueError("range-hour filters require end_time")
        if self.filter_type == 4 and not self.end_date:
            raise ValueError("range-day filters require end_date")
        return self


class HeatmapRequest(BaseModel):
    polygon_aoi: dict[str, Any]
    date_time: HeatmapTimeFilter
    granularity: Literal[60, 80, 100]
    analytic_type: Literal["tcm", "time_of_measure", "exceedance", "persistence"] = "tcm"
    threshold: float | None = None
    direction: Literal["above", "below"] | None = None

    @model_validator(mode="after")
    def validate_geojson_and_analysis(self) -> "HeatmapRequest":
        if self.polygon_aoi.get("type") != "FeatureCollection":
            raise ValueError("polygon_aoi must be a GeoJSON FeatureCollection")
        if self.analytic_type in {"exceedance", "persistence"} and self.threshold is None:
            raise ValueError("threshold is required for exceedance and persistence")
        return self


class ThermalTaskStatus(StrEnum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ThermalTask(BaseModel):
    activity_id: str = Field(min_length=1)
    status: ThermalTaskStatus = ThermalTaskStatus.PROCESSING


class HeatmapResult(BaseModel):
    activity_id: str
    map_data: dict[str, Any]
    stats_data: dict[str, Any]
