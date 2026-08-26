"""Map provider heatmap statistics into honest City Context metrics."""

from datetime import UTC, datetime
from typing import Any

from gradience_city_domain import CityContext, DataProvenance, MeasuredMetric, ThermalState

SOURCE = "FortyGuard"
METHOD = "FortyGuard heatmap stats aggregation"

STAT_ALIASES: dict[str, list[str]] = {
    "surface_temperature": [
        "surface_temperature",
        "mean_surface_temperature",
        "mean_temp",
        "mean_temperature",
        "avg_temp",
        "temperature_mean",
    ],
    "thermal_anomaly": ["thermal_anomaly", "anomaly", "mean_anomaly", "anomaly_mean"],
    "heat_risk": ["heat_risk", "risk_level", "risk_category"],
}


def _find_value(stats: dict[str, Any], aliases: list[str]) -> Any | None:
    for key in aliases:
        if key in stats:
            return stats[key]
    stats_lower = {str(k).lower(): v for k, v in stats.items()}
    for alias in aliases:
        if alias.lower() in stats_lower:
            return stats_lower[alias.lower()]
    for value in stats.values():
        if isinstance(value, dict):
            nested = _find_value(value, aliases)
            if nested is not None:
                return nested
    return None


def _real_metric(value: float, *, unit: str) -> MeasuredMetric[float]:
    return MeasuredMetric[float](
        value=value,
        unit=unit,
        provenance=DataProvenance.REAL,
        source=SOURCE,
        observed_at=datetime.now(UTC),
        method=METHOD,
    )


def _derived_metric(value: float, *, unit: str) -> MeasuredMetric[float]:
    return MeasuredMetric[float](
        value=value,
        unit=unit,
        provenance=DataProvenance.DERIVED,
        source=SOURCE,
        observed_at=datetime.now(UTC),
        method=METHOD,
    )


def apply_heatmap_stats(context: CityContext, stats_data: dict[str, Any]) -> CityContext:
    """Enrich thermal metrics only when the provider returned explicit values."""
    if not stats_data:
        return context

    thermal = context.thermal.model_copy(deep=True)
    surface = _find_value(stats_data, STAT_ALIASES["surface_temperature"])
    if isinstance(surface, (int, float)):
        thermal.surface_temperature = _real_metric(float(surface), unit="°C")

    anomaly = _find_value(stats_data, STAT_ALIASES["thermal_anomaly"])
    if isinstance(anomaly, (int, float)):
        thermal.thermal_anomaly = _derived_metric(float(anomaly), unit="°C")

    risk = _find_value(stats_data, STAT_ALIASES["heat_risk"])
    if isinstance(risk, str) and risk.strip():
        thermal.heat_risk = MeasuredMetric[str](
            value=risk.strip(),
            provenance=DataProvenance.DERIVED,
            source=SOURCE,
            observed_at=datetime.now(UTC),
            method=METHOD,
        )

    return context.model_copy(update={"thermal": thermal})
