from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.energy_consumption import EnergyConsumption
from app.models.renewable_energy import RenewableEnergy


# Grid carbon intensity assumption:
# 0.5 kg CO2 per kWh of conventional grid electricity.
# This is an operational estimate for the GridPulse prototype,
# not a country-specific official emission factor.
GRID_CARBON_INTENSITY = 0.5


def _round(value: float, digits: int = 2) -> float:
    return round(float(value or 0), digits)


def _calculate_emissions(energy_kwh: float) -> float:
    """
    Estimate CO2 emissions from non-renewable grid electricity.

    Formula:
        emissions = energy * grid carbon intensity
    """
    return energy_kwh * GRID_CARBON_INTENSITY


def _calculate_efficiency_score(
    demand_kwh: float,
    renewable_kwh: float,
) -> float:
    """
    Calculate a simple sustainability-oriented efficiency score.

    The score combines renewable contribution and energy utilization.
    It is a calculated GridPulse indicator, not a certified grid metric.
    """

    if demand_kwh <= 0:
        return 0.0

    renewable_ratio = (
        renewable_kwh / demand_kwh
    ) * 100

    return _round(
        min(max(renewable_ratio, 0), 100)
    )


def get_carbon_intelligence_summary(
    db: Session,
) -> dict:
    """
    Generate the main Carbon Intelligence summary.

    Uses:
        - Energy consumption records
        - Renewable energy records

    Returns:
        - total energy demand
        - renewable generation
        - estimated baseline emissions
        - estimated actual emissions
        - estimated CO2 avoided
        - carbon reduction percentage
        - renewable contribution
        - efficiency score
        - sustainability score
    """

    energy_statement = select(EnergyConsumption).order_by(
        EnergyConsumption.timestamp.asc()
    )

    renewable_statement = select(RenewableEnergy).order_by(
        RenewableEnergy.timestamp.asc()
    )

    energy_records = list(
        db.scalars(energy_statement).all()
    )

    renewable_records = list(
        db.scalars(renewable_statement).all()
    )

    total_demand = sum(
        record.consumption_kwh
        for record in energy_records
    )

    total_solar = sum(
        record.solar_production_kwh
        for record in renewable_records
    )

    total_wind = sum(
        record.wind_generation_kwh
        for record in renewable_records
    )

    total_renewable = (
        total_solar + total_wind
    )

    # Renewable energy that can offset conventional generation.
    renewable_offset = min(
        total_renewable,
        total_demand,
    )

    baseline_emissions = _calculate_emissions(
        total_demand
    )

    actual_grid_energy = max(
        total_demand - renewable_offset,
        0,
    )

    actual_emissions = _calculate_emissions(
        actual_grid_energy
    )

    carbon_avoided = (
        baseline_emissions
        - actual_emissions
    )

    carbon_reduction_percent = (
        (
            carbon_avoided
            / baseline_emissions
        )
        * 100
        if baseline_emissions > 0
        else 0
    )

    renewable_contribution = (
        (
            renewable_offset
            / total_demand
        )
        * 100
        if total_demand > 0
        else 0
    )

    efficiency_score = _calculate_efficiency_score(
        total_demand,
        renewable_offset,
    )

    # Sustainability score combines:
    # 60% renewable contribution
    # 40% carbon reduction
    sustainability_score = (
        (renewable_contribution * 0.6)
        + (carbon_reduction_percent * 0.4)
    )

    sustainability_score = min(
        max(
            sustainability_score,
            0,
        ),
        100,
    )

    return {
        "total_energy_demand_kwh": _round(
            total_demand
        ),
        "total_solar_generation_kwh": _round(
            total_solar
        ),
        "total_wind_generation_kwh": _round(
            total_wind
        ),
        "total_renewable_generation_kwh": _round(
            total_renewable
        ),
        "renewable_contribution_percent": _round(
            renewable_contribution
        ),
        "baseline_co2_kg": _round(
            baseline_emissions
        ),
        "estimated_grid_co2_kg": _round(
            actual_emissions
        ),
        "estimated_co2_avoided_kg": _round(
            carbon_avoided
        ),
        "carbon_reduction_percent": _round(
            carbon_reduction_percent
        ),
        "energy_efficiency_score": _round(
            efficiency_score
        ),
        "sustainability_score": _round(
            sustainability_score
        ),
        "carbon_intensity_kg_per_kwh": GRID_CARBON_INTENSITY,
        "energy_records": len(
            energy_records
        ),
        "renewable_records": len(
            renewable_records
        ),
        "generated_at": datetime.utcnow(),
    }


