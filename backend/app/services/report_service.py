from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.energy_consumption import EnergyConsumption
from app.models.forecast_result import ForecastResult
from app.models.renewable_energy import RenewableEnergy
from app.models.weather_data import WeatherData

from app.services.forecast_evaluation_service import (
    evaluate_forecast_model,
)

from app.services.carbon_intelligence_service import (
    get_carbon_intelligence_summary,
    get_sustainability_analysis,
)

from app.services.carbon_ai_service import (
    get_ai_carbon_insights,
)


# ---------------------------------------------------------
# HELPERS
# ---------------------------------------------------------


def _safe_float(
    value: Any,
    default: float = 0.0,
) -> float:
    try:
        if value is None:
            return default

        return float(value)

    except (TypeError, ValueError):
        return default


def _round(
    value: Any,
    decimals: int = 2,
) -> float:
    return round(
        _safe_float(value),
        decimals,
    )


def _percentage_status(
    value: float,
) -> str:

    if value >= 70:
        return "GOOD"

    if value >= 40:
        return "MODERATE"

    return "LOW"


def _demand_status(
    average_demand: float,
    peak_demand: float,
) -> str:

    if average_demand <= 0:
        return "NO DATA"

    ratio = peak_demand / average_demand

    if ratio >= 1.50:
        return "HIGH VARIATION"

    if ratio >= 1.20:
        return "MODERATE VARIATION"

    return "STABLE"


def _forecast_status(
    r2_score: float,
) -> str:

    if r2_score >= 0.90:
        return "EXCELLENT"

    if r2_score >= 0.75:
        return "GOOD"

    if r2_score >= 0.50:
        return "MODERATE"

    return "NEEDS ATTENTION"


# ---------------------------------------------------------
# ENERGY PERFORMANCE
# ---------------------------------------------------------


def _get_energy_performance(
    db: Session,
) -> dict:

    records = (
        db.query(EnergyConsumption)
        .order_by(
            EnergyConsumption.timestamp.asc()
        )
        .all()
    )

    values = [
        _safe_float(
            record.consumption_kwh
        )
        for record in records
    ]

    if not values:
        return {
            "total_demand_kwh": 0.0,
            "average_demand_kwh": 0.0,
            "peak_demand_kwh": 0.0,
            "energy_records": 0,
        }

    total = sum(values)

    average = total / len(values)

    peak = max(values)

    return {
        "total_demand_kwh": _round(total),
        "average_demand_kwh": _round(average),
        "peak_demand_kwh": _round(peak),
        "energy_records": len(values),
    }


# ---------------------------------------------------------
# FORECAST PERFORMANCE
# ---------------------------------------------------------

def _get_forecast_performance(db: Session) -> dict:
    energy_records = (
        db.query(EnergyConsumption)
        .order_by(EnergyConsumption.timestamp.asc())
        .all()
    )

    weather_records = (
        db.query(WeatherData)
        .order_by(WeatherData.timestamp.asc())
        .all()
    )

    if len(energy_records) < 10 or not weather_records:
        return {
            "model_name": "RandomForest",
            "model_version": "1.0",
            "mae": 0.0,
            "rmse": 0.0,
            "r2_score": 0.0,
            "evaluation_status": "UNAVAILABLE",
        }

    try:
        evaluation = evaluate_forecast_model(
            energy_records,
            weather_records,
        )

        # evaluate_forecast_model returns a dictionary.
        # Read the actual values from that dictionary.
        mae = _safe_float(evaluation.get("mae", 0.0))
        rmse = _safe_float(evaluation.get("rmse", 0.0))
        r2_score_value = _safe_float(
            evaluation.get("r2_score", 0.0)
        )

        return {
            "model_name": "RandomForest",
            "model_version": "1.0",
            "mae": _round(mae),
            "rmse": _round(rmse),
            "r2_score": _round(r2_score_value, 4),
            "evaluation_status": _forecast_status(
                r2_score_value
            ),
        }

    except Exception as exc:
        print(
            f"REPORT FORECAST EVALUATION ERROR: {exc}"
        )

        return {
            "model_name": "RandomForest",
            "model_version": "1.0",
            "mae": 0.0,
            "rmse": 0.0,
            "r2_score": 0.0,
            "evaluation_status": "UNAVAILABLE",
        }
# ---------------------------------------------------------
# RENEWABLE PERFORMANCE
# ---------------------------------------------------------


