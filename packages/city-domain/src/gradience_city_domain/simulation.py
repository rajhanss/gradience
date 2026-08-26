"""Development simulation contracts."""

from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field

from .models import CityContext, MeasuredMetric


class DevelopmentType(StrEnum):
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    MIXED_USE = "mixed_use"
    INDUSTRIAL = "industrial"
    GREEN_INFRASTRUCTURE = "green_infrastructure"


class MitigationStrategy(StrEnum):
    GREEN_CORRIDOR = "green_corridor"
    TREE_CANOPY = "tree_canopy"
    SHADE_STRUCTURES = "shade_structures"
    COOL_SURFACES = "cool_surfaces"
    BLUE_INFRASTRUCTURE = "blue_infrastructure"


class LandCoverChange(BaseModel):
    vegetation_change_pct: float = Field(default=0, ge=-100, le=100)
    built_up_change_pct: float = Field(default=0, ge=-100, le=100)


class DevelopmentProposal(BaseModel):
    development_type: DevelopmentType
    footprint_hectares: float = Field(gt=0, le=10000)
    land_cover_changes: LandCoverChange = Field(default_factory=LandCoverChange)
    mitigation_strategies: list[MitigationStrategy] = Field(default_factory=list, max_length=5)


class ScenarioSnapshot(BaseModel):
    label: Literal["current", "proposed", "optimized"]
    context: CityContext
    delta_surface_temperature: MeasuredMetric[float] | None = None


class SimulationComparison(BaseModel):
    scenario_id: str
    method: str
    source: str
    current: ScenarioSnapshot
    proposed: ScenarioSnapshot
    optimized: ScenarioSnapshot | None = None
    applied_mitigations: list[MitigationStrategy] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
