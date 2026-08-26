from gradience_api.hotspot_analysis import HotspotAnalysisService

SAMPLE_MAP = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {"temperature": 42.5},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[-112.1, 33.4], [-112.0, 33.4], [-112.0, 33.5], [-112.1, 33.5], [-112.1, 33.4]]],
            },
        }
    ],
}

SAMPLE_STATS = {
    "Temperature_stats": {
        "Minimum": 34.0,
        "Maximum": 44.0,
        "Mean": 39.0,
        "Standard_deviation": 2.5,
    }
}


def test_hotspot_analysis_finds_tile_and_scores_risk() -> None:
    service = HotspotAnalysisService()
    result = service.analyze(
        activity_id="abc",
        latitude=33.45,
        longitude=-112.05,
        map_data=SAMPLE_MAP,
        stats_data=SAMPLE_STATS,
    )
    assert result.tile_temperature is not None
    assert result.tile_temperature.value == 42.5
    assert result.tile_temperature.provenance == "real"
    assert result.thermal_anomaly is not None
    assert result.thermal_anomaly.value == 3.5
    assert result.risk_level is not None
    assert result.risk_level.value in {"moderate", "high"}
    assert result.alerts
    assert "FortyGuard tile" in result.explanation


def test_hotspot_analysis_without_tile_is_honest() -> None:
    service = HotspotAnalysisService()
    result = service.analyze(
        activity_id="abc",
        latitude=10.0,
        longitude=10.0,
        map_data=SAMPLE_MAP,
        stats_data=SAMPLE_STATS,
    )
    assert result.tile_temperature is None
    assert "No FortyGuard tile covers" in result.explanation
    assert result.historical_trend is not None
    assert result.historical_trend.provenance == "unavailable"
