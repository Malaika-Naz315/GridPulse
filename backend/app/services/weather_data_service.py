from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.weather_data import WeatherData
from app.schemas.weather_data import WeatherDataCreate


def create_weather_data(
    db: Session,
    data: WeatherDataCreate,
) -> WeatherData:
    record = WeatherData(
        timestamp=data.timestamp,
        temperature_c=data.temperature_c,
        humidity_percent=data.humidity_percent,
        wind_speed_kmh=data.wind_speed_kmh,
        weather_condition=data.weather_condition,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


def get_weather_data(
    db: Session,
    record_id: int,
) -> WeatherData | None:
    statement = select(WeatherData).where(
        WeatherData.id == record_id
    )

    return db.scalar(statement)


def get_weather_data_list(
    db: Session,
    limit: int = 100,
) -> list[WeatherData]:
    statement = (
        select(WeatherData)
        .order_by(WeatherData.timestamp.desc())
        .limit(limit)
    )

    return list(db.scalars(statement).all())