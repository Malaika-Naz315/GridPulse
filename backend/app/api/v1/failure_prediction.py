from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.failure_prediction_service import (
    predict_failures_from_database,
)

router = APIRouter(
    prefix="/api/v1/failure-prediction",
    tags=["Failure Prediction"],
)


@router.get("")
def failure_prediction(
    db: Session = Depends(get_db),
):
    """
    Predict grid equipment failures using
    current and historical telemetry.
    """

    try:
        return predict_failures_from_database(db)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failure prediction failed: {str(exc)}",
        )