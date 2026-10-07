from dataclasses import dataclass
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.energy_consumption import EnergyConsumption
from app.models.renewable_energy import RenewableEnergy


@dataclass
class EmergencyAssessment:
    emergency_level: str
    emergency_score: float
    system_status: str
    primary_issue: str
    recommended_action: str
    backup_action: str
    affected_area: str


def classify_emergency(score: float):
    if score >= 80:
        return "CRITICAL", "EMERGENCY"
    elif score >= 60:
        return "HIGH", "AT RISK"
    elif score >= 35:
        return "MEDIUM", "WATCH"
    return "LOW", "STABLE"


def assess_emergency(
    demand_kwh: float,
    renewable_kwh: float,
    battery_kwh: float,
):
    renewable_ratio = (
        renewable_kwh / demand_kwh
        if demand_kwh > 0
        else 0
    )

    score = 0.0

    # Demand stress
    if demand_kwh >= 250:
        score += 40
    elif demand_kwh >= 150:
        score += 25
    elif demand_kwh >= 100:
        score += 15
    else:
        score += 5

    # Renewable availability
    if renewable_ratio < 0.30:
        score += 30
    elif renewable_ratio < 0.60:
        score += 20
    elif renewable_ratio < 1.0:
        score += 10

    # Battery reserve
    if battery_kwh < 10:
        score += 25
    elif battery_kwh < 30:
        score += 15
    elif battery_kwh < 50:
        score += 5

    score = round(min(score, 100), 2)

    emergency_level, system_status = classify_emergency(score)

    if score >= 80:
        primary_issue = "Severe grid stress detected."
        recommended_action = (
            "Activate emergency response protocol and prioritize "
            "critical loads."
        )
        backup_action = (
            "Use battery reserve and available renewable generation "
            "while preparing controlled load reduction."
        )
        affected_area = "Grid-wide"
    
    elif score >= 60:
        primary_issue = "High operational stress detected."
        recommended_action = (
            "Redistribute demand and increase renewable utilization."
        )
        backup_action = (
            "Prepare battery-backed supply for critical loads."
        )
        affected_area = "High-load network zones"

    elif score >= 35:
        primary_issue = "Moderate operational risk detected."
        recommended_action = (
            "Monitor demand closely and maintain sufficient reserve."
        )
        backup_action = (
            "Keep backup generation and storage resources available."
        )
        affected_area = "Potentially affected load zones"

    else:
        primary_issue = "No immediate emergency condition detected."
        recommended_action = (
            "Continue normal grid operation with active monitoring."
        )
        backup_action = (
            "Maintain renewable and battery resources as contingency reserve."
        )
        affected_area = "No immediate impact"

    return EmergencyAssessment(
        emergency_level=emergency_level,
        emergency_score=score,
        system_status=system_status,
        primary_issue=primary_issue,
        recommended_action=recommended_action,
        backup_action=backup_action,
        affected_area=affected_area,
    )


def get_emergency_response(db: Session):

    energy_statement = (
        select(EnergyConsumption)
        .order_by(EnergyConsumption.timestamp.desc())
        .limit(1)
    )

    renewable_statement = (
        select(RenewableEnergy)
        .order_by(RenewableEnergy.timestamp.desc())
        .limit(1)
    )

    latest_energy = db.scalar(energy_statement)
    latest_renewable = db.scalar(renewable_statement)

    if latest_energy is None:
        raise ValueError("No energy telemetry available.")

    if latest_renewable is None:
        raise ValueError("No renewable telemetry available.")

    demand_kwh = float(latest_energy.consumption_kwh or 0)

    solar_kwh = float(
        latest_renewable.solar_production_kwh or 0
    )

    wind_kwh = float(
        latest_renewable.wind_generation_kwh or 0
    )

    battery_kwh = float(
        latest_renewable.battery_storage_kwh or 0
    )

    renewable_kwh = solar_kwh + wind_kwh

    assessment = assess_emergency(
        demand_kwh=demand_kwh,
        renewable_kwh=renewable_kwh,
        battery_kwh=battery_kwh,
    )

    if renewable_kwh >= demand_kwh:
        power_strategy = "RENEWABLE-FIRST"
    elif battery_kwh > 0:
        power_strategy = "BATTERY-BACKUP"
    else:
        power_strategy = "GRID-SUPPORT"

    response_steps = [
        "OBSERVE: Read latest demand, renewable and battery telemetry.",
        f"ASSESS: Current demand = {demand_kwh:.2f} kWh.",
        f"ANALYZE: Available renewable generation = {renewable_kwh:.2f} kWh.",
        f"CHECK: Battery reserve = {battery_kwh:.2f} kWh.",
        f"RISK: Emergency score = {assessment.emergency_score:.2f}/100.",
        f"DECIDE: System classified as {assessment.emergency_level}.",
        f"RESPOND: Activate {power_strategy} operating strategy.",
    ]

    return {
        "emergency_level": assessment.emergency_level,
        "emergency_score": assessment.emergency_score,
        "system_status": assessment.system_status,

        "primary_issue": assessment.primary_issue,
        "recommended_action": assessment.recommended_action,
        "backup_action": assessment.backup_action,
        "affected_area": assessment.affected_area,

        "power_strategy": power_strategy,

        "telemetry": {
            "demand_kwh": round(demand_kwh, 2),
            "solar_kwh": round(solar_kwh, 2),
            "wind_kwh": round(wind_kwh, 2),
            "renewable_generation_kwh": round(renewable_kwh, 2),
            "battery_storage_kwh": round(battery_kwh, 2),
        },

        "response_protocol": response_steps,

        "automation_enabled": True,
        "response_method": (
            "Telemetry-driven emergency assessment and "
            "deterministic response policy"
        ),
    }