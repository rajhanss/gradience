from gradience_api.heatmap_mapper import apply_heatmap_stats
from gradience_city_domain import AreaOfInterest, CityContext, DataProvenance, GeoPoint, ObservationWindow


def _context() -> CityContext:
    from datetime import UTC, datetime, timedelta

    now = datetime.now(UTC)
    return CityContext(
        context_id="test",
        area=AreaOfInterest(centroid=GeoPoint(latitude=1, longitude=2)),
        observation=ObservationWindow(starts_at=now, ends_at=now + timedelta(hours=1), timezone="UTC"),
    )


def test_apply_heatmap_stats_ignores_missing_values() -> None:
    enriched = apply_heatmap_stats(_context(), {})
    assert enriched.thermal.surface_temperature is None


def test_apply_heatmap_stats_maps_nested_aliases() -> None:
    enriched = apply_heatmap_stats(_context(), {"summary": {"mean_temperature": 41.2}})
    metric = enriched.thermal.surface_temperature
    assert metric is not None
    assert metric.value == 41.2
    assert metric.provenance is DataProvenance.REAL
