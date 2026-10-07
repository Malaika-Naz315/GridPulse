import pandas as pd
from sklearn.ensemble import RandomForestRegressor


FEATURE_COLUMNS = [
    "hour",
    "day_of_week",
    "lag_1",
    "lag_2",
    "lag_6",
    "rolling_mean_3",
    "temperature_c",
    "humidity_percent",
    "wind_speed_kmh",
]


def prepare_features(energy_records, weather_records):
    """
    Combine energy consumption with the nearest available weather data
    and create time-series forecasting features.
    """

    energy_data = pd.DataFrame(
        [
            {
                "timestamp": record.timestamp,
                "consumption_kwh": record.consumption_kwh,
            }
            for record in energy_records
        ]
    )

    weather_data = pd.DataFrame(
        [
            {
                "timestamp": record.timestamp,
                "temperature_c": record.temperature_c,
                "humidity_percent": record.humidity_percent,
                "wind_speed_kmh": record.wind_speed_kmh,
            }
            for record in weather_records
        ]
    )

    if energy_data.empty:
        raise ValueError("No energy consumption data available.")

    if weather_data.empty:
        raise ValueError("No weather data available.")

    # Convert timestamps
    energy_data["timestamp"] = pd.to_datetime(
        energy_data["timestamp"]
    )

    weather_data["timestamp"] = pd.to_datetime(
        weather_data["timestamp"]
    )

    # Sort both datasets
    energy_data = (
        energy_data
        .sort_values("timestamp")
        .reset_index(drop=True)
    )

    weather_data = (
        weather_data
        .sort_values("timestamp")
        .reset_index(drop=True)
    )

    # ---------------------------------------------------------
    # Attach nearest available weather record to each
    # energy record.
    #
    # This is better than an inner merge because an energy
    # reading should not disappear just because weather data
    # does not exist at the exact same timestamp.
    # ---------------------------------------------------------

    data = pd.merge_asof(
        energy_data,
        weather_data,
        on="timestamp",
        direction="nearest",
    )

    if data.empty:
        raise ValueError(
            "No matching energy and weather records found."
        )

    # Check for missing weather values
    weather_columns = [
        "temperature_c",
        "humidity_percent",
        "wind_speed_kmh",
    ]

    if data[weather_columns].isnull().any().any():
        # Fill any remaining missing weather values
        # using the latest available observation.
        for column in weather_columns:
            data[column] = data[column].ffill().bfill()

    # ---------------------------------------------------------
    # Time-based features
    # ---------------------------------------------------------

    data["hour"] = data["timestamp"].dt.hour

    data["day_of_week"] = (
        data["timestamp"].dt.dayofweek
    )

    # ---------------------------------------------------------
    # Historical demand features
    # ---------------------------------------------------------

    data["lag_1"] = (
        data["consumption_kwh"].shift(1)
    )

    data["lag_2"] = (
        data["consumption_kwh"].shift(2)
    )

    data["lag_6"] = (
        data["consumption_kwh"].shift(6)
    )

    data["rolling_mean_3"] = (
        data["consumption_kwh"]
        .shift(1)
        .rolling(window=3)
        .mean()
    )

    return data

def train_model(data):
    """
    Train Random Forest demand forecasting model
    using historical consumption and weather features.
    """

    model_data = data.dropna().copy()

    if len(model_data) < 10:
        raise ValueError(
            "Not enough historical data to train the model."
        )

    X = model_data[FEATURE_COLUMNS]
    y = model_data["consumption_kwh"]

    model = RandomForestRegressor(
        n_estimators=200,
        random_state=42,
        min_samples_leaf=1,
    )

    model.fit(X, y)

    return model


def _get_weather_for_timestamp(weather_data, timestamp):
    """
    Get the closest available weather record.

    If an exact timestamp is not available,
    the latest known weather conditions are used.
    """

    weather_data = weather_data.copy()

    weather_data["timestamp"] = pd.to_datetime(
        weather_data["timestamp"]
    )

    exact_match = weather_data[
        weather_data["timestamp"] == timestamp
    ]

    if not exact_match.empty:
        return exact_match.iloc[0]

    previous_weather = weather_data[
        weather_data["timestamp"] <= timestamp
    ]

    if not previous_weather.empty:
        return previous_weather.iloc[-1]

    return weather_data.iloc[-1]


