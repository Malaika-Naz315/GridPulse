from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.energy_consumption import EnergyConsumption


def clean_energy_records(
    records: list[EnergyConsumption],
) -> list[EnergyConsumption]:
    """
    Clean smart-meter energy consumption records.

    Removes:
    - Missing timestamps
    - Invalid/non-positive consumption values
    - Duplicate timestamps
    """

    cleaned_records = []
    seen_timestamps = set()

    for record in records:
        if record.timestamp is None:
            continue

        if record.consumption_kwh is None:
            continue

        if record.consumption_kwh <= 0:
            continue

        if record.timestamp in seen_timestamps:
            continue

        seen_timestamps.add(record.timestamp)
        cleaned_records.append(record)

    return cleaned_records


def get_clean_energy_records(
    db: Session,
) -> list[EnergyConsumption]:
    """
    Retrieve and clean all smart-meter energy records.
    """

    statement = (
        select(EnergyConsumption)
        .order_by(EnergyConsumption.timestamp.asc())
    )

    records = list(db.scalars(statement).all())

    return clean_energy_records(records)


def calculate_total_consumption(
    records: list[EnergyConsumption],
) -> float:
    """
    Calculate total energy consumption.
    """

    return round(
        sum(record.consumption_kwh for record in records),
        2,
    )


def calculate_average_consumption(
    records: list[EnergyConsumption],
) -> float:
    """
    Calculate average energy consumption.
    """

    if not records:
        return 0.0

    return round(
        sum(record.consumption_kwh for record in records)
        / len(records),
        2,
    )


def calculate_peak_consumption(
    records: list[EnergyConsumption],
) -> float:
    """
    Identify peak energy consumption.
    """

    if not records:
        return 0.0

    return round(
        max(record.consumption_kwh for record in records),
        2,
    )


def aggregate_consumption_by_day(
    records: list[EnergyConsumption],
) -> dict[str, float]:
    """
    Aggregate smart-meter consumption by calendar day.
    """

    daily_consumption: dict[str, float] = {}

    for record in records:
        day = record.timestamp.date().isoformat()

        daily_consumption[day] = (
            daily_consumption.get(day, 0.0)
            + record.consumption_kwh
        )

    return {
        day: round(value, 2)
        for day, value in daily_consumption.items()
    }


def aggregate_consumption_by_hour(
    records: list[EnergyConsumption],
) -> dict[int, float]:
    """
    Aggregate consumption by hour of day.
    """

    hourly_consumption: dict[int, float] = {}

    for record in records:
        hour = record.timestamp.hour

        hourly_consumption[hour] = (
            hourly_consumption.get(hour, 0.0)
            + record.consumption_kwh
        )

    return {
        hour: round(value, 2)
        for hour, value in sorted(hourly_consumption.items())
    }


def get_latest_meter_reading(
    db: Session,
) -> EnergyConsumption | None:
    """
    Return the latest smart-meter reading.
    """

    statement = (
        select(EnergyConsumption)
        .order_by(EnergyConsumption.timestamp.desc())
        .limit(1)
    )

    return db.scalar(statement)


def detect_consumption_anomalies(
    records: list[EnergyConsumption],
    threshold_kwh: float = 200.0,
) -> list[EnergyConsumption]:
    """
    Detect unusually high consumption readings.

    This is a simple rule-based anomaly detector
    for the smart-meter processing prototype.
    """

    return [
        record
        for record in records
        if record.consumption_kwh > threshold_kwh
    ]