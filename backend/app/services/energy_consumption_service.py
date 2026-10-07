from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.energy_consumption import EnergyConsumption
from app.schemas.energy_consumption import EnergyConsumptionCreate


def create_energy_consumption(
    db: Session,
    data: EnergyConsumptionCreate,
) -> EnergyConsumption:
    record = EnergyConsumption(
        timestamp=data.timestamp,
        consumption_kwh=data.consumption_kwh,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


def get_energy_consumption(
    db: Session,
    record_id: int,
) -> EnergyConsumption | None:
    statement = select(EnergyConsumption).where(
        EnergyConsumption.id == record_id
    )

    return db.scalar(statement)


def get_energy_consumption_list(
    db: Session,
    limit: int = 100,
) -> list[EnergyConsumption]:
    statement = (
        select(EnergyConsumption)
        .order_by(EnergyConsumption.timestamp.desc())
        .limit(limit)
    )

    return list(db.scalars(statement).all())