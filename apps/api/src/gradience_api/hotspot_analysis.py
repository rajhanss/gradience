"""Hotspot analysis derived from completed FortyGuard heatmap results."""

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field

from gradience_city_domain import DataProvenance, GeoPoint, MeasuredMetric

SOURCE = "FortyGuard"
METHOD = "gradience-hotspot-v1: tile lookup + stats-based risk scoring"


class RiskFactor(BaseModel):
    label: str
    detail: str
    contribution: MeasuredMetric[float] | None = None


class HotspotAnalysis(BaseModel):
    location: GeoPoint
    activity_id: str
    tile_temperature: MeasuredMetric[float] | None = None
    area_mean_temperature: MeasuredMetric[float] | None = None
    thermal_anomaly: MeasuredMetric[float] | None = None
    risk_score: MeasuredMetric[float] | None = None
    risk_level: MeasuredMetric[str] | None = None
    decomposition: list[RiskFactor] = Field(default_factory=list)
    explanation: str
    alerts: list[str] = Field(default_factory=list)
    historical_trend: MeasuredMetric[str] | None = None
    method: str = METHOD
    source: str = SOURCE


def _real_metric(value: float, *, unit: str) -> MeasuredMetric[float]:
    return MeasuredMetric[float](
        value=round(value, 2),
        unit=unit,
        provenance=DataProvenance.REAL,
        source=SOURCE,
        observed_at=datetime.now(UTC),
        method=METHOD,
    )


def _derived_metric(value: float, *, unit: str) -> MeasuredMetric[float]:
    return MeasuredMetric[float](
        value=round(value, 2),
        unit=unit,
        provenance=DataProvenance.DERIVED,
        source=SOURCE,
        observed_at=datetime.now(UTC),
        method=METHOD,
    )


def _derived_label(value: str) -> MeasuredMetric[str]:
    return MeasuredMetric[str](
        value=value,
        provenance=DataProvenance.DERIVED,
        source=SOURCE,
        observed_at=datetime.now(UTC),
        method=METHOD,
    )


def _find_numeric(stats: dict[str, Any], aliases: list[str]) -> float | None:
    for key in aliases:
        if key in stats and isinstance(stats[key], (int, float)):
            return float(stats[key])
    lowered = {str(k).lower(): v for k, v in stats.items()}
    for alias in aliases:
        if alias.lower() in lowered and isinstance(lowered[alias.lower()], (int, float)):
            return float(lowered[alias.lower()])
    for value in stats.values():
        if isinstance(value, dict):
            nested = _find_numeric(value, aliases)
            if nested is not None:
                return nested
    return None


def _extract_tile_temperature(properties: dict[str, Any] | None) -> float | None:
    if not properties:
        return None
    for key in ("temperature", "temp", "tcm", "value", "mean_temp", "surface_temperature", "Temperature"):
        candidate = properties.get(key)
        if isinstance(candidate, (int, float)):
            return float(candidate)
    for value in properties.values():
        if isinstance(value, (int, float)):
            return float(value)
    return None


def _point_in_ring(lng: float, lat: float, ring: list[list[float]]) -> bool:
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]
        xj, yj = ring[j]
        intersects = (yi > lat) != (yj > lat) and lng < ((xj - xi) * (lat - yi) / (yj - yi + 1e-12)) + xi
        if intersects:
            inside = not inside
        j = i
    return inside


def _find_tile_temperature(map_data: dict[str, Any], latitude: float, longitude: float) -> float | None:
    features = map_data.get("features")
    if not isinstance(features, list):
        return None
    for feature in features:
        if not isinstance(feature, dict):
            continue
        geometry = feature.get("geometry")
        if not isinstance(geometry, dict) or geometry.get("type") != "Polygon":
            continue
        coordinates = geometry.get("coordinates")
        if not isinstance(coordinates, list) or not coordinates:
            continue
        ring = coordinates[0]
        if not isinstance(ring, list):
            continue
        parsed_ring = [pair for pair in ring if isinstance(pair, list) and len(pair) >= 2]
        if _point_in_ring(longitude, latitude, parsed_ring):
            properties = feature.get("properties")
            return _extract_tile_temperature(properties if isinstance(properties, dict) else None)
    return None


def _risk_level(score: float) -> str:
    if score >= 75:
        return "high"
    if score >= 45:
        return "moderate"
    return "low"


class HotspotAnalysisService:
    """Explain why a location is hot using only provider-supplied heatmap data."""

    def analyze(
        self,
        *,
        activity_id: str,
        latitude: float,
        longitude: float,
        map_data: dict[str, Any],
        stats_data: dict[str, Any],
    ) -> HotspotAnalysis:
        location = GeoPoint(latitude=latitude, longitude=longitude)
        tile_temp = _find_tile_temperature(map_data, latitude, longitude)
        mean_temp = _find_numeric(
            stats_data,
            ["mean", "Mean", "mean_temp", "mean_temperature", "average", "Average"],
        )
        temp_stats = stats_data.get("Temperature_stats")
        if mean_temp is None and isinstance(temp_stats, dict):
            mean_temp = _find_numeric(temp_stats, ["Mean", "mean", "average"])
        std_temp = None
        min_temp = None
        max_temp = None
        if isinstance(temp_stats, dict):
            std_temp = _find_numeric(temp_stats, ["Standard_deviation", "standard_deviation", "std", "Std"])
            min_temp = _find_numeric(temp_stats, ["Minimum", "minimum", "min"])
            max_temp = _find_numeric(temp_stats, ["Maximum", "maximum", "max"])

        tile_metric = _real_metric(tile_temp, unit="°C") if tile_temp is not None else None
        mean_metric = _real_metric(mean_temp, unit="°C") if mean_temp is not None else None

        anomaly_value = None
        if tile_temp is not None and mean_temp is not None:
            anomaly_value = tile_temp - mean_temp
        anomaly_metric = _derived_metric(anomaly_value, unit="°C") if anomaly_value is not None else None

        risk_score_value = None
        if tile_temp is not None and mean_temp is not None and std_temp and std_temp > 0:
            z_score = (tile_temp - mean_temp) / std_temp
            risk_score_value = min(100.0, max(0.0, 50.0 + z_score * 20.0))
        elif tile_temp is not None and mean_temp is not None:
            span = max(abs(mean_temp) * 0.05, 0.5)
            risk_score_value = min(100.0, max(0.0, 50.0 + ((tile_temp - mean_temp) / span) * 15.0))

        risk_score_metric = _derived_metric(risk_score_value, unit="index") if risk_score_value is not None else None
        risk_level_metric = _derived_label(_risk_level(risk_score_value)) if risk_score_value is not None else None

        decomposition: list[RiskFactor] = []
        if anomaly_metric is not None:
            decomposition.append(
                RiskFactor(
                    label="Thermal anomaly vs AOI mean",
                    detail=f"Selected tile is {anomaly_metric.value:+.1f}°C relative to the AOI mean.",
                    contribution=anomaly_metric,
                )
            )
        if max_temp is not None and tile_temp is not None:
            span = max(max_temp - (min_temp or mean_temp or tile_temp), 0.1)
            percentile = min(100.0, max(0.0, ((tile_temp - (min_temp or tile_temp)) / span) * 100))
            decomposition.append(
                RiskFactor(
                    label="Position within AOI temperature range",
                    detail=f"Tile sits at approximately the {percentile:.0f}th percentile of observed AOI temperatures.",
                    contribution=_derived_metric(percentile, unit="%"),
                )
            )

        alerts: list[str] = []
        if anomaly_value is not None and std_temp and anomaly_value > std_temp * 2:
            alerts.append("Abnormal thermal anomaly: selected tile exceeds AOI mean by more than 2 standard deviations.")
        if risk_score_value is not None and risk_score_value >= 75:
            alerts.append("High heat-risk zone detected at the selected location.")

        explanation_parts: list[str] = []
        if tile_temp is None:
            explanation_parts.append(
                "No FortyGuard tile covers the selected point in this heatmap. Click inside the shaded AOI or request a new heatmap."
            )
        else:
            explanation_parts.append(f"The FortyGuard tile at the selected location measures {tile_temp:.1f}°C.")
            if mean_temp is not None:
                explanation_parts.append(f"The AOI mean temperature is {mean_temp:.1f}°C.")
            if anomaly_value is not None:
                direction = "hotter" if anomaly_value > 0 else "cooler"
                explanation_parts.append(f"This location is {abs(anomaly_value):.1f}°C {direction} than the AOI average.")
            if max_temp is not None and min_temp is not None:
                explanation_parts.append(f"Observed AOI range spans {min_temp:.1f}°C to {max_temp:.1f}°C.")

        historical = MeasuredMetric[str](
            provenance=DataProvenance.UNAVAILABLE,
        )

        return HotspotAnalysis(
            location=location,
            activity_id=activity_id,
            tile_temperature=tile_metric,
            area_mean_temperature=mean_metric,
            thermal_anomaly=anomaly_metric,
            risk_score=risk_score_metric,
            risk_level=risk_level_metric,
            decomposition=decomposition,
            explanation=" ".join(explanation_parts),
            alerts=alerts,
            historical_trend=historical,
            method=METHOD,
            source=SOURCE,
        )
