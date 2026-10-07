from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.digital_twin import (
    DigitalTwinSimulationRequest,
    DigitalTwinSimulationResponse,
    DigitalTwinStateResponse,
)
from app.services.digital_twin_service import (
    get_digital_twin_state,
    simulate_digital_twin,
)


router = APIRouter(
    prefix="/api/v1/digital-twin",
    tags=["Digital Twin"],
)


@router.get(
    "/state",
    response_model=DigitalTwinStateResponse,
)
def digital_twin_state(
    db: Session = Depends(get_db),
):
    return get_digital_twin_state(db)


@router.post(
    "/simulate",
    response_model=DigitalTwinSimulationResponse,
)
def digital_twin_simulation(
    data: DigitalTwinSimulationRequest,
    db: Session = Depends(get_db),
):
    try:
        return simulate_digital_twin(
            db,
            data.scenario,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )