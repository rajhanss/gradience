import requests
from typing import Any

from config import config


class FortyGuardClient:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or config.FORTYGUARD_API_KEY
        self.base_url = config.FORTYGUARD_BASE_URL
        self.headers = {"api-key": self.api_key}

    def fetch_heatmap(
        self,
        polygon_aoi: dict,
        date_time: dict,
        granularity: int,
    ) -> dict[str, Any]:
        """Submit a heatmap analysis to FortyGuard."""

        payload = {
            "polygon_aoi": polygon_aoi,
            "date_time": date_time,
            "granularity": granularity,
        }

        response = requests.post(
            f"{self.base_url}/heatmap",
            headers=self.headers,
            json=payload,
        )

        response.raise_for_status()
        return response.json()["data"]

    def fetch_env_params(
        self,
        lat: float,
        lon: float,
        date_time: dict,
        analysis: list[str] | None = None,
    ) -> dict[str, Any]:
        """Submit an environmental parameter analysis."""

        payload = {
            "latitude": lat,
            "longitude": lon,
            "temperature": 25.0,
            "date_time": date_time,
            "analysis": analysis or [
                "heat_index_celsius",
                "relative_humidity_percent",
                "solar_irradiance",
            ],
        }

        response = requests.post(
            f"{self.base_url}/env_params",
            headers=self.headers,
            json=payload,
        )

        response.raise_for_status()
        return response.json()["data"]

    def get_status(self, activity_id: str) -> dict[str, Any]:
        """Get the status of a FortyGuard analysis."""

        response = requests.get(
            f"{self.base_url}/status/{activity_id}",
            headers=self.headers,
        )

        response.raise_for_status()
        return response.json()["data"]