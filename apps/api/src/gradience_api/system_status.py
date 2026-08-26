from datetime import UTC, datetime

from pydantic import BaseModel


class SystemStatus(BaseModel):
    api: str
    thermal_provider_configured: bool
    timestamp: datetime
    version: str = "0.1.0"

    @classmethod
    def current(cls, *, thermal_provider_configured: bool) -> "SystemStatus":
        return cls(
            api="ok",
            thermal_provider_configured=thermal_provider_configured,
            timestamp=datetime.now(UTC),
        )
