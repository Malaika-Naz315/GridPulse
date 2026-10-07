from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.forecast_result import ForecastResult
from app.schemas.forecast_result import ForecastResultCreate


def create_forecast_result(
    db: Session,
    forecast_data: ForecastResultCreate,
) -> ForecastResult:
    forecast_result = ForecastResult(
        forecast_timestamp=forecast_data.forecast_timestamp,
        predicted_consumption_kwh=forecast_data.predicted_consumption_kwh,
        model_name=forecast_data.model_name,
        model_version=forecast_data.model_version,
        confidence_score=forecast_data.confidence_score,
    )

    db.add(forecast_result)
    db.commit()
    db.refresh(forecast_result)

    return forecast_result


def get_forecast_results(
    db: Session,
    limit: int = 100,
) -> list[ForecastResult]:
    statement = (
        select(ForecastResult)
        .order_by(ForecastResult.forecast_timestamp.desc())
        .limit(limit)
    )

    return list(db.scalars(statement).all())


def get_forecast_result(
    db: Session,
    forecast_id: int,
) -> ForecastResult | None:
    return db.get(ForecastResult, forecast_id)