def get_carbon_intelligence_trend(
    db: Session,
) -> list[dict]:
    """
    Generate daily carbon intelligence trend.

    Each day contains:
        - energy demand
        - solar generation
        - wind generation
        - renewable generation
        - estimated emissions
        - estimated CO2 avoided
        - carbon reduction percentage
    """

    energy_statement = select(EnergyConsumption).order_by(
        EnergyConsumption.timestamp.asc()
    )

    renewable_statement = select(RenewableEnergy).order_by(
        RenewableEnergy.timestamp.asc()
    )

    energy_records = list(
        db.scalars(energy_statement).all()
    )

    renewable_records = list(
        db.scalars(renewable_statement).all()
    )

    daily_data: dict[str, dict] = {}

    for record in energy_records:
        day = record.timestamp.date().isoformat()

        if day not in daily_data:
            daily_data[day] = {
                "date": day,
                "energy_demand_kwh": 0.0,
                "solar_generation_kwh": 0.0,
                "wind_generation_kwh": 0.0,
            }

        daily_data[day][
            "energy_demand_kwh"
        ] += record.consumption_kwh

    for record in renewable_records:
        day = record.timestamp.date().isoformat()

        if day not in daily_data:
            daily_data[day] = {
                "date": day,
                "energy_demand_kwh": 0.0,
                "solar_generation_kwh": 0.0,
                "wind_generation_kwh": 0.0,
            }

        daily_data[day][
            "solar_generation_kwh"
        ] += record.solar_production_kwh

        daily_data[day][
            "wind_generation_kwh"
        ] += record.wind_generation_kwh

    result = []

    for day in sorted(daily_data.keys()):
        data = daily_data[day]

        demand = data[
            "energy_demand_kwh"
        ]

        solar = data[
            "solar_generation_kwh"
        ]

        wind = data[
            "wind_generation_kwh"
        ]

        renewable = solar + wind

        renewable_offset = min(
            renewable,
            demand,
        )

        baseline_emissions = _calculate_emissions(
            demand
        )

        actual_grid_energy = max(
            demand - renewable_offset,
            0,
        )

        estimated_emissions = _calculate_emissions(
            actual_grid_energy
        )

        co2_avoided = (
            baseline_emissions
            - estimated_emissions
        )

        reduction_percent = (
            (
                co2_avoided
                / baseline_emissions
            )
            * 100
            if baseline_emissions > 0
            else 0
        )

        renewable_percent = (
            (
                renewable_offset
                / demand
            )
            * 100
            if demand > 0
            else 0
        )

        result.append(
            {
                "date": day,
                "energy_demand_kwh": _round(
                    demand
                ),
                "solar_generation_kwh": _round(
                    solar
                ),
                "wind_generation_kwh": _round(
                    wind
                ),
                "renewable_generation_kwh": _round(
                    renewable
                ),
                "baseline_co2_kg": _round(
                    baseline_emissions
                ),
                "estimated_co2_kg": _round(
                    estimated_emissions
                ),
                "co2_avoided_kg": _round(
                    co2_avoided
                ),
                "carbon_reduction_percent": _round(
                    reduction_percent
                ),
                "renewable_contribution_percent": _round(
                    renewable_percent
                ),
            }
        )

    return result


