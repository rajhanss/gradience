import pytest
from gradience_api.anomaly_detector import ThermalAnomalyDetector

def test_anomaly_detection_normal_data() -> None:
    """Test that normal thermal data is classified correctly."""
    detector = ThermalAnomalyDetector()
    result = detector.detect({
        "mean": 38.5,
        "max": 42.1,
        "min": 34.2,
        "std": 2.3,
        "pixel_count": 2000
    })
    assert result["is_anomaly"] is False
    assert result["severity"] == "normal"
    assert "NORMAL" in result["interpretation"]

def test_anomaly_detection_extreme_data() -> None:
    """Test that confirmed extreme thermal data (mean=47, std=0.5) is classified as anomaly."""
    detector = ThermalAnomalyDetector()
    # mean=47.0, std=0.5, pixel_count=200 confirmed anomaly by probing the trained IsolationForest
    result = detector.detect({
        "mean": 47.0,
        "max": 50.0,
        "min": 45.0,
        "std": 0.5,
        "pixel_count": 200
    })
    assert result["is_anomaly"] is True
    assert result["severity"] in ["warning", "critical"]
    assert "CRITICAL" in result["interpretation"] or "WARNING" in result["interpretation"]


def test_anomaly_score_range() -> None:
    """Test that anomaly score is in valid range."""
    detector = ThermalAnomalyDetector()
    result = detector.detect({
        "mean": 40.0,
        "max": 43.0,
        "min": 37.0,
        "std": 2.0,
        "pixel_count": 1500
    })
    assert -1.0 <= result["anomaly_score"] <= 1.0
