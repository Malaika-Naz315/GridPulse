from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RenewableEnergyCreate(BaseModel):
    timestamp: datetime

    solar_production_kwh: float = Field(ge=0)
    wind_generation_kwh: float = Field(ge=0)
    battery_storage_kwh: float = Field(ge=0)

    renewable_availability_percent: float = Field(
        ge=0,
        le=100,
    )

    energy_source: str


class RenewableEnergyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime

    solar_production_kwh: float
    wind_generation_kwh: float
    battery_storage_kwh: float

    renewable_availability_percent: float
    energy_source: str

    created_at: datetime
class RenewableEnergyAnalysisResponse(BaseModel):
    total_records: int

    total_solar_production_kwh: float
    total_wind_generation_kwh: float

    average_battery_storage_kwh: float
    average_renewable_availability_percent: float

    total_renewable_generation_kwh: float

    peak_solar_production_kwh: float
    peak_wind_generation_kwh: float

    daily_renewable_generation_kwh: dict[str, float]