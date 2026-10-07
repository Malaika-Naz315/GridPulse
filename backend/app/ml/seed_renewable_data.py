from datetime import datetime, timedelta

from app.database import SessionLocal
from app.models.renewable_energy import RenewableEnergy


def seed_renewable_data():
    db = SessionLocal()

    try:
        existing_count = db.query(RenewableEnergy).count()

        if existing_count > 0:
            print(f"RENEWABLE DATA ALREADY EXISTS: {existing_count}")
            return

        start_time = datetime(2026, 8, 20, 0, 0, 0)

        records = []

        # 5 days × 6 readings per day = 30 records
        for day in range(5):
            for hour in [0, 4, 8, 12, 16, 20]:

                timestamp = start_time + timedelta(
                    days=day,
                    hours=hour,
                )

                # Solar production follows daylight pattern
                solar_values = {
                    0: 0.0,
                    4: 0.0,
                    8: 18.5,
                    12: 42.0,
                    16: 35.5,
                    20: 5.0,
                }

                # Small daily variation
                solar = solar_values[hour] + (day * 1.2)

                # Wind generation varies throughout the day
                wind_values = {
                    0: 14.2,
                    4: 16.5,
                    8: 12.8,
                    12: 10.5,
                    16: 13.7,
                    20: 17.2,
                }

                wind = wind_values[hour] + (day * 0.6)

                # Battery level responds to renewable production
                battery_values = {
                    0: 72.0,
                    4: 68.5,
                    8: 64.0,
                    12: 78.5,
                    16: 86.0,
                    20: 80.0,
                }

                battery = battery_values[hour] + (day * 1.0)

                # Renewable availability
                availability_values = {
                    0: 82.0,
                    4: 85.0,
                    8: 88.0,
                    12: 94.0,
                    16: 92.0,
                    20: 86.0,
                }

                availability = availability_values[hour]

                # Determine dominant energy source
                if solar > wind:
                    energy_source = "Solar"
                else:
                    energy_source = "Wind"

                record = RenewableEnergy(
                    timestamp=timestamp,
                    solar_production_kwh=round(solar, 2),
                    wind_generation_kwh=round(wind, 2),
                    battery_storage_kwh=round(battery, 2),
                    renewable_availability_percent=availability,
                    energy_source=energy_source,
                )

                records.append(record)

        db.add_all(records)
        db.commit()

        print("RENEWABLE ENERGY SEED COMPLETE")
        print("INSERTED:", len(records))

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_renewable_data()