from datetime import UTC, datetime

from gradience_api.development_intelligence import DevelopmentIntelligenceService
from gradience_city_domain import DevelopmentProposal, DevelopmentType, LandCoverChange


def test_optimized_scenario_is_cooler_than_proposed() -> None:
    service = DevelopmentIntelligenceService()
    proposal = DevelopmentProposal(
        development_type=DevelopmentType.COMMERCIAL,
        footprint_hectares=10,
        land_cover_changes=LandCoverChange(vegetation_change_pct=-8, built_up_change_pct=12),
    )
    comparison = service.simulate(33.44, -112.07, proposal)
    proposed = comparison.proposed.delta_surface_temperature
    optimized = comparison.optimized.delta_surface_temperature
    assert proposed is not None and optimized is not None
    assert optimized.value < proposed.value