def _get_renewable_performance(
    db: Session,
) -> dict:

    records = (
        db.query(RenewableEnergy)
        .order_by(
            RenewableEnergy.timestamp.asc()
        )
        .all()
    )

    if not records:
        return {
            "solar_generation_kwh": 0.0,
            "wind_generation_kwh": 0.0,
            "total_renewable_generation_kwh": 0.0,
            "renewable_contribution_percent": 0.0,
            "average_battery_storage_kwh": 0.0,
        }

    solar = sum(
        _safe_float(
            record.solar_production_kwh
        )
        for record in records
    )

    wind = sum(
        _safe_float(
            record.wind_generation_kwh
        )
        for record in records
    )

    battery_values = [
        _safe_float(
            record.battery_storage_kwh
        )
        for record in records
    ]

    battery_average = (
        sum(battery_values)
        / len(battery_values)
        if battery_values
        else 0.0
    )

    renewable = solar + wind

    energy_records = (
        db.query(EnergyConsumption)
        .all()
    )

    demand = sum(
        _safe_float(
            record.consumption_kwh
        )
        for record in energy_records
    )

    renewable_contribution = (
        (renewable / demand) * 100
        if demand > 0
        else 0.0
    )

    return {
        "solar_generation_kwh": _round(
            solar
        ),
        "wind_generation_kwh": _round(
            wind
        ),
        "total_renewable_generation_kwh": _round(
            renewable
        ),
        "renewable_contribution_percent": _round(
            min(
                renewable_contribution,
                100,
            )
        ),
        "average_battery_storage_kwh": _round(
            battery_average
        ),
    }


# ---------------------------------------------------------
# GRID PERFORMANCE
# ---------------------------------------------------------


def _get_grid_performance(
    energy: dict,
    renewable: dict,
    carbon: dict,
) -> dict:

    demand_status = _demand_status(
        energy[
            "average_demand_kwh"
        ],
        energy[
            "peak_demand_kwh"
        ],
    )

    renewable_status = _percentage_status(
        renewable[
            "renewable_contribution_percent"
        ]
    )

    battery = renewable[
        "average_battery_storage_kwh"
    ]

    if battery >= 50:
        storage_status = "HEALTHY"

    elif battery > 0:
        storage_status = "AVAILABLE"

    else:
        storage_status = "LOW"

    sustainability_score = carbon[
        "sustainability_score"
    ]

    if sustainability_score >= 75:
        grid_status = "OPTIMAL"

    elif sustainability_score >= 50:
        grid_status = "STABLE"

    elif sustainability_score > 0:
        grid_status = "MONITOR"

    else:
        grid_status = "NO DATA"

    return {
        "grid_status": grid_status,
        "demand_status": demand_status,
        "renewable_status": renewable_status,
        "storage_status": storage_status,
    }


# ---------------------------------------------------------
# AI INSIGHTS
# ---------------------------------------------------------


def _build_ai_insights(
    energy: dict,
    renewable: dict,
    carbon: dict,
    ai: dict,
) -> list[str]:

    insights = []

    renewable_percent = renewable[
        "renewable_contribution_percent"
    ]

    sustainability_score = carbon[
        "sustainability_score"
    ]

    carbon_reduction = carbon[
        "carbon_reduction_percent"
    ]

    # Renewable contribution insight
    if renewable_percent >= 70:

        insights.append(
            "Renewable generation is providing "
            "a strong share of current energy demand."
        )

    elif renewable_percent >= 40:

        insights.append(
            "Renewable generation provides a "
            "moderate share of current energy demand."
        )

    else:

        insights.append(
            "GridPulse should prioritize increasing "
            "renewable energy utilization."
        )

    # Carbon reduction insight
    if carbon_reduction > 0:

        insights.append(
            f"Current renewable utilization is estimated "
            f"to avoid {_round(carbon_reduction)}% of baseline "
            "carbon emissions."
        )

    # Sustainability insight
    if sustainability_score >= 75:

        insights.append(
            "Overall sustainability performance "
            "is currently strong."
        )

    elif sustainability_score >= 50:

        insights.append(
            "Sustainability performance is stable "
            "but has room for operational improvement."
        )

    else:

        insights.append(
            "Sustainability performance requires "
            "additional optimization."
        )

    # AI recommendation insight
    recommended = ai.get(
        "recommended_scenario"
    )

    if recommended:

        scenario_name = (
            str(recommended)
            .replace("_", " ")
            .title()
        )

        insights.append(
            "The Explainable Carbon Optimization "
            f"Engine currently recommends {scenario_name}."
        )

    # Peak demand insight
    if (
        energy["peak_demand_kwh"] > 0
        and energy["average_demand_kwh"] > 0
        and energy["peak_demand_kwh"]
        > energy["average_demand_kwh"] * 1.5
    ):

        insights.append(
            "Peak demand is significantly higher "
            "than average demand and should be monitored."
        )

    return insights


