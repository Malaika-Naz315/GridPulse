from datetime import datetime

from pydantic import BaseModel, Field


class CarbonIntelligenceSummaryResponse(BaseModel):
    total_energy_demand_kwh: float
    total_solar_generation_kwh: float
    total_wind_generation_kwh: float
    total_renewable_generation_kwh: float

    renewable_contribution_percent: float = Field(
        ge=0
    )

    baseline_co2_kg: float
    estimated_grid_co2_kg: float
    estimated_co2_avoided_kg: float

    carbon_reduction_percent: float = Field(
        ge=0
    )

    energy_efficiency_score: float = Field(
        ge=0,
        le=100,
    )

    sustainability_score: float = Field(
        ge=0,
        le=100,
    )

    carbon_intensity_kg_per_kwh: float = Field(
        ge=0
    )

    energy_records: int = Field(
        ge=0
    )

    renewable_records: int = Field(
        ge=0
    )

    generated_at: datetime


class CarbonTrendItem(BaseModel):
    date: str

    energy_demand_kwh: float
    solar_generation_kwh: float
    wind_generation_kwh: float
    renewable_generation_kwh: float

    baseline_co2_kg: float
    estimated_co2_kg: float
    co2_avoided_kg: float

    carbon_reduction_percent: float
    renewable_contribution_percent: float


class SustainabilityAnalysisResponse(BaseModel):
    sustainability_score: float = Field(
        ge=0,
        le=100,
    )

    sustainability_status: str

    renewable_contribution_percent: float
    carbon_reduction_percent: float

    energy_efficiency_score: float = Field(
        ge=0,
        le=100,
    )

    estimated_co2_avoided_kg: float

    recommendations: list[str]

    analysis_method: str

    generated_at: datetime


class CarbonPerformance(BaseModel):
    baseline_co2_kg: float
    estimated_grid_co2_kg: float
    estimated_co2_avoided_kg: float

    carbon_reduction_percent: float

    carbon_intensity_kg_per_kwh: float


class RenewablePerformance(BaseModel):
    solar_generation_kwh: float
    wind_generation_kwh: float
    total_renewable_generation_kwh: float

    renewable_contribution_percent: float

    average_battery_storage_kwh: float


class EfficiencyPerformance(BaseModel):
    energy_efficiency_score: float
    sustainability_score: float

    sustainability_status: str


class ReportingRecords(BaseModel):
    energy_records: int
    renewable_records: int


class SustainabilityReportResponse(BaseModel):
    report_title: str
    report_generated_at: datetime

    reporting_records: ReportingRecords

    carbon_performance: CarbonPerformance

    renewable_performance: RenewablePerformance

    efficiency: EfficiencyPerformance

    recommendations: list[str]

    trend: list[CarbonTrendItem]

    report_method: str