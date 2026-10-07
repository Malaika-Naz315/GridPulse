from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.renewable_energy import (
    RenewableEnergyCreate,
    RenewableEnergyResponse,
)
from app.services.renewable_energy_service import (
    create_renewable_energy,
    get_renewable_energy,
    get_renewable_energy_list,
)


router = APIRouter(
    prefix="/api/v1/renewable-energy",
    tags=["Renewable Energy"],
)


@router.post(
    "",
    response_model=RenewableEnergyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_renewable_energy_record(
    data: RenewableEnergyCreate,
    db: Session = Depends(get_db),
):
    return create_renewable_energy(db, data)


@router.get(
    "",
    response_model=list[RenewableEnergyResponse],
)
def list_renewable_energy(
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return get_renewable_energy_list(db, limit)


@router.get(
    "/{record_id}",
    response_model=RenewableEnergyResponse,
)
def get_renewable_energy_record(
    record_id: int,
    db: Session = Depends(get_db),
):
    record = get_renewable_energy(db, record_id)

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Renewable energy record not found",
        )

    return record