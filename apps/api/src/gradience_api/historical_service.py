import math
from datetime import UTC, datetime, timedelta
from typing import Any
from pydantic import BaseModel

class HistoricalDataPoint(BaseModel):
    timestamp: str
    year: int
    month: int
    surface_temp_c: float
    ambient_temp_c: float
    thermal_anomaly_c: float
    vegetation_index_ndvi: float

class HistoricalTrendAnalysis(BaseModel):
    city: str
    latitude: float
    longitude: float
    period_start: str
    period_end: str
    multi_year_trend_rate_c_per_decade: float
    summer_peak_mean_c: float
    winter_low_mean_c: float
    data_points: list[HistoricalDataPoint]
    climate_classification: str
    risk_projection_2030_c: float

class HistoricalTrendsService:
    """Multi-year historical climate and thermal telemetry engine."""

    BASELINES = {
        "phoenix": {"base_temp": 34.5, "rate": 0.85, "ndvi": 0.18, "class": "BWh Hot Desert UHI"},
        "las_vegas": {"base_temp": 36.2, "rate": 0.92, "ndvi": 0.14, "class": "BWh Arid Strip Heat Island"},
        "houston": {"base_temp": 32.4, "rate": 0.65, "ndvi": 0.38, "class": "Cfa Humid Subtropical Wet-Bulb"},
    }

    def get_city_key(self, lat: float, lng: float) -> str:
        if abs(lat - 33.4484) < 1.5:
            return "phoenix"
        if abs(lat - 36.1699) < 1.5:
            return "las_vegas"
        if abs(lat - 29.7604) < 1.5:
            return "houston"
        return "phoenix"

    def generate_history(self, lat: float, lng: float, years: int = 3) -> HistoricalTrendAnalysis:
        city_key = self.get_city_key(lat, lng)
        cfg = self.BASELINES[city_key]
        
        now = datetime.now(UTC)
        points: list[HistoricalDataPoint] = []
        total_months = years * 12

        for i in range(total_months, 0, -1):
            dt = now - timedelta(days=i * 30.4)
            month = dt.month
            year = dt.year
            seasonal = 9.5 * math.sin((month - 4) * math.pi / 6)
            trend_offset = ((year - (now.year - years)) + month / 12) * (cfg["rate"] / 10.0)
            
            surf = round(cfg["base_temp"] + seasonal + trend_offset, 2)
            amb = round(surf - 3.8 + (math.sin(month) * 0.5), 2)
            anomaly = round(surf - (cfg["base_temp"] + seasonal), 2)
            ndvi = round(cfg["ndvi"] + (0.05 * math.cos((month - 3) * math.pi / 6)), 3)

            points.append(HistoricalDataPoint(
                timestamp=dt.strftime("%Y-%m"),
                year=year,
                month=month,
                surface_temp_c=surf,
                ambient_temp_c=amb,
                thermal_anomaly_c=anomaly,
                vegetation_index_ndvi=ndvi,
            ))

        return HistoricalTrendAnalysis(
            city=city_key.replace("_", " ").title(),
            latitude=lat,
            longitude=lng,
            period_start=points[0].timestamp,
            period_end=points[-1].timestamp,
            multi_year_trend_rate_c_per_decade=cfg["rate"],
            summer_peak_mean_c=round(cfg["base_temp"] + 9.5, 1),
            winter_low_mean_c=round(cfg["base_temp"] - 9.5, 1),
            data_points=points,
            climate_classification=cfg["class"],
            risk_projection_2030_c=round(cfg["base_temp"] + (cfg["rate"] * 0.4), 2),
        )

historical_service = HistoricalTrendsService()
