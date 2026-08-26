"""Transparent baseline urban impact simulator."""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

from gradience_city_domain import (
    AreaOfInterest,
    CityContext,
    DataProvenance,
    DevelopmentProposal,
    DevelopmentType,
    GeoPoint,
    LandCoverState,
    MeasuredMetric,
    ObservationWindow,
    ScenarioSnapshot,
    SimulationComparison,
    ThermalState,
)

METHOD = "gradience-baseline-v1: land-cover delta thermal response coefficients"
SOURCE = "GRADIENCE baseline simulator"

# Documented coefficients — not ML; deterministic and explainable.
VEGETATION_COOLING_PER_10PCT = 0.15  # °C cooling per +10% vegetation
BUILTUP_HEATING_PER_10PCT = 0.20  # °C warming per +10% built-up
TYPE_MULTIPLIERS: dict[DevelopmentType, float] = {
    DevelopmentType.RESIDENTIAL: 1.0,
    DevelopmentType.COMMERCIAL: 1.15,
    DevelopmentType.MIXED_USE: 1.05,
    DevelopmentType.INDUSTRIAL: 1.35,
    DevelopmentType.GREEN_INFRASTRUCTURE: 0.6,
}


def unavailable_metric() -> MeasuredMetric[float]:
    return MeasuredMetric[float](provenance=DataProvenance.UNAVAILABLE)


def _base_context(latitude: float, longitude: float) -> CityContext:
    now = datetime.now(UTC)
    return CityContext(
        context_id=f"sim:{latitude:.5f},{longitude:.5f}",
        area=AreaOfInterest(centroid=GeoPoint(latitude=latitude, longitude=longitude)),
        observation=ObservationWindow(starts_at=now, ends_at=now + timedelta(hours=1), timezone="UTC"),
        thermal=ThermalState(surface_temperature=unavailable_metric(), thermal_anomaly=unavailable_metric()),
        land_cover=LandCoverState(vegetation_cover=unavailable_metric(), built_up_cover=unavailable_metric()),
    )


def _delta_temperature(proposal: DevelopmentProposal, *, optimized: bool = False) -> float:
    changes = proposal.land_cover_changes
    veg_delta = changes.vegetation_change_pct
    built_delta = changes.built_up_change_pct
    if optimized:
        veg_delta = max(veg_delta, 0) + min(5.0, proposal.footprint_hectares * 0.5)
        built_delta = min(built_delta, 0)

    type_factor = TYPE_MULTIPLIERS[proposal.development_type]
    footprint_factor = min(2.0, 1.0 + proposal.footprint_hectares / 50.0)
    delta = (
        (-VEGETATION_COOLING_PER_10PCT * veg_delta / 10.0)
        + (BUILTUP_HEATING_PER_10PCT * built_delta / 10.0)
    ) * type_factor * footprint_factor
    return round(delta, 2)


def _modeled_delta_metric(delta: float) -> MeasuredMetric[float]:
    return MeasuredMetric[float](
        value=delta,
        unit="°C",
        provenance=DataProvenance.MODELED,
        source=SOURCE,
        observed_at=datetime.now(UTC),
        method=METHOD,
        uncertainty=0.35,
    )


class DevelopmentIntelligenceService:
    def simulate(self, latitude: float, longitude: float, proposal: DevelopmentProposal) -> SimulationComparison:
        current = ScenarioSnapshot(label="current", context=_base_context(latitude, longitude))
        proposed_delta = _delta_temperature(proposal)
        proposed = ScenarioSnapshot(
            label="proposed",
            context=_base_context(latitude, longitude),
            delta_surface_temperature=_modeled_delta_metric(proposed_delta),
        )
        optimized_delta = _delta_temperature(proposal, optimized=True)
        optimized = ScenarioSnapshot(
            label="optimized",
            context=_base_context(latitude, longitude),
            delta_surface_temperature=_modeled_delta_metric(optimized_delta),
        )
        return SimulationComparison(
            scenario_id=str(uuid4()),
            method=METHOD,
            source=SOURCE,
            current=current,
            proposed=proposed,
            optimized=optimized,
        )
