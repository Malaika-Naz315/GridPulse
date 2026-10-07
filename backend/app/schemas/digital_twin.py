from datetime import datetime

from pydantic import BaseModel, Field


class DigitalTwinInfrastructure(BaseModel):
    power_stations: int = 250
    solar_farms: int = 40
    wind_farms: int = 18
    battery_storage_facilities: int = 12
    smart_meters: int = 15_000_000


class DigitalTwinTelemetry(BaseModel):
    timestamp: datetime

    demand_kwh: float = Field(ge=0)

    solar_kwh: float = Field(ge=0)
    wind_kwh: float = Field(ge=0)
    renewable_generation_kwh: float = Field(ge=0)

    battery_storage_kwh: float = Field(ge=0)
    renewable_availability_percent: float = Field(
        ge=0,
        le=100,
    )


class DigitalTwinBalance(BaseModel):
    energy_gap_kwh: float = Field(ge=0)
    surplus_kwh: float = Field(ge=0)

    renewable_coverage_percent: float = Field(ge=0)

    grid_import_kwh: float = Field(ge=0)


class DigitalTwinStateResponse(BaseModel):
    twin_status: str
    simulation_mode: str

    timestamp: datetime

    infrastructure: DigitalTwinInfrastructure

    telemetry: DigitalTwinTelemetry

    balance: DigitalTwinBalance

    grid_status: str
    risk_level: str
    risk_score: float

    virtual_power_flow: list[str]

    source_data: dict


class DigitalTwinSimulationRequest(BaseModel):
    scenario: str = Field(
        default="normal",
        description=(
            "Simulation scenario: normal, peak_demand, "
            "renewable_drop, battery_stress, blackout"
        ),
    )


class DigitalTwinSimulationResponse(BaseModel):
    twin_status: str
    simulation_mode: str

    scenario: str
    timestamp: datetime

    baseline: DigitalTwinTelemetry
    simulated: DigitalTwinTelemetry

    balance: DigitalTwinBalance

    demand_stress_percent: float
    renewable_stress_percent: float

    risk_score: float
    risk_level: str
    grid_status: str

    recovery_strategy: str

    decision_trace: list[str]

    simulation_method: str