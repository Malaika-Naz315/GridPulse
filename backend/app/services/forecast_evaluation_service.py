import numpy as np

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import train_test_split

from app.ml.forecast_model import (
    FEATURE_COLUMNS,
    prepare_features,
    train_model,
)


def evaluate_forecast_model(
    energy_records,
    weather_records,
):
    """
    Evaluate the Random Forest forecasting model
    using historical energy and weather data.
    """

    data = prepare_features(
        energy_records,
        weather_records,
    )

    model_data = data.dropna().copy()

    if len(model_data) < 10:
        raise ValueError(
            "Not enough historical data for model evaluation."
        )

    X = model_data[FEATURE_COLUMNS]
    y = model_data["consumption_kwh"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
    )

    train_data = model_data.loc[X_train.index]

    model = train_model(train_data)

    predictions = model.predict(X_test)

    mae = mean_absolute_error(
        y_test,
        predictions,
    )

    rmse = np.sqrt(
        mean_squared_error(
            y_test,
            predictions,
        )
    )

    r2 = r2_score(
        y_test,
        predictions,
    )

    return {
        "training_records": len(X_train),
        "testing_records": len(X_test),
        "mae": round(float(mae), 2),
        "rmse": round(float(rmse), 2),
        "r2_score": round(float(r2), 4),
    }