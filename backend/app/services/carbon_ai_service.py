from datetime import datetime
from typing import Dict, List

from sqlalchemy.orm import Session

from app.models.energy_consumption import EnergyConsumption
from app.models.renewable_energy import RenewableEnergy


# Prototype operational estimate.
# This can later be replaced with a region-specific grid factor.
GRID_CARBON_INTENSITY = 0.5


def _safe_percent(value: float, total: float) -> float:
    if total <= 0:
        return 0.0

    return round((value / total) * 100, 2)


def _calculate_metrics(
    demand: float,
    solar: float,
    wind: float,
    battery: float,
) -> Dict[str, float]:

    renewable = max(solar + wind, 0)

    renewable_contribution = _safe_percent(
        renewable,
        demand,
    )

    grid_energy = max(
        demand - renewable,
        0,
    )

    baseline_co2 = demand * GRID_CARBON_INTENSITY

    estimated_grid_co2 = (
        grid_energy * GRID_CARBON_INTENSITY
    )

    co2_avoided = max(
        baseline_co2 - estimated_grid_co2,
        0,
    )

    carbon_reduction = _safe_percent(
        co2_avoided,
        baseline_co2,
    )

    # Battery provides additional operational flexibility.
    battery_support = min(
        (battery / max(demand, 1)) * 20,
        20,
    )

    renewable_score = min(
        renewable_contribution,
        100,
    )

    efficiency_score = min(
        renewable_score + battery_support,
        100,
    )

    sustainability_score = round(
        (
            carbon_reduction * 0.45
            + renewable_contribution * 0.35
            + efficiency_score * 0.20
        ),
        2,
    )

    return {
        "demand_kwh": round(demand, 2),
        "solar_kwh": round(solar, 2),
        "wind_kwh": round(wind, 2),
        "renewable_kwh": round(renewable, 2),
        "battery_kwh": round(battery, 2),
        "grid_energy_kwh": round(grid_energy, 2),
        "baseline_co2_kg": round(
            baseline_co2,
            2,
        ),
        "estimated_grid_co2_kg": round(
            estimated_grid_co2,
            2,
        ),
        "co2_avoided_kg": round(
            co2_avoided,
            2,
        ),
        "carbon_reduction_percent": carbon_reduction,
        "renewable_contribution_percent": renewable_contribution,
        "energy_efficiency_score": round(
            efficiency_score,
            2,
        ),
        "sustainability_score": sustainability_score,
    }


def _scenario_adjustments(
    scenario: str,
    demand: float,
    solar: float,
    wind: float,
    battery: float,
) -> Dict[str, float]:

    scenario = scenario.lower().strip()

    values = {
        "demand": demand,
        "solar": solar,
        "wind": wind,
        "battery": battery,
    }

    if scenario == "solar_boost":
        values["solar"] = solar * 1.15

    elif scenario == "wind_boost":
        values["wind"] = wind * 1.15

    elif scenario == "renewable_boost":
        values["solar"] = solar * 1.10
        values["wind"] = wind * 1.10

    elif scenario == "battery_optimization":
        values["battery"] = battery * 1.30

    elif scenario == "peak_demand":
        values["demand"] = demand * 1.15

    elif scenario == "renewable_drop":
        values["solar"] = solar * 0.85
        values["wind"] = wind * 0.85

    return values


def _get_latest_telemetry(db: Session):

    energy_records = (
        db.query(EnergyConsumption)
        .order_by(
            EnergyConsumption.timestamp.desc()
        )
        .limit(24)
        .all()
    )

    renewable_records = (
        db.query(RenewableEnergy)
        .order_by(
            RenewableEnergy.timestamp.desc()
        )
        .limit(24)
        .all()
    )

    demand = sum(
        float(record.consumption_kwh or 0)
        for record in energy_records
    )

    # IMPORTANT:
    # Actual RenewableEnergy model field is
    # solar_production_kwh.
    solar = sum(
        float(record.solar_production_kwh or 0)
        for record in renewable_records
    )

    wind = sum(
        float(record.wind_generation_kwh or 0)
        for record in renewable_records
    )

    battery_values = [
        float(record.battery_storage_kwh or 0)
        for record in renewable_records
    ]

    battery = (
        sum(battery_values) / len(battery_values)
        if battery_values
        else 0
    )

    return {
        "demand": demand,
        "solar": solar,
        "wind": wind,
        "battery": battery,
        "energy_records": len(energy_records),
        "renewable_records": len(
            renewable_records
        ),
    }


