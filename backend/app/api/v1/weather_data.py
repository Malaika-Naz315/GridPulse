from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.weather_data import (
    WeatherDataCreate,
    WeatherDataResponse,
)
from app.services.weather_data_service import (
    create_weather_data,
    get_weather_data,
    get_weather_data_list,
)


router = APIRouter(
   prefix="/api/v1/weather",
    tags=["Weather Data"],
)


@router.post(
    "",
    response_model=WeatherDataResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_weather_data_record(
    data: WeatherDataCreate,
    db: Session = Depends(get_db),
):
    return create_weather_data(db, data)


@router.get(
    "",
    response_model=list[WeatherDataResponse],
)
def list_weather_data(
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return get_weather_data_list(db, limit)


@router.get(
    "/{record_id}",
    response_model=WeatherDataResponse,
)
def get_weather_data_record(
    record_id: int,
    db: Session = Depends(get_db),
):
    record = get_weather_data(db, record_id)

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Weather data record not found",
        )

    return record