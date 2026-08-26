from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from gradience_city_domain import (
    AreaOfInterest,
    CityContext,
    DataProvenance,
    GeoPoint,
    MeasuredMetric,
    ObservationWindow,
)


def test_city_context_retains_model_metadata() -> None:
    context = CityContext(
        context_id="sample-zone",
        area=AreaOfInterest(centroid=GeoPoint(latitude=40.7128, longitude=-74.006)),
        observation=ObservationWindow(
            starts_at=datetime(2026, 8, 26, 12, tzinfo=UTC),
            ends_at=datetime(2026, 8, 26, 13, tzinfo=UTC),
            timezone="America/New_York",
        ),
    )

    assert context.area.centroid.longitude == -74.006


def test_modeled_metric_requires_method() -> None:
    with pytest.raises(ValidationError, match="modeled metrics require a method"):
        MeasuredMetric[float](
            value=1.2,
            unit="degC",
            provenance=DataProvenance.MODELED,
            source="baseline simulator",
        )


def test_unavailable_metric_cannot_masquerade_as_data() -> None:
    with pytest.raises(ValidationError, match="unavailable metrics cannot have a value"):
        MeasuredMetric[float](
            value=30.0,
            unit="degC",
            provenance=DataProvenance.UNAVAILABLE,
        )
