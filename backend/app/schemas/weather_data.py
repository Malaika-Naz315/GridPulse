from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class WeatherDataCreate(BaseModel):
    timestamp: datetime
    temperature_c: float
    humidity_percent: float = Field(ge=0, le=100)
    wind_speed_kmh: float = Field(ge=0)
    weather_condition: str | None = None


class WeatherDataResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    temperature_c: float
    humidity_percent: float
    wind_speed_kmh: float
    weather_condition: str | None
    created_at: datetime