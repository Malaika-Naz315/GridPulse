from pydantic import BaseModel, Field


class ForecastEvaluationResponse(BaseModel):
    training_records: int
    testing_records: int
    mae: float = Field(ge=0)
    rmse: float = Field(ge=0)
    r2_score: float