def run_carbon_scenario(
    db: Session,
    scenario: str,
) -> Dict:

    telemetry = _get_latest_telemetry(db)

    baseline = _calculate_metrics(
        demand=telemetry["demand"],
        solar=telemetry["solar"],
        wind=telemetry["wind"],
        battery=telemetry["battery"],
    )

    adjusted = _scenario_adjustments(
        scenario=scenario,
        demand=telemetry["demand"],
        solar=telemetry["solar"],
        wind=telemetry["wind"],
        battery=telemetry["battery"],
    )

    projected = _calculate_metrics(
        demand=adjusted["demand"],
        solar=adjusted["solar"],
        wind=adjusted["wind"],
        battery=adjusted["battery"],
    )

    carbon_saving = round(
        baseline["estimated_grid_co2_kg"]
        - projected["estimated_grid_co2_kg"],
        2,
    )

    score_change = round(
        projected["sustainability_score"]
        - baseline["sustainability_score"],
        2,
    )

    return {
        "scenario": scenario,
        "generated_at": datetime.utcnow(),
        "baseline": baseline,
        "projected": projected,
        "expected_co2_saving_kg": max(
            carbon_saving,
            0,
        ),
        "sustainability_score_change": score_change,
        "energy_records": telemetry[
            "energy_records"
        ],
        "renewable_records": telemetry[
            "renewable_records"
        ],
    }


def get_ai_carbon_insights(db: Session) -> Dict:

    scenarios = [
        "solar_boost",
        "wind_boost",
        "renewable_boost",
        "battery_optimization",
    ]

    results: List[Dict] = []

    for scenario in scenarios:
        result = run_carbon_scenario(
            db,
            scenario,
        )

        results.append(result)

    best = max(
        results,
        key=lambda item: (
            item["projected"][
                "sustainability_score"
            ],
            item["expected_co2_saving_kg"],
        ),
    )

    projected = best["projected"]

    reasons = []

    if (
        projected[
            "renewable_contribution_percent"
        ]
        > best["baseline"][
            "renewable_contribution_percent"
        ]
    ):
        reasons.append(
            "Higher renewable contribution "
            "reduces dependence on grid energy."
        )

    if (
        projected[
            "carbon_reduction_percent"
        ]
        > best["baseline"][
            "carbon_reduction_percent"
        ]
    ):
        reasons.append(
            "Projected carbon reduction "
            "improves overall emissions performance."
        )

    if (
        projected[
            "energy_efficiency_score"
        ]
        > best["baseline"][
            "energy_efficiency_score"
        ]
    ):
        reasons.append(
            "Improved renewable and battery "
            "utilization increases the efficiency score."
        )

    if not reasons:
        reasons.append(
            "Current telemetry does not show "
            "a significant improvement over baseline."
        )

    return {
        "engine": (
            "Explainable Carbon Optimization Engine"
        ),
        "optimization_type": (
            "Multi-scenario carbon impact analysis"
        ),
        "recommended_scenario": best[
            "scenario"
        ],
        "expected_co2_saving_kg": best[
            "expected_co2_saving_kg"
        ],
        "sustainability_score_change": best[
            "sustainability_score_change"
        ],
        "baseline": best["baseline"],
        "recommended_projection": projected,
        "reasons": reasons,
        "scenarios_evaluated": [
            item["scenario"]
            for item in results
        ],
        "all_scenarios": results,
        "model_confidence": (
            "MEDIUM"
            if (
                best["energy_records"] >= 10
                and best["renewable_records"] >= 10
            )
            else "LOW"
        ),
        "generated_at": datetime.utcnow(),
    }