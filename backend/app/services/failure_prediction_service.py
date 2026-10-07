from dataclasses import dataclass
from statistics import mean, pstdev

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.energy_consumption import EnergyConsumption
from app.models.renewable_energy import RenewableEnergy


@dataclass
class FailurePrediction:
    failure_type: str
    risk_score: float
    risk_level: str
    probability_percent: float
    status: str
    severity: str
    explanation: str
    recommended_action: str


# =========================================================
# RISK HELPERS
# =========================================================

def clamp(value: float, minimum: float = 0, maximum: float = 100) -> float:
    return max(minimum, min(maximum, value))


def classify_risk(score: float) -> str:
    if score >= 75:
        return "CRITICAL"
    if score >= 50:
        return "HIGH"
    if score >= 25:
        return "MEDIUM"
    return "LOW"


def severity_from_score(score: float) -> str:
    if score >= 75:
        return "HIGH"
    if score >= 50:
        return "MEDIUM"
    return "LOW"


def status_from_score(score: float) -> str:
    return "ALERT" if score >= 50 else "NORMAL"


# =========================================================
# FEATURE ENGINEERING
# =========================================================

def calculate_features(
    current_demand: float,
    historical_consumption: list[float],
    solar_kwh: float,
    wind_kwh: float,
    battery_kwh: float,
) -> dict:

    values = [
        float(value)
        for value in historical_consumption
        if value is not None
    ]

    if not values:
        values = [current_demand]

    # The latest reading can itself be an abnormal meter reading.
    # Therefore, calculate the operational baseline from previous readings.
    previous_values = values[:-1]

    if len(previous_values) >= 6:
        baseline_values = previous_values[-24:]
    else:
        baseline_values = previous_values or values

    baseline_average = mean(baseline_values)

    recent_values = baseline_values[-6:]

    recent_average = (
        mean(recent_values)
        if recent_values
        else baseline_average
    )

    if len(baseline_values) >= 2:
        baseline_volatility = (
            pstdev(baseline_values)
            / baseline_average
            * 100
            if baseline_average > 0
            else 0
        )
    else:
        baseline_volatility = 0

    # Difference between current reading and normal operating baseline.
    raw_deviation = (
        abs(current_demand - baseline_average)
        / baseline_average
        * 100
        if baseline_average > 0
        else 0
    )

    # Detect whether current reading is abnormally low/high.
    current_ratio = (
        current_demand / baseline_average
        if baseline_average > 0
        else 1
    )

    abnormal_meter_reading = (
        current_ratio < 0.50
        or current_ratio > 1.50
    )

    # Renewable availability relative to normal demand.
    renewable_generation = max(
        0,
        solar_kwh + wind_kwh
    )

    renewable_ratio = (
        renewable_generation / max(baseline_average, 1)
        * 100
    )

    # Battery reserve relative to normal demand.
    battery_ratio = clamp(
        battery_kwh
        / max(baseline_average, 1)
        * 100
    )

    return {
        "baseline_average": baseline_average,
        "recent_average": recent_average,
        "baseline_volatility": baseline_volatility,
        "raw_deviation": raw_deviation,
        "current_ratio": current_ratio,
        "abnormal_meter_reading": abnormal_meter_reading,
        "renewable_generation": renewable_generation,
        "renewable_ratio": renewable_ratio,
        "battery_ratio": battery_ratio,
    }


# =========================================================
# FAILURE PREDICTION ENGINE
# =========================================================

def calculate_failure_predictions(
    demand_kwh: float,
    solar_kwh: float,
    wind_kwh: float,
    battery_kwh: float,
    historical_consumption: list[float],
) -> list[FailurePrediction]:

    features = calculate_features(
        current_demand=demand_kwh,
        historical_consumption=historical_consumption,
        solar_kwh=solar_kwh,
        wind_kwh=wind_kwh,
        battery_kwh=battery_kwh,
    )

    baseline_average = features["baseline_average"]
    recent_average = features["recent_average"]
    baseline_volatility = features["baseline_volatility"]
    raw_deviation = features["raw_deviation"]
    current_ratio = features["current_ratio"]
    abnormal_meter_reading = features["abnormal_meter_reading"]
    renewable_generation = features["renewable_generation"]
    renewable_ratio = features["renewable_ratio"]
    battery_ratio = features["battery_ratio"]

    predictions = []

    # =====================================================
    # 1. EQUIPMENT OVERLOAD
    # =====================================================

    # Only high consumption should increase overload risk.
    # A very LOW reading should not mean equipment overload.
    overload_pressure = max(
        0,
        (current_ratio - 1) * 100
    )

    overload_score = clamp(
        overload_pressure * 0.85
        + baseline_volatility * 0.35
    )

    if current_ratio <= 0.70:
        overload_score *= 0.25

    overload_score = round(
        clamp(overload_score),
        2,
    )

    predictions.append(
        FailurePrediction(
            failure_type="Equipment Overload",
            risk_score=overload_score,
            risk_level=classify_risk(overload_score),
            probability_percent=overload_score,
            status=status_from_score(overload_score),
            severity=severity_from_score(overload_score),
            explanation=(
                f"Current consumption is {demand_kwh:.2f} kWh while "
                f"the normal operating baseline is {baseline_average:.2f} kWh. "
                f"Current load ratio is {current_ratio * 100:.1f}% of baseline."
            ),
            recommended_action=(
                "Monitor equipment loading and redistribute demand "
                "if consumption rises above the normal operating range."
            ),
        )
    )

    # =====================================================
    # 2. TRANSFORMER FAILURE
    # =====================================================

    reserve_stress = max(
        0,
        60 - battery_ratio
    )

    transformer_score = clamp(
        overload_score * 0.55
        + reserve_stress * 0.45
        + baseline_volatility * 0.25
    )

    transformer_score = round(
        clamp(transformer_score),
        2,
    )

    predictions.append(
        FailurePrediction(
            failure_type="Transformer Failure",
            risk_score=transformer_score,
            risk_level=classify_risk(transformer_score),
            probability_percent=transformer_score,
            status=status_from_score(transformer_score),
            severity=severity_from_score(transformer_score),
            explanation=(
                f"Transformer risk considers equipment loading, "
                f"battery reserve and consumption volatility. "
                f"Battery reserve is {battery_kwh:.2f} kWh "
                f"({battery_ratio:.1f}% of normal demand)."
            ),
            recommended_action=(
                "Monitor heavily loaded transformers and maintain "
                "adequate energy reserve during demand changes."
            ),
        )
    )

    # =====================================================
    # 3. TRANSMISSION LINE FAILURE
    # =====================================================

    # Renewable supply itself is NOT treated as transmission failure.
    # Only low renewable support + abnormal demand pressure contribute.
    renewable_support_risk = clamp(
        (60 - min(renewable_ratio, 60)) * 0.55
    )

    demand_transmission_stress = clamp(
        max(0, (current_ratio - 1) * 100) * 0.45
    )

    transmission_score = clamp(
        renewable_support_risk
        + demand_transmission_stress
        + baseline_volatility * 0.20
    )

    transmission_score = round(
        clamp(transmission_score),
        2,
    )

    predictions.append(
        FailurePrediction(
            failure_type="Transmission Line Failure",
            risk_score=transmission_score,
            risk_level=classify_risk(transmission_score),
            probability_percent=transmission_score,
            status=status_from_score(transmission_score),
            severity=severity_from_score(transmission_score),
            explanation=(
                f"Current renewable generation is {renewable_generation:.2f} kWh. "
                f"Relative to the normal demand baseline, renewable support is "
                f"{renewable_ratio:.1f}%. Transmission risk also considers "
                f"load pressure and demand volatility."
            ),
            recommended_action=(
                "Monitor transmission loading and maintain alternate "
                "routing or balancing capability when supply conditions change."
            ),
        )
    )

    # =====================================================
    # 4. VOLTAGE INSTABILITY
    # =====================================================

    voltage_score = clamp(
        raw_deviation * 0.35
        + baseline_volatility * 0.85
    )

    # A sudden extreme meter reading is an anomaly signal,
    # but it should not automatically mean a physical voltage failure.
    if abnormal_meter_reading:
        voltage_score = min(
            voltage_score,
            65
        )

    voltage_score = round(
        clamp(voltage_score),
        2,
    )

    predictions.append(
        FailurePrediction(
            failure_type="Voltage Instability",
            risk_score=voltage_score,
            risk_level=classify_risk(voltage_score),
            probability_percent=voltage_score,
            status=status_from_score(voltage_score),
            severity=severity_from_score(voltage_score),
            explanation=(
                f"Current consumption differs from the normal baseline "
                f"by {raw_deviation:.1f}%. Recent operating volatility "
                f"is {baseline_volatility:.1f}%."
            ),
            recommended_action=(
                "Check abnormal meter behavior and monitor voltage "
                "levels for persistent load fluctuations."
            ),
        )
    )

    # =====================================================
    # 5. FREQUENCY DEVIATION
    # =====================================================

    short_term_change = (
        abs(demand_kwh - recent_average)
        / max(recent_average, 1)
        * 100
    )

    frequency_score = clamp(
        short_term_change * 0.45
        + baseline_volatility * 0.75
    )

    if abnormal_meter_reading:
        frequency_score = min(
            frequency_score,
            60
        )

    frequency_score = round(
        clamp(frequency_score),
        2,
    )

    predictions.append(
        FailurePrediction(
            failure_type="Frequency Deviation",
            risk_score=frequency_score,
            risk_level=classify_risk(frequency_score),
            probability_percent=frequency_score,
            status=status_from_score(frequency_score),
            severity=severity_from_score(frequency_score),
            explanation=(
                f"Short-term consumption deviation is {short_term_change:.1f}% "
                f"with baseline volatility of {baseline_volatility:.1f}%. "
                "The system treats extreme meter readings as anomaly signals."
            ),
            recommended_action=(
                "Monitor frequency stability and verify the meter reading "
                "if demand changes sharply."
            ),
        )
    )

    return predictions


# =========================================================
# DATABASE INTEGRATION
# =========================================================

def predict_failures_from_database(
    db: Session,
) -> dict:

    energy_statement = (
        select(EnergyConsumption)
        .order_by(EnergyConsumption.timestamp.asc())
    )

    renewable_statement = (
        select(RenewableEnergy)
        .order_by(RenewableEnergy.timestamp.desc())
        .limit(1)
    )

    energy_records = list(
        db.scalars(energy_statement).all()
    )

    latest_renewable = db.scalar(
        renewable_statement
    )

    if not energy_records:
        raise ValueError(
            "No energy consumption records available."
        )

    if latest_renewable is None:
        raise ValueError(
            "No renewable energy records available."
        )

    historical_consumption = [
        float(record.consumption_kwh)
        for record in energy_records
        if record.consumption_kwh is not None
    ]

    if not historical_consumption:
        raise ValueError(
            "No valid consumption values available."
        )

    latest_energy = energy_records[-1]

    current_demand = float(
        latest_energy.consumption_kwh
    )

    predictions = calculate_failure_predictions(
        demand_kwh=current_demand,
        solar_kwh=float(
            latest_renewable.solar_production_kwh or 0
        ),
        wind_kwh=float(
            latest_renewable.wind_generation_kwh or 0
        ),
        battery_kwh=float(
            latest_renewable.battery_storage_kwh or 0
        ),
        historical_consumption=historical_consumption,
    )

    # =====================================================
    # SUMMARY
    # =====================================================

    overall_score = (
        sum(item.risk_score for item in predictions)
        / len(predictions)
    )

    overall_score = round(
        clamp(overall_score),
        2,
    )

    highest_risk = max(
        predictions,
        key=lambda item: item.risk_score
    )

    return {
        "overall_risk_score": overall_score,
        "overall_risk_level": classify_risk(overall_score),

        "highest_risk_failure": (
            highest_risk.failure_type
        ),

        "highest_risk_score": round(
            highest_risk.risk_score,
            2,
        ),

        "critical_count": sum(
            item.risk_level == "CRITICAL"
            for item in predictions
        ),

        "high_count": sum(
            item.risk_level == "HIGH"
            for item in predictions
        ),

        "medium_count": sum(
            item.risk_level == "MEDIUM"
            for item in predictions
        ),

        "low_count": sum(
            item.risk_level == "LOW"
            for item in predictions
        ),

        "anomaly_detection": True,

        "prediction_method": (
            "Telemetry-based anomaly detection with "
            "explainable multi-factor risk scoring"
        ),

        "input_context": {
            "current_consumption_kwh": round(
                current_demand,
                2,
            ),

            "historical_records": len(
                historical_consumption
            ),

            "solar_production_kwh": round(
                float(
                    latest_renewable.solar_production_kwh or 0
                ),
                2,
            ),

            "wind_generation_kwh": round(
                float(
                    latest_renewable.wind_generation_kwh or 0
                ),
                2,
            ),

            "battery_storage_kwh": round(
                float(
                    latest_renewable.battery_storage_kwh or 0
                ),
                2,
            ),
        },

        "predictions": [
            {
                "failure_type": item.failure_type,
                "risk_score": item.risk_score,
                "risk_level": item.risk_level,
                "probability_percent": item.probability_percent,
                "status": item.status,
                "severity": item.severity,
                "explanation": item.explanation,
                "recommended_action": item.recommended_action,
            }
            for item in predictions
        ],
    }