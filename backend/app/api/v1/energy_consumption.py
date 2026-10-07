from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.energy_consumption import (
    EnergyConsumptionCreate,
    EnergyConsumptionResponse,
)
from app.services.energy_consumption_service import (
    create_energy_consumption,
    get_energy_consumption,
    get_energy_consumption_list,
)

from app.services.smart_meter_service import (
    get_clean_energy_records,
    calculate_total_consumption,
    calculate_average_consumption,
    calculate_peak_consumption,
    aggregate_consumption_by_day,
    aggregate_consumption_by_hour,
    detect_consumption_anomalies,
     get_latest_meter_reading,
)


router = APIRouter(
   prefix="/api/v1/energy-consumption",
    tags=["Energy Consumption"],
)


@router.post(
    "",
    response_model=EnergyConsumptionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_energy_consumption_record(
    data: EnergyConsumptionCreate,
    db: Session = Depends(get_db),
):
    return create_energy_consumption(db, data)


@router.get(
    "",
    response_model=list[EnergyConsumptionResponse],
)
def list_energy_consumption(
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return get_energy_consumption_list(db, limit)
@router.get(
    "/latest",
    response_model=EnergyConsumptionResponse,
    tags=["Smart Meter Processing"],
)
def latest_meter_reading(
    db: Session = Depends(get_db),
):
    """
    Return the latest smart-meter reading
    for near-real-time grid monitoring.
    """

    record = get_latest_meter_reading(db)

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No smart-meter reading available.",
        )

    return record
@router.get(
    "/{record_id}",
    response_model=EnergyConsumptionResponse,
)
def get_energy_consumption_record(
    record_id: int,
    db: Session = Depends(get_db),
):
    record = get_energy_consumption(db, record_id)

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Energy consumption record not found",
        )

    return record
@router.get(
    "/analysis/summary",
    tags=["Smart Meter Processing"],
)
def smart_meter_analysis(
    db: Session = Depends(get_db),
):
    """
    Analyze and aggregate smart-meter energy consumption data.
    """

    records = get_clean_energy_records(db)

    if not records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No valid smart-meter energy records found.",
        )

    anomalies = detect_consumption_anomalies(records)

    return {
        "total_records": len(records),
        "total_consumption_kwh": calculate_total_consumption(records),
        "average_consumption_kwh": calculate_average_consumption(records),
        "peak_consumption_kwh": calculate_peak_consumption(records),
        "daily_consumption_kwh": aggregate_consumption_by_day(records),
        "hourly_consumption_kwh": aggregate_consumption_by_hour(records),
        "anomaly_count": len(anomalies),
        "anomaly_record_ids": [record.id for record in anomalies],
    }