from pydantic import BaseModel, Field


class GridOptimizationResponse(BaseModel):
    # Current grid state
    demand_kwh: float
    solar_kwh: float
    wind_kwh: float
    renewable_generation_kwh: float
    battery_storage_kwh: float

    # Energy balance
    renewable_coverage_percent: float
    grid_import_kwh: float
    surplus_kwh: float
    energy_gap_kwh: float

    # Operational actions
    battery_action: str
    recommended_action: str
    grid_status: str

    # Risk intelligence
    risk_score: float = Field(ge=0, le=100)
    risk_level: str
    demand_risk: str
    renewable_risk: str
    battery_risk: str
    grid_dependency_risk: str

    # Optimization intelligence
    optimization_score: float = Field(ge=0, le=100)
    optimization_method: str

    # Autonomous decision
    autonomous_decision: str
    decision_reason: str

    # Explainable AI
    decision_trace: list[str]
    explanation: list[str]