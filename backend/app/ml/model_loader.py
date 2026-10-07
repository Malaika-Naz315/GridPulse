from pathlib import Path

import joblib


MODEL_PATH = (
    Path(__file__).resolve().parent
    / "models"
    / "gridpulse_forecast_model.joblib"
)


def load_forecast_model():
    """
    Load the trained GridPulse forecasting model.
    """

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Forecast model not found at: {MODEL_PATH}"
        )

    return joblib.load(MODEL_PATH)