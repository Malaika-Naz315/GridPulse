from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.renewable_energy import RenewableEnergy


def create_renewable_energy(
    db: Session,
    data,
) -> RenewableEnergy:
    record = RenewableEnergy(
        timestamp=data.timestamp,
        solar_production_kwh=data.solar_production_kwh,
        wind_generation_kwh=data.wind_generation_kwh,
        battery_storage_kwh=data.battery_storage_kwh,
        renewable_availability_percent=data.renewable_availability_percent,
        energy_source=data.energy_source,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


def get_renewable_energy(
    db: Session,
    record_id: int,
) -> RenewableEnergy | None:
    statement = select(RenewableEnergy).where(
        RenewableEnergy.id == record_id
    )

    return db.scalar(statement)


def get_renewable_energy_list(
    db: Session,
    limit: int = 100,
) -> list[RenewableEnergy]:
    statement = (
        select(RenewableEnergy)
        .order_by(RenewableEnergy.timestamp.desc())
        .limit(limit)
    )

    return list(db.scalars(statement).all())


def get_renewable_energy_analysis(
    db: Session,
) -> dict:
    """
    Calculate renewable energy production,
    storage and availability statistics.
    """

    statement = (
        select(RenewableEnergy)
        .order_by(RenewableEnergy.timestamp.asc())
    )

    records = list(db.scalars(statement).all())

    if not records:
        return {
            "total_records": 0,
            "total_solar_production_kwh": 0.0,
            "total_wind_generation_kwh": 0.0,
            "average_battery_storage_kwh": 0.0,
            "average_renewable_availability_percent": 0.0,
            "total_renewable_generation_kwh": 0.0,
            "peak_solar_production_kwh": 0.0,
            "peak_wind_generation_kwh": 0.0,
            "daily_renewable_generation_kwh": {},
        }

    total_solar = sum(
        record.solar_production_kwh
        for record in records
    )

    total_wind = sum(
        record.wind_generation_kwh
        for record in records
    )

    average_battery = (
        sum(
            record.battery_storage_kwh
            for record in records
        )
        / len(records)
    )

    average_availability = (
        sum(
            record.renewable_availability_percent
            for record in records
        )
        / len(records)
    )

    daily_generation: dict[str, float] = {}

    for record in records:
        day = record.timestamp.date().isoformat()

        generation = (
            record.solar_production_kwh
            + record.wind_generation_kwh
        )

        daily_generation[day] = (
            daily_generation.get(day, 0.0)
            + generation
        )

    return {
        "total_records": len(records),
        "total_solar_production_kwh": round(total_solar, 2),
        "total_wind_generation_kwh": round(total_wind, 2),
        "average_battery_storage_kwh": round(
            average_battery,
            2,
        ),
        "average_renewable_availability_percent": round(
            average_availability,
            2,
        ),
        "total_renewable_generation_kwh": round(
            total_solar + total_wind,
            2,
        ),
        "peak_solar_production_kwh": round(
            max(
                record.solar_production_kwh
                for record in records
            ),
            2,
        ),
        "peak_wind_generation_kwh": round(
            max(
                record.wind_generation_kwh
                for record in records
            ),
            2,
        ),
        "daily_renewable_generation_kwh": {
            day: round(value, 2)
            for day, value in daily_generation.items()
        },
    }