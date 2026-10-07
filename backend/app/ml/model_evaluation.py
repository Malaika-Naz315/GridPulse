import pandas as pd
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.ensemble import RandomForestRegressor

from app.ml.forecast_model import FEATURE_COLUMNS


def evaluate_model(data):
    """
    Evaluate the Random Forest forecasting model
    using historical energy consumption data.
    """

    model_data = data.dropna().copy()

    if len(model_data) < 10:
        raise ValueError(
            "Not enough historical data for model evaluation."
        )

    X = model_data[FEATURE_COLUMNS]
    y = model_data["consumption_kwh"]

    model = RandomForestRegressor(
        n_estimators=200,
        random_state=42,
        min_samples_leaf=1,
    )

    model.fit(X, y)

    predictions = model.predict(X)

    mae = mean_absolute_error(y, predictions)
    rmse = mean_squared_error(y, predictions) ** 0.5
    r2 = r2_score(y, predictions)

    return {
        "mae": float(mae),
        "rmse": float(rmse),
        "r2_score": float(r2),
    }