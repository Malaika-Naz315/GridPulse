from datetime import datetime

from app.database import SessionLocal
from app.models.weather_data import WeatherData


WEATHER_DATA = [
    ("2026-08-20 00:00:00", 25.2, 78, 8.5, "Clear"),
    ("2026-08-20 04:00:00", 24.6, 80, 7.8, "Clear"),
    ("2026-08-20 08:00:00", 27.8, 72, 10.2, "Partly Cloudy"),
    ("2026-08-20 12:00:00", 32.4, 58, 14.5, "Sunny"),
    ("2026-08-20 16:00:00", 34.1, 52, 16.2, "Sunny"),
    ("2026-08-20 20:00:00", 29.3, 64, 12.1, "Clear"),

    ("2026-08-21 00:00:00", 25.4, 77, 8.2, "Clear"),
    ("2026-08-21 04:00:00", 24.8, 79, 7.5, "Clear"),
    ("2026-08-21 08:00:00", 28.1, 70, 10.8, "Partly Cloudy"),
    ("2026-08-21 12:00:00", 32.8, 56, 14.8, "Sunny"),
    ("2026-08-21 16:00:00", 34.5, 50, 16.5, "Sunny"),
    ("2026-08-21 20:00:00", 29.7, 62, 12.4, "Clear"),

    ("2026-08-22 00:00:00", 25.7, 76, 8.0, "Clear"),
    ("2026-08-22 04:00:00", 25.0, 78, 7.3, "Clear"),
    ("2026-08-22 08:00:00", 28.5, 69, 11.0, "Partly Cloudy"),
    ("2026-08-22 12:00:00", 33.2, 54, 15.1, "Sunny"),
    ("2026-08-22 16:00:00", 34.8, 49, 16.8, "Sunny"),
    ("2026-08-22 20:00:00", 30.1, 61, 12.7, "Clear"),

    ("2026-08-23 00:00:00", 26.0, 75, 8.3, "Clear"),
    ("2026-08-23 04:00:00", 25.3, 77, 7.6, "Clear"),
    ("2026-08-23 08:00:00", 28.9, 68, 11.3, "Partly Cloudy"),
    ("2026-08-23 12:00:00", 33.6, 53, 15.4, "Sunny"),
    ("2026-08-23 16:00:00", 35.1, 48, 17.1, "Sunny"),
    ("2026-08-23 20:00:00", 30.5, 60, 13.0, "Clear"),

    ("2026-08-24 00:00:00", 26.2, 74, 8.5, "Clear"),
    ("2026-08-24 04:00:00", 25.5, 76, 7.8, "Clear"),
    ("2026-08-24 08:00:00", 29.2, 67, 11.5, "Partly Cloudy"),
    ("2026-08-24 12:00:00", 34.0, 52, 15.7, "Sunny"),
    ("2026-08-24 16:00:00", 35.4, 47, 17.4, "Sunny"),
    ("2026-08-24 20:00:00", 30.8, 59, 13.3, "Clear"),
]


def seed_weather_data():
    db = SessionLocal()

    try:
        inserted = 0
        skipped = 0

        for timestamp, temperature, humidity, wind_speed, condition in WEATHER_DATA:
            dt = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")

            existing = (
                db.query(WeatherData)
                .filter(WeatherData.timestamp == dt)
                .first()
            )

            if existing:
                skipped += 1
                continue

            record = WeatherData(
                timestamp=dt,
                temperature_c=temperature,
                humidity_percent=humidity,
                wind_speed_kmh=wind_speed,
                weather_condition=condition,
            )

            db.add(record)
            inserted += 1

        db.commit()

        print("WEATHER DATA SEED COMPLETE")
        print("INSERTED:", inserted)
        print("SKIPPED EXISTING:", skipped)

    finally:
        db.close()


if __name__ == "__main__":
    seed_weather_data()