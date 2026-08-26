"""Universal City What-If contracts."""

from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field

from .models import GeoPoint


class WhatIfIntent(StrEnum):
    VEGETATION_CHANGE = "vegetation_change"
    DEVELOPMENT_IMPACT = "development_impact"
    ROUTE_OPTIMIZATION = "route_optimization"
    EVENT_TIMING = "event_timing"
    UNKNOWN = "unknown"


class WhatIfQuery(BaseModel):
    question: str = Field(min_length=3, max_length=500)
    location: GeoPoint | None = None
    parameters: dict[str, Any] = Field(default_factory=dict)


class WhatIfResult(BaseModel):
    intent: WhatIfIntent
    question: str
    method: str
    source: str
    summary: str
    payload: dict[str, Any] = Field(default_factory=dict)