def get_sustainability_analysis(
    db: Session,
) -> dict:
    """
    Generate sustainability analysis and AI-style
    operational recommendations.
    """

    summary = get_carbon_intelligence_summary(
        db
    )

    renewable_contribution = summary[
        "renewable_contribution_percent"
    ]

    carbon_reduction = summary[
        "carbon_reduction_percent"
    ]

    efficiency_score = summary[
        "energy_efficiency_score"
    ]

    sustainability_score = summary[
        "sustainability_score"
    ]

    recommendations = []

    if renewable_contribution < 30:
        recommendations.append(
            "Increase renewable energy utilization "
            "to reduce dependency on conventional grid generation."
        )
    elif renewable_contribution < 60:
        recommendations.append(
            "Increase solar and wind integration during "
            "high-demand periods."
        )
    else:
        recommendations.append(
            "Maintain high renewable utilization and "
            "prioritize renewable-first dispatch."
        )

    if carbon_reduction < 20:
        recommendations.append(
            "Prioritize low-carbon energy sources and "
            "reduce conventional grid dependency."
        )
    elif carbon_reduction < 50:
        recommendations.append(
            "Use renewable generation and battery storage "
            "more aggressively during suitable periods."
        )
    else:
        recommendations.append(
            "Current renewable utilization is producing "
            "strong estimated carbon savings."
        )

    if efficiency_score < 40:
        recommendations.append(
            "Improve energy utilization and demand-side "
            "management during high-load periods."
        )
    elif efficiency_score < 70:
        recommendations.append(
            "Optimize renewable allocation against demand "
            "to improve system efficiency."
        )
    else:
        recommendations.append(
            "Maintain current renewable-to-demand utilization "
            "performance."
        )

    if sustainability_score >= 80:
        sustainability_status = "EXCELLENT"
    elif sustainability_score >= 60:
        sustainability_status = "GOOD"
    elif sustainability_score >= 40:
        sustainability_status = "MODERATE"
    else:
        sustainability_status = "NEEDS IMPROVEMENT"

    return {
        "sustainability_score": sustainability_score,
        "sustainability_status": sustainability_status,
        "renewable_contribution_percent": renewable_contribution,
        "carbon_reduction_percent": carbon_reduction,
        "energy_efficiency_score": efficiency_score,
        "estimated_co2_avoided_kg": summary[
            "estimated_co2_avoided_kg"
        ],
        "recommendations": recommendations,
        "analysis_method": (
            "Rule-based sustainability analysis using "
            "GridPulse energy and renewable telemetry."
        ),
        "generated_at": datetime.utcnow(),
    }


def get_sustainability_report(
    db: Session,
) -> dict:
    """
    Generate a complete sustainability report.

    This endpoint-ready report combines:
        - carbon performance
        - renewable performance
        - efficiency
        - sustainability score
        - recommendations
    """

    summary = get_carbon_intelligence_summary(
        db
    )

    sustainability = get_sustainability_analysis(
        db
    )

    trend = get_carbon_intelligence_trend(
        db
    )

    total_battery_storage = 0.0

    renewable_statement = select(
        RenewableEnergy
    ).order_by(
        RenewableEnergy.timestamp.asc()
    )

    renewable_records = list(
        db.scalars(
            renewable_statement
        ).all()
    )

    if renewable_records:
        total_battery_storage = sum(
            record.battery_storage_kwh
            for record in renewable_records
        ) / len(renewable_records)

    return {
        "report_title": (
            "GridPulse Carbon & Sustainability Report"
        ),
        "report_generated_at": datetime.utcnow(),
        "reporting_records": {
            "energy_records": summary[
                "energy_records"
            ],
            "renewable_records": summary[
                "renewable_records"
            ],
        },
        "carbon_performance": {
            "baseline_co2_kg": summary[
                "baseline_co2_kg"
            ],
            "estimated_grid_co2_kg": summary[
                "estimated_grid_co2_kg"
            ],
            "estimated_co2_avoided_kg": summary[
                "estimated_co2_avoided_kg"
            ],
            "carbon_reduction_percent": summary[
                "carbon_reduction_percent"
            ],
            "carbon_intensity_kg_per_kwh": summary[
                "carbon_intensity_kg_per_kwh"
            ],
        },
        "renewable_performance": {
            "solar_generation_kwh": summary[
                "total_solar_generation_kwh"
            ],
            "wind_generation_kwh": summary[
                "total_wind_generation_kwh"
            ],
            "total_renewable_generation_kwh": summary[
                "total_renewable_generation_kwh"
            ],
            "renewable_contribution_percent": summary[
                "renewable_contribution_percent"
            ],
            "average_battery_storage_kwh": _round(
                total_battery_storage
            ),
        },
        "efficiency": {
            "energy_efficiency_score": summary[
                "energy_efficiency_score"
            ],
            "sustainability_score": sustainability[
                "sustainability_score"
            ],
            "sustainability_status": sustainability[
                "sustainability_status"
            ],
        },
        "recommendations": sustainability[
            "recommendations"
        ],
        "trend": trend,
        "report_method": (
            "Calculated sustainability report using "
            "GridPulse telemetry and a configurable grid "
            "carbon-intensity factor."
        ),
    }