from datetime import datetime

from pydantic import BaseModel, Field


class CarbonScenarioRequest(BaseModel):
    scenario: str = Field(
        ...,
        description=(
            "solar_boost, wind_boost, renewable_boost, "
            "battery_optimization, peak_demand, renewable_drop"
        ),
    )


class CarbonAIInsightResponse(BaseModel):
    engine: str
    optimization_type: str
    recommended_scenario: str

    expected_co2_saving_kg: float
    sustainability_score_change: float

    baseline: dict
    recommended_projection: dict

    reasons: list[str]
    scenarios_evaluated: list[str]
    all_scenarios: list[dict]

    model_confidence: str
    generated_at: datetime