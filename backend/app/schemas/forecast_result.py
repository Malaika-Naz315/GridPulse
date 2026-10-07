from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ForecastResultCreate(BaseModel):
    forecast_timestamp: datetime
    predicted_consumption_kwh: float
    model_name: str
    model_version: str | None = None
    confidence_score: float | None = None


class ForecastResultResponse(BaseModel):
    id: int
    forecast_timestamp: datetime
    predicted_consumption_kwh: float
    model_name: str
    model_version: str | None
    confidence_score: float | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)