# ---------------------------------------------------------
# RECOMMENDATIONS
# ---------------------------------------------------------


def _build_recommendations(
    energy: dict,
    renewable: dict,
    carbon: dict,
    ai: dict,
) -> list[dict]:

    recommendations = []

    renewable_percent = renewable[
        "renewable_contribution_percent"
    ]

    battery = renewable[
        "average_battery_storage_kwh"
    ]

    sustainability_score = carbon[
        "sustainability_score"
    ]

    # Renewable recommendation
    if renewable_percent < 50:

        recommendations.append(
            {
                "priority": "HIGH",
                "category": "Renewable Energy",
                "recommendation": (
                    "Increase renewable generation "
                    "utilization to reduce dependence "
                    "on conventional grid supply."
                ),
            }
        )

    # Battery recommendation
    if (
        battery < 50
        and battery > 0
    ):

        recommendations.append(
            {
                "priority": "MEDIUM",
                "category": "Energy Storage",
                "recommendation": (
                    "Optimize battery charging and "
                    "discharge cycles to improve "
                    "renewable energy flexibility."
                ),
            }
        )

    # Peak demand recommendation
    if (
        energy["peak_demand_kwh"] > 0
        and energy["average_demand_kwh"] > 0
        and energy["peak_demand_kwh"]
        > energy["average_demand_kwh"] * 1.5
    ):

        recommendations.append(
            {
                "priority": "HIGH",
                "category": "Demand Management",
                "recommendation": (
                    "Monitor peak demand periods and "
                    "apply load-shifting or "
                    "demand-response strategies."
                ),
            }
        )

    # Sustainability recommendation
    if sustainability_score < 70:

        recommendations.append(
            {
                "priority": "MEDIUM",
                "category": "Sustainability",
                "recommendation": (
                    "Use GridPulse carbon optimization "
                    "scenarios to identify operational "
                    "improvements."
                ),
            }
        )

    # AI recommendation
    recommended = ai.get(
        "recommended_scenario"
    )

    if recommended:

        scenario_name = (
            str(recommended)
            .replace("_", " ")
            .title()
        )

        recommendations.append(
            {
                "priority": "AI",
                "category": "AI Optimization",
                "recommendation": (
                    f"Evaluate the AI-recommended "
                    f"{scenario_name} scenario before "
                    "operational decision-making."
                ),
            }
        )

    # Default recommendation
    if not recommendations:

        recommendations.append(
            {
                "priority": "LOW",
                "category": "Monitoring",
                "recommendation": (
                    "Continue monitoring grid performance "
                    "through GridPulse intelligence modules."
                ),
            }
        )

    return recommendations


# ---------------------------------------------------------
# MAIN EXECUTIVE REPORT
# ---------------------------------------------------------


def get_executive_report(
    db: Session,
) -> dict:

    # -----------------------------------------------------
    # Collect core performance data
    # -----------------------------------------------------

    energy = _get_energy_performance(
        db
    )

    forecast = _get_forecast_performance(
        db
    )

    renewable = _get_renewable_performance(
        db
    )

    # -----------------------------------------------------
    # Carbon Intelligence
    # -----------------------------------------------------

    carbon_summary = (
        get_carbon_intelligence_summary(
            db
        )
    )

    sustainability = (
        get_sustainability_analysis(
            db
        )
    )

    # -----------------------------------------------------
    # AI Carbon Optimization
    # -----------------------------------------------------

    ai = get_ai_carbon_insights(
        db
    )

    # -----------------------------------------------------
    # Carbon performance
    # -----------------------------------------------------

    carbon = {
        "baseline_co2_kg": _round(
            carbon_summary[
                "baseline_co2_kg"
            ]
        ),
        "estimated_grid_co2_kg": _round(
            carbon_summary[
                "estimated_grid_co2_kg"
            ]
        ),
        "co2_avoided_kg": _round(
            carbon_summary[
                "estimated_co2_avoided_kg"
            ]
        ),
        "carbon_reduction_percent": _round(
            carbon_summary[
                "carbon_reduction_percent"
            ]
        ),
        "sustainability_score": _round(
            sustainability[
                "sustainability_score"
            ]
        ),
    }

    # -----------------------------------------------------
    # Grid performance
    # -----------------------------------------------------

    grid = _get_grid_performance(
        energy,
        renewable,
        carbon,
    )

    # -----------------------------------------------------
    # AI insights
    # -----------------------------------------------------

    ai_insights = _build_ai_insights(
        energy,
        renewable,
        carbon,
        ai,
    )

    # -----------------------------------------------------
    # Recommendations
    # -----------------------------------------------------

    recommendations = _build_recommendations(
        energy,
        renewable,
        carbon,
        ai,
    )

    # -----------------------------------------------------
    # Overall executive score
    # -----------------------------------------------------

    forecast_score = (
        forecast["r2_score"] * 100
    )

    grid_score = (
        100
        if grid["grid_status"] == "OPTIMAL"
        else 75
        if grid["grid_status"] == "STABLE"
        else 50
        if grid["grid_status"] == "MONITOR"
        else 0
    )

    overall_score = _round(
        (
            carbon[
                "sustainability_score"
            ] * 0.40
            + renewable[
                "renewable_contribution_percent"
            ] * 0.25
            + forecast_score * 0.20
            + grid_score * 0.15
        )
    )

    # -----------------------------------------------------
    # Overall status
    # -----------------------------------------------------

    if overall_score >= 80:

        overall_status = "EXCELLENT"

    elif overall_score >= 65:

        overall_status = "GOOD"

    elif overall_score >= 50:

        overall_status = "STABLE"

    else:

        overall_status = "NEEDS ATTENTION"

    # -----------------------------------------------------
    # KPI cards
    # -----------------------------------------------------

    renewable_kpi_status = (
        "GOOD"
        if renewable[
            "renewable_contribution_percent"
        ] >= 50
        else "MONITOR"
    )

    sustainability_kpi_status = (
        "EXCELLENT"
        if carbon[
            "sustainability_score"
        ] >= 80
        else "GOOD"
        if carbon[
            "sustainability_score"
        ] >= 60
        else "MONITOR"
    )

    kpis = [
        {
            "label": "Total Energy Demand",
            "value": (
                f"{energy['total_demand_kwh']:,.2f} kWh"
            ),
            "status": "NORMAL",
        },
        {
            "label": "Renewable Generation",
            "value": (
                f"{renewable['total_renewable_generation_kwh']:,.2f} kWh"
            ),
            "status": renewable_kpi_status,
        },
        {
            "label": "CO₂ Avoided",
            "value": (
                f"{carbon['co2_avoided_kg']:,.2f} kg"
            ),
            "status": (
                "GOOD"
                if carbon[
                    "co2_avoided_kg"
                ] > 0
                else "MONITOR"
            ),
        },
        {
            "label": "Sustainability Score",
            "value": (
                f"{carbon['sustainability_score']:.2f}/100"
            ),
            "status": sustainability_kpi_status,
        },
    ]

    # -----------------------------------------------------
    # Data quality
    # -----------------------------------------------------

    forecast_records = db.query(
        ForecastResult
    ).count()

    renewable_records = db.query(
        RenewableEnergy
    ).count()

    data_quality = {
        "energy_records": energy[
            "energy_records"
        ],
        "forecast_records": forecast_records,
        "renewable_records": renewable_records,
        "carbon_records": carbon_summary[
            "energy_records"
        ],
        "status": (
            "GOOD"
            if (
                energy[
                    "energy_records"
                ] > 0
                and renewable[
                    "total_renewable_generation_kwh"
                ] > 0
            )
            else "LIMITED"
        ),
    }

    # -----------------------------------------------------
    # Final executive report
    # -----------------------------------------------------

    return {
        "report_title": (
            "GridPulse Executive Intelligence Report"
        ),
        "generated_at": datetime.utcnow(),

        "overall_status": overall_status,
        "overall_score": overall_score,

        "kpis": kpis,

        "energy_performance": energy,

        "forecast_performance": forecast,

        "renewable_performance": renewable,

        "carbon_performance": carbon,

        "grid_performance": grid,

        "ai_insights": ai_insights,

        "recommendations": recommendations,

        "data_quality": data_quality,
    }