def predict_consumption(
    model,
    data,
    forecast_timestamp,
    weather_data,
):
    """
    Predict energy consumption for a single timestamp.
    """

    timestamp = pd.to_datetime(
        forecast_timestamp
    )

    if len(data) < 6:
        raise ValueError(
            "At least 6 historical records are required."
        )

    data = (
        data
        .sort_values("timestamp")
        .reset_index(drop=True)
    )

    recent_values = (
        data["consumption_kwh"].tolist()
    )

    if isinstance(weather_data, list):
        weather_data = pd.DataFrame(
            [
                {
                    "timestamp": record.timestamp,
                    "temperature_c": record.temperature_c,
                    "humidity_percent": record.humidity_percent,
                    "wind_speed_kmh": record.wind_speed_kmh,
                }
                for record in weather_data
            ]
        )

    if weather_data is None or weather_data.empty:
        raise ValueError(
            "No weather data available."
        )

    weather = _get_weather_for_timestamp(
        weather_data,
        timestamp,
    )

    features = pd.DataFrame(
        [
            {
                "hour": timestamp.hour,
                "day_of_week": timestamp.dayofweek,
                "lag_1": recent_values[-1],
                "lag_2": recent_values[-2],
                "lag_6": recent_values[-6],
                "rolling_mean_3": (
                    sum(recent_values[-3:]) / 3
                ),
                "temperature_c": weather[
                    "temperature_c"
                ],
                "humidity_percent": weather[
                    "humidity_percent"
                ],
                "wind_speed_kmh": weather[
                    "wind_speed_kmh"
                ],
            }
        ]
    )

    prediction = model.predict(
        features[FEATURE_COLUMNS]
    )[0]

    return float(prediction)
def generate_horizon_forecast(
    model,
    data,
    weather_data,
    periods,
    frequency="h",
):
    """
    Generate multi-step energy demand forecasts.

    The function recursively uses previous predictions as
    lag features for future timestamps.
    """

    if data is None or data.empty:
        raise ValueError("No prepared forecasting data available.")

    if weather_data is None:
        raise ValueError("No weather data available.")

    # ---------------------------------------------------------
    # Convert SQLAlchemy weather records into a DataFrame
    # ---------------------------------------------------------
    if isinstance(weather_data, list):
        weather_rows = []

        for record in weather_data:
            weather_rows.append(
                {
                    "timestamp": record.timestamp,
                    "temperature_c": record.temperature_c,
                    "humidity_percent": record.humidity_percent,
                    "wind_speed_kmh": record.wind_speed_kmh,
                }
            )

        weather_data = pd.DataFrame(weather_rows)

    elif not isinstance(weather_data, pd.DataFrame):
        weather_data = pd.DataFrame(weather_data)

    if weather_data.empty:
        raise ValueError("No weather data available.")

    weather_data = weather_data.copy()

    weather_data["timestamp"] = pd.to_datetime(
        weather_data["timestamp"]
    )

    weather_data = (
        weather_data
        .sort_values("timestamp")
        .reset_index(drop=True)
    )

    # ---------------------------------------------------------
    # Prepare historical consumption values
    # ---------------------------------------------------------
    working_data = (
        data
        .sort_values("timestamp")
        .reset_index(drop=True)
        .copy()
    )

    historical_consumption = (
        working_data["consumption_kwh"]
        .dropna()
        .astype(float)
        .tolist()
    )

    if len(historical_consumption) < 6:
        raise ValueError(
            "At least 6 historical consumption records "
            "are required."
        )

    # ---------------------------------------------------------
    # Start forecasting after the latest known timestamp
    # ---------------------------------------------------------
    last_timestamp = pd.to_datetime(
        working_data["timestamp"].max()
    )

    future_timestamps = pd.date_range(
        start=last_timestamp,
        periods=periods + 1,
        freq=frequency,
    )[1:]

    forecasts = []

    # ---------------------------------------------------------
    # Generate forecasts recursively
    # ---------------------------------------------------------
    for timestamp in future_timestamps:

        # Find the closest available weather record
        weather_differences = (
            (weather_data["timestamp"] - timestamp)
            .abs()
        )

        closest_index = weather_differences.idxmin()

        weather = weather_data.loc[closest_index]

        # Safety check
        if weather is None:
            raise ValueError(
                "Unable to find weather data for forecast."
            )

        # Need at least 6 previous consumption values
        if len(historical_consumption) < 6:
            raise ValueError(
                "Not enough historical values for lag features."
            )

        lag_1 = historical_consumption[-1]
        lag_2 = historical_consumption[-2]
        lag_6 = historical_consumption[-6]

        rolling_mean_3 = (
            sum(historical_consumption[-3:]) / 3
        )

        # -----------------------------------------------------
        # Build model input
        # -----------------------------------------------------
        features = pd.DataFrame(
            [
                {
                    "hour": timestamp.hour,
                    "day_of_week": timestamp.dayofweek,
                    "lag_1": lag_1,
                    "lag_2": lag_2,
                    "lag_6": lag_6,
                    "rolling_mean_3": rolling_mean_3,
                    "temperature_c": float(
                        weather["temperature_c"]
                    ),
                    "humidity_percent": float(
                        weather["humidity_percent"]
                    ),
                    "wind_speed_kmh": float(
                        weather["wind_speed_kmh"]
                    ),
                }
            ]
        )

        # -----------------------------------------------------
        # Predict
        # -----------------------------------------------------
        prediction = model.predict(
            features[FEATURE_COLUMNS]
        )[0]

        prediction = max(
            0.0,
            float(prediction),
        )

        # Add prediction to history so next forecast
        # can use it as a lag value.
        historical_consumption.append(
            prediction
        )

        forecasts.append(
            {
                "forecast_timestamp": timestamp.isoformat(),
                "predicted_consumption_kwh": round(
                    prediction,
                    2,
                ),
            }
        )

    return forecasts