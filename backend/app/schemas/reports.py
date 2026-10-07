from datetime import datetime

from pydantic import BaseModel, Field


class ReportKPI(BaseModel):
    label: str
    value: str
    status: str = "NORMAL"


class EnergyPerformance(BaseModel):
    total_demand_kwh: float
    average_demand_kwh: float
    peak_demand_kwh: float
    energy_records: int


class ForecastPerformance(BaseModel):
    model_name: str
    model_version: str
    mae: float
    rmse: float
    r2_score: float
    evaluation_status: str


class RenewablePerformance(BaseModel):
    solar_generation_kwh: float
    wind_generation_kwh: float
    total_renewable_generation_kwh: float
    renewable_contribution_percent: float
    average_battery_storage_kwh: float


class CarbonPerformance(BaseModel):
    baseline_co2_kg: float
    estimated_grid_co2_kg: float
    co2_avoided_kg: float
    carbon_reduction_percent: float
    sustainability_score: float


class GridPerformance(BaseModel):
    grid_status: str
    demand_status: str
    renewable_status: str
    storage_status: str


class ReportRecommendation(BaseModel):
    priority: str
    category: str
    recommendation: str


class ExecutiveReportResponse(BaseModel):
    report_title: str
    generated_at: datetime

    overall_status: str
    overall_score: float = Field(ge=0, le=100)

    kpis: list[ReportKPI]

    energy_performance: EnergyPerformance
    forecast_performance: ForecastPerformance
    renewable_performance: RenewablePerformance
    carbon_performance: CarbonPerformance
    grid_performance: GridPerformance

    ai_insights: list[str]
    recommendations: list[ReportRecommendation]

    data_quality: dict