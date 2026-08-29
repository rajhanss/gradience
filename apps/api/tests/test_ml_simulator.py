import pytest
from gradience_api.ml_simulator import MLThermalSimulator


def test_ml_simulator_positive_development() -> None:
    """Test that positive development impact (warming) is predicted correctly."""
    simulator = MLThermalSimulator()
    result = simulator.predict_delta(
        veg_change_pct=-10,       # Lost vegetation = warming
        built_change_pct=20,      # Added built-up = warming
        footprint_hectares=5,     # Small development
        dev_type_multiplier=1.15  # Commercial
    )
    assert result["delta_temperature"] > 0, "Commercial dev with veg loss should predict warming"
    assert result["unit"] == "°C"
    assert 0.0 <= result["uncertainty"] <= 1.0
    assert 0.0 <= result["confidence"] <= 1.0
    assert "LinearRegression" in result["model"]


def test_ml_simulator_negative_development() -> None:
    """Test that green development shows cooling (negative delta)."""
    simulator = MLThermalSimulator()
    result = simulator.predict_delta(
        veg_change_pct=30,        # Added vegetation = cooling
        built_change_pct=0,       # No additional built-up
        footprint_hectares=2,     # Small green infrastructure
        dev_type_multiplier=0.6   # Green infrastructure type
    )
    assert result["delta_temperature"] < 0, "Green infrastructure with veg gain should predict cooling"
    assert "model" in result
    assert "LinearRegression" in result["model"]


def test_ml_simulator_uncertainty_increases_with_extremes() -> None:
    """Test that uncertainty is higher for extreme inputs."""
    simulator = MLThermalSimulator()
    moderate = simulator.predict_delta(
        veg_change_pct=-5,
        built_change_pct=10,
        footprint_hectares=5,
        dev_type_multiplier=1.0
    )
    extreme = simulator.predict_delta(
        veg_change_pct=-90,
        built_change_pct=80,
        footprint_hectares=45,
        dev_type_multiplier=1.35
    )
    assert extreme["uncertainty"] >= moderate["uncertainty"], "Extreme inputs should have higher uncertainty"


def test_ml_simulator_returns_required_fields() -> None:
    """Test that all required fields are present in the response."""
    simulator = MLThermalSimulator()
    result = simulator.predict_delta(
        veg_change_pct=0,
        built_change_pct=0,
        footprint_hectares=10,
        dev_type_multiplier=1.0
    )
    for field in ("delta_temperature", "unit", "model", "uncertainty", "confidence", "observed_at", "method"):
        assert field in result, f"Missing required field: {field}"
    assert result["method"] == "ml-simulator-v1"
