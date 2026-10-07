from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RenewableEnergy(Base):
    __tablename__ = "renewable_energy"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        index=True,
    )

    solar_production_kwh: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    wind_generation_kwh: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    battery_storage_kwh: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    renewable_availability_percent: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    energy_source: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )