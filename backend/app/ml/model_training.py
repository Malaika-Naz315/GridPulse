from pathlib import Path

import joblib

from app.database import SessionLocal
from app.models.energy_consumption import EnergyConsumption
from app.ml.forecast_model import prepare_features, train_model


MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_PATH = MODEL_DIR / "gridpulse_forecast_model.joblib"


def train_and_save_model():
    """
    Load historical energy-consumption data from PostgreSQL,
    prepare ML features, train the Random Forest model,
    and save the trained model to disk.
    """

    db = SessionLocal()

    try:
        records = (
            db.query(EnergyConsumption)
            .order_by(EnergyConsumption.timestamp)
            .all()
        )

        if not records:
            raise ValueError(
                "No energy consumption records found in database."
            )

        data = prepare_features(records)

        model = train_model(data)

        MODEL_DIR.mkdir(parents=True, exist_ok=True)

        joblib.dump(model, MODEL_PATH)

        print(f"TOTAL RECORDS: {len(records)}")
        print(f"VALID TRAINING ROWS: {len(data.dropna())}")
        print("MODEL TRAINED SUCCESSFULLY")
        print(f"MODEL SAVED TO: {MODEL_PATH}")

        return MODEL_PATH

    finally:
        db.close()


if __name__ == "__main__":
    train_and_save_model()