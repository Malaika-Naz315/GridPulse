from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.grid_optimization import GridOptimizationResponse
from app.services.grid_optimization_service import optimize_grid_from_database


router = APIRouter(
    prefix="/api/v1/grid-optimization",
    tags=["Grid Optimization"],
)


@router.post(
    "",
    response_model=GridOptimizationResponse,
    status_code=status.HTTP_200_OK,
)
def optimize_grid_distribution(
    db: Session = Depends(get_db),
):
    """
    Run grid optimization using the latest
    energy consumption and renewable energy records.
    """

    try:
        return optimize_grid_from_database(db)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
