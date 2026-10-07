from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EnergyConsumptionCreate(BaseModel):
    timestamp: datetime
    consumption_kwh: float = Field(gt=0)


class EnergyConsumptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    consumption_kwh: float
    created_at: datetime