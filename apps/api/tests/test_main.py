from fastapi.testclient import TestClient

from gradience_api.main import create_app, provider_from_environment
from gradience_thermal_providers import MockThermalDataProvider


def test_city_context_never_fabricates_metrics() -> None:
    response = TestClient(create_app()).get("/v1/city-context?latitude=40.7128&longitude=-74.006")

    assert response.status_code == 200
    body = response.json()
    assert body["area"]["centroid"] == {"latitude": 40.7128, "longitude": -74.006}
    assert body["thermal"]["surface_temperature"] == {"value": None, "unit": None, "provenance": "unavailable", "source": None, "observed_at": None, "method": None, "uncertainty": None, "source_url": None}


def test_city_context_rejects_invalid_coordinates() -> None:
    response = TestClient(create_app()).get("/v1/city-context?latitude=91&longitude=0")
    assert response.status_code == 422


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


def test_provider_configuration_requires_runtime_secret(monkeypatch) -> None:
    monkeypatch.delenv("FORTYGUARD_API_KEY", raising=False)
    assert provider_from_environment() is None
