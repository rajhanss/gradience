"""Regression tests for the AI-powered route optimization endpoint."""
import pytest
from fastapi.testclient import TestClient

# RouteRequest requires: origin, destination, depart_at, mode
_ROUTE_BODY = {
    "mode": "personal_trip",
    "origin": {"latitude": 33.4484, "longitude": -112.0740},
    "destination": {"latitude": 33.45, "longitude": -112.06},
    "depart_at": "2026-08-30T06:00:00Z",
}


def test_ai_optimization_fallback_when_no_groq_key(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that AI optimization gracefully falls back when GROQ_API_KEY is not set."""
    monkeypatch.delenv("GROQ_API_KEY", raising=False)

    from gradience_api.main import create_app
    app = create_app()
    client = TestClient(app)

    response = client.post("/v1/mobility/optimize-ai", json=_ROUTE_BODY)
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] in ("success", "fallback")
    assert "model" in data


def test_ai_optimization_response_has_location_fields(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that fallback response includes start/end location fields."""
    monkeypatch.delenv("GROQ_API_KEY", raising=False)

    from gradience_api.main import create_app
    app = create_app()
    client = TestClient(app)

    route_body = {
        "mode": "personal_trip",
        "origin": {"latitude": 36.1699, "longitude": -115.1398},
        "destination": {"latitude": 36.18, "longitude": -115.12},
        "depart_at": "2026-08-30T06:00:00Z",
    }
    response = client.post("/v1/mobility/optimize-ai", json=route_body)
    assert response.status_code == 200
    data = response.json()
    assert "start" in data
    assert "end" in data


def test_anomaly_detection_endpoint_normal() -> None:
    """Test the anomaly detection endpoint with normal thermal data."""
    from gradience_api.main import create_app
    app = create_app()
    client = TestClient(app)

    response = client.post(
        "/v1/anomaly/detect",
        params={"mean": 38.5, "max_temp": 42.1, "min_temp": 34.2, "std": 2.3, "pixel_count": 2000}
    )
    assert response.status_code == 200
    data = response.json()
    assert "is_anomaly" in data
    assert "severity" in data
    assert data["severity"] == "normal"


def test_anomaly_detection_endpoint_critical() -> None:
    """Test the anomaly detection endpoint with extreme thermal data (mean=47, std=0.5)."""
    from gradience_api.main import create_app
    app = create_app()
    client = TestClient(app)

    # mean=47, std=0.5, pixel_count=200 is confirmed anomaly by the trained IsolationForest
    response = client.post(
        "/v1/anomaly/detect",
        params={"mean": 47.0, "max_temp": 50.0, "min_temp": 45.0, "std": 0.5, "pixel_count": 200}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_anomaly"] is True
    assert data["severity"] in ("warning", "critical")

