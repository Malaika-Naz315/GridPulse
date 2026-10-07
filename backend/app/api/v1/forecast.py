from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.energy_consumption import EnergyConsumption
from app.models.weather_data import WeatherData

from app.schemas.forecast_result import (
    ForecastResultCreate,
    ForecastResultResponse,
)

from app.schemas.forecast_evaluation import (
    ForecastEvaluationResponse,
)

from app.services.forecast_result_service import (
    create_forecast_result,
    get_forecast_result,
    get_forecast_results,
)

from app.services.forecast_evaluation_service import (
    evaluate_forecast_model,
)

from app.ml.forecast_model import (
    prepare_features,
    predict_consumption,
    generate_horizon_forecast,
)

from app.ml.model_loader import load_forecast_model


router = APIRouter(
    prefix="/forecast",
    tags=["Forecast"],
)


# ---------------------------------------------------------
# Create Forecast Result
# ---------------------------------------------------------

@router.post(
    "",
    response_model=ForecastResultResponse,
    status_code=201,
)
def create_forecast(
    forecast_data: ForecastResultCreate,
    db: Session = Depends(get_db),
):
    return create_forecast_result(
        db,
        forecast_data,
    )


# ---------------------------------------------------------
# List Forecast Results
# ---------------------------------------------------------

@router.get(
    "",
    response_model=list[ForecastResultResponse],
)
def list_forecasts(
    limit: int = Query(
        default=100,
        ge=1,
        le=1000,
    ),
    db: Session = Depends(get_db),
):
    return get_forecast_results(
        db,
        limit,
    )


# ---------------------------------------------------------
# Forecast Model Evaluation
# ---------------------------------------------------------

@router.get(
    "/evaluate",
    response_model=ForecastEvaluationResponse,
)
def evaluate_forecast(
    db: Session = Depends(get_db),
):
    """
    Evaluate the Random Forest forecasting model
    using historical energy and weather data.
    """

    energy_records = (
        db.query(EnergyConsumption)
        .order_by(EnergyConsumption.timestamp.asc())
        .all()
    )

    weather_records = (
        db.query(WeatherData)
        .order_by(WeatherData.timestamp.asc())
        .all()
    )

    if len(energy_records) < 10:
        raise HTTPException(
            status_code=400,
            detail=(
                "At least 10 energy consumption records "
                "are required for model evaluation."
            ),
        )

    if not weather_records:
        raise HTTPException(
            status_code=400,
            detail="No weather data available.",
        )

    try:
        return evaluate_forecast_model(
            energy_records,
            weather_records,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Forecast evaluation failed: {str(exc)}"
            ),
        )


# ---------------------------------------------------------
# AI Forecast Prediction
# ---------------------------------------------------------

@router.post(
    "/predict",
    response_model=ForecastResultResponse,
    status_code=201,
)
def predict_forecast(
    forecast_timestamp: datetime,
    db: Session = Depends(get_db),
):
    """
    Generate an energy-consumption forecast
    using the saved Random Forest model and
    weather-aware features.
    """

    # -----------------------------------------------------
    # Get historical energy records
    # -----------------------------------------------------

    energy_records = (
        db.query(EnergyConsumption)
        .order_by(EnergyConsumption.timestamp.asc())
        .all()
    )

    if len(energy_records) < 6:
        raise HTTPException(
            status_code=400,
            detail=(
                "At least 6 historical energy "
                "consumption records are required."
            ),
        )

    # -----------------------------------------------------
    # Get weather records
    # -----------------------------------------------------

    weather_records = (
        db.query(WeatherData)
        .order_by(WeatherData.timestamp.asc())
        .all()
    )

    if not weather_records:
        raise HTTPException(
            status_code=400,
            detail="No weather data available.",
        )

    try:
        # -------------------------------------------------
        # Prepare energy + weather features
        # -------------------------------------------------

        data = prepare_features(
            energy_records,
            weather_records,
        )

        # -------------------------------------------------
        # Load saved Random Forest model
        # -------------------------------------------------

        model = load_forecast_model()

        # -------------------------------------------------
        # Generate prediction
        # -------------------------------------------------

        prediction = predict_consumption(
            model,
            data,
            forecast_timestamp,
            weather_records,
        )

        # -------------------------------------------------
        # Save prediction in database
        # -------------------------------------------------

        forecast_data = ForecastResultCreate(
            forecast_timestamp=forecast_timestamp,
            predicted_consumption_kwh=prediction,
            model_name="RandomForest",
            model_version="1.0",
            confidence_score=0.90,
        )

        return create_forecast_result(
            db,
            forecast_data,
        )

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Forecast generation failed: {str(exc)}"
            ),
        )

# ---------------------------------------------------------
# Demand Forecast Horizon
# ---------------------------------------------------------

@router.get(
    "/horizon",
)
def forecast_horizon(
    horizon: str = Query(
        default="24H",
        pattern="^(24H|7D|30D)$",
    ),
    db: Session = Depends(get_db),
):
    """
    Generate multi-step demand forecasts for
    24 hours, 7 days, or 30 days.
    """

    energy_records = (
        db.query(EnergyConsumption)
        .order_by(EnergyConsumption.timestamp.asc())
        .all()
    )

    weather_records = (
        db.query(WeatherData)
        .order_by(WeatherData.timestamp.asc())
        .all()
    )

    if len(energy_records) < 6:
        raise HTTPException(
            status_code=400,
            detail=(
                "At least 6 historical energy "
                "records are required."
            ),
        )

    if not weather_records:
        raise HTTPException(
            status_code=400,
            detail="No weather data available.",
        )

    try:
        data = prepare_features(
            energy_records,
            weather_records,
        )

        model = load_forecast_model()

        if horizon == "24H":
            periods = 24
            frequency = "h"

        elif horizon == "7D":
            periods = 7
            frequency = "d"

        else:
            periods = 30
            frequency = "d"

        forecasts = generate_horizon_forecast(
            model=model,
            data=data,
            weather_data=weather_records,
            periods=periods,
            frequency=frequency,
        )

        return {
            "horizon": horizon,
            "model_name": "RandomForest",
            "model_version": "1.0",
            "confidence_score": 0.90,
            "forecast_count": len(forecasts),
            "forecasts": forecasts,
        }

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Forecast horizon generation failed: {str(exc)}"
            ),
        )
# ---------------------------------------------------------
# Get Forecast Result
# ---------------------------------------------------------

@router.get(
    "/{forecast_id}",
    response_model=ForecastResultResponse,
)
def get_forecast(
    forecast_id: int,
    db: Session = Depends(get_db),
):
    forecast = get_forecast_result(
        db,
        forecast_id,
    )

    if forecast is None:
        raise HTTPException(
            status_code=404,
            detail="Forecast result not found",
        )

    return forecast