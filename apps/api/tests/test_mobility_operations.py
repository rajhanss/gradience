from datetime import UTC, datetime

import pytest

from gradience_api.mobility_operations import MobilityOperationsService
from gradience_city_domain import GeoPoint, MobilityMode, OptimizationPriority, RouteRequest
from pydantic import ValidationError


def test_mobility_prefers_low_exposure_when_weighted() -> None:
    service = MobilityOperationsService()
    request = RouteRequest(
        mode=MobilityMode.PERSONAL_TRIP,
        origin=GeoPoint(latitude=33.44, longitude=-112.07),
        destination=GeoPoint(latitude=33.50, longitude=-112.01),
        depart_at=datetime(2026, 8, 26, 14, 0, tzinfo=UTC),
        priorities=OptimizationPriority(distance=0.1, travel_time=0.1, thermal_exposure=0.8),
    )
    result = service.optimize(request)
    assert result.recommended_route_id == "shaded-corridor"
    assert len(result.time_windows) == 4
    assert result.recommended_depart_at is not None


def test_delivery_requires_a_cargo_temperature_limit() -> None:
    with pytest.raises(ValidationError, match="cargo_max_temperature_c"):
        RouteRequest(
            mode=MobilityMode.DELIVERY,
            origin=GeoPoint(latitude=33.44, longitude=-112.07),
            destination=GeoPoint(latitude=33.50, longitude=-112.01),
            depart_at=datetime(2026, 8, 26, 14, 0, tzinfo=UTC),
        )
