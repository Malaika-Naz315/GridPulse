from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class WeatherData(Base):
    __tablename__ = "weather_data"

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

    temperature_c: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    humidity_percent: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    wind_speed_kmh: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    weather_condition: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )