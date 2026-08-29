from datetime import UTC, datetime

from fastapi.testclient import TestClient

from gradience_api.main import create_app, provider_from_environment
from gradience_city_domain import DevelopmentProposal, DevelopmentType, GeoPoint, LandCoverChange, MobilityMode, RouteRequest, WhatIfQuery
from gradience_thermal_providers import HeatmapResult, MockThermalDataProvider


def test_city_context_never_fabricates_metrics() -> None:
    response = TestClient(create_app()).get("/v1/city-context?latitude=40.7128&longitude=-74.006")

    assert response.status_code == 200
    body = response.json()
    assert body["area"]["centroid"] == {"latitude": 40.7128, "longitude": -74.006}
    assert body["thermal"]["surface_temperature"] == {"value": None, "unit": None, "provenance": "unavailable", "source": None, "observed_at": None, "method": None, "uncertainty": None, "source_url": None}


def test_city_context_rejects_invalid_coordinates() -> None:
    response = TestClient(create_app()).get("/v1/city-context?latitude=91&longitude=0")
    assert response.status_code == 422


def test_health_returns_a_request_id() -> None:
    response = TestClient(create_app()).get("/health", headers={"x-request-id": "test-request"})
    assert response.headers["x-request-id"] == "test-request"


def test_system_status_reports_provider_configuration() -> None:
    response = TestClient(create_app()).get("/v1/system/status")
    assert response.status_code == 200
    body = response.json()
    assert body["api"] == "ok"
    assert body["thermal_provider_configured"] is False


def test_heatmap_workflow_uses_injected_provider() -> None:
    client = TestClient(create_app(MockThermalDataProvider()))
    request = {
        "polygon_aoi": {"type": "FeatureCollection", "features": []},
        "date_time": {"start_date": "2026-08-26", "start_time": "12:00", "filter_type": 1},
        "granularity": 100,
    }
    submitted = client.post("/v1/city-intelligence/heatmaps", json=request)
    assert submitted.status_code == 202
    assert submitted.json()["activity_id"] == "mock-activity"
    assert client.get("/v1/city-intelligence/heatmaps/mock-activity").json()["status"] == "processing"


def test_context_from_completed_heatmap_maps_real_stats() -> None:
    provider = MockThermalDataProvider(
        result=HeatmapResult(
            activity_id="mock-activity",
            map_data={},
            stats_data={"mean_temp": 38.4, "thermal_anomaly": 2.1},
        )
    )
    client = TestClient(create_app(provider))
    request = {
        "polygon_aoi": {"type": "FeatureCollection", "features": []},
        "date_time": {"start_date": "2026-08-26", "start_time": "12:00", "filter_type": 1},
        "granularity": 100,
    }
    client.post("/v1/city-intelligence/heatmaps", json=request)
    response = client.get("/v1/city-intelligence/context-from-heatmap/mock-activity?latitude=33.44&longitude=-112.07")
    assert response.status_code == 200
    body = response.json()
    assert body["thermal"]["surface_temperature"]["value"] == 38.4
    assert body["thermal"]["surface_temperature"]["provenance"] == "real"
    assert body["thermal"]["thermal_anomaly"]["provenance"] == "derived"


def test_heatmap_workflow_is_unavailable_without_a_provider() -> None:
    response = TestClient(create_app()).post(
        "/v1/city-intelligence/heatmaps",
        json={
            "polygon_aoi": {"type": "FeatureCollection", "features": []},
            "date_time": {"start_date": "2026-08-26", "start_time": "12:00", "filter_type": 1},
            "granularity": 100,
        },
    )
    assert response.status_code == 503


def test_development_simulation_returns_modeled_deltas() -> None:
    client = TestClient(create_app())
    proposal = DevelopmentProposal(
        development_type=DevelopmentType.MIXED_USE,
        footprint_hectares=5,
        land_cover_changes=LandCoverChange(vegetation_change_pct=-5, built_up_change_pct=8),
    )
    response = client.post(
        "/v1/development-intelligence/simulate?latitude=33.44&longitude=-112.07",
        json=proposal.model_dump(mode="json"),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["proposed"]["delta_surface_temperature"]["provenance"] == "modeled"
    assert body["optimized"]["delta_surface_temperature"]["method"]


def test_mobility_optimization_returns_ranked_routes() -> None:
    client = TestClient(create_app())
    request = RouteRequest(
        mode=MobilityMode.PERSONAL_TRIP,
        origin=GeoPoint(latitude=33.44, longitude=-112.07),
        destination=GeoPoint(latitude=33.50, longitude=-112.01),
        depart_at=datetime(2026, 8, 26, 8, 0, tzinfo=UTC),
    )
    response = client.post("/v1/mobility/optimize", json=request.model_dump(mode="json"))
    assert response.status_code == 200
    body = response.json()
    assert len(body["options"]) == 3
    assert body["recommended_route_id"] in {option["route_id"] for option in body["options"]}


def test_what_if_vegetation_question_is_classified() -> None:
    client = TestClient(create_app())
    query = WhatIfQuery(
        question="What happens if we remove 10% vegetation in this zone?",
        location=GeoPoint(latitude=33.44, longitude=-112.07),
    )
    response = client.post("/v1/what-if", json=query.model_dump(mode="json"))
    assert response.status_code == 200
    assert response.json()["intent"] == "vegetation_change"


def test_provider_configuration_requires_runtime_secret(monkeypatch) -> None:
    monkeypatch.delenv("FORTYGUARD_API_KEY", raising=False)
    assert provider_from_environment() is None
