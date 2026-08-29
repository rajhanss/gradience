from datetime import UTC, datetime

import pytest

from gradience_api.development_intelligence import DevelopmentIntelligenceService, _delta_temperature, _optimized_delta
from gradience_city_domain import DevelopmentProposal, DevelopmentType, LandCoverChange, MitigationStrategy


def test_optimized_scenario_is_cooler_than_proposed() -> None:
    service = DevelopmentIntelligenceService()
    proposal = DevelopmentProposal(
        development_type=DevelopmentType.COMMERCIAL,
        footprint_hectares=10,
        land_cover_changes=LandCoverChange(vegetation_change_pct=-8, built_up_change_pct=12),
        mitigation_strategies=[MitigationStrategy.GREEN_CORRIDOR, MitigationStrategy.TREE_CANOPY],
    )
    comparison = service.simulate(33.44, -112.07, proposal)
    proposed = comparison.proposed.delta_surface_temperature
    optimized = comparison.optimized.delta_surface_temperature
    assert proposed is not None and optimized is not None
    assert optimized.value < proposed.value
    assert "Add a connected green corridor" in comparison.recommendations


def test_vegetation_gain_has_documented_baseline_cooling() -> None:
    proposal = DevelopmentProposal(
        development_type=DevelopmentType.GREEN_INFRASTRUCTURE,
        footprint_hectares=1,
        land_cover_changes=LandCoverChange(vegetation_change_pct=10),
    )
    assert _delta_temperature(proposal) == pytest.approx(-0.09)


def test_mitigation_cooling_stacks() -> None:
    assert _optimized_delta(1.5, [MitigationStrategy.TREE_CANOPY, MitigationStrategy.COOL_SURFACES]) == pytest.approx(1.07)
