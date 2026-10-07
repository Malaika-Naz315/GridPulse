from dataclasses import dataclass
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.energy_consumption import EnergyConsumption
from app.models.renewable_energy import RenewableEnergy


@dataclass
class GridOptimizationResult:
    # Existing fields — frontend compatibility
    demand_kwh: float
    solar_kwh: float
    wind_kwh: float
    renewable_generation_kwh: float
    battery_storage_kwh: float
    renewable_coverage_percent: float
    grid_import_kwh: float
    battery_action: str
    recommended_action: str
    grid_status: str

    # New AI / intelligence fields
    surplus_kwh: float
    energy_gap_kwh: float

    risk_score: float
    risk_level: str
    demand_risk: str
    renewable_risk: str
    battery_risk: str
    grid_dependency_risk: str

    optimization_score: float
    optimization_method: str

    autonomous_decision: str
    decision_reason: str

    decision_trace: list[str]
    explanation: list[str]


def optimize_grid(
    demand_kwh: float,
    solar_kwh: float,
    wind_kwh: float,
    battery_storage_kwh: float,
) -> GridOptimizationResult:
    """
    AI-assisted grid optimization engine.

    The engine automatically:
    - prioritizes renewable energy
    - minimizes grid import
    - manages battery usage
    - detects operational risk
    - generates an autonomous decision
    - provides an explainable decision trace

    This is a deterministic optimization/policy engine.
    It is intentionally not labelled as a trained RL or GNN model.
    """

    # ---------------------------------------------------------
    # 1. Input validation
    # ---------------------------------------------------------

    if demand_kwh <= 0:
        raise ValueError("Demand must be greater than zero.")

    if solar_kwh < 0:
        raise ValueError("Solar production cannot be negative.")

    if wind_kwh < 0:
        raise ValueError("Wind generation cannot be negative.")

    if battery_storage_kwh < 0:
        raise ValueError("Battery storage cannot be negative.")

    # ---------------------------------------------------------
    # 2. Current grid state
    # ---------------------------------------------------------

    renewable_generation = solar_kwh + wind_kwh

    renewable_coverage = (
        renewable_generation / demand_kwh
    ) * 100

    surplus = max(
        renewable_generation - demand_kwh,
        0.0,
    )

    energy_gap = max(
        demand_kwh - renewable_generation,
        0.0,
    )

    # ---------------------------------------------------------
    # 3. Risk Intelligence
    # ---------------------------------------------------------

    # Demand risk
    if demand_kwh >= 200:
        demand_risk = "HIGH"
    elif demand_kwh >= 100:
        demand_risk = "MEDIUM"
    else:
        demand_risk = "LOW"

    # Renewable risk
    renewable_ratio = renewable_generation / demand_kwh

    if renewable_ratio < 0.30:
        renewable_risk = "HIGH"
    elif renewable_ratio < 0.70:
        renewable_risk = "MEDIUM"
    else:
        renewable_risk = "LOW"

    # Battery risk
    if battery_storage_kwh < 10:
        battery_risk = "HIGH"
    elif battery_storage_kwh < 30:
        battery_risk = "MEDIUM"
    else:
        battery_risk = "LOW"

    # Grid dependency risk will be determined after optimization.

    # ---------------------------------------------------------
    # 4. Optimization policy
    # ---------------------------------------------------------

    decision_trace = [
        "OBSERVE: Read latest demand, renewable generation and battery telemetry.",
    ]

    explanation = []

    # Case A — renewable energy can fully satisfy demand
    if renewable_generation >= demand_kwh:

        grid_import = 0.0

        decision_trace.append(
            "ANALYZE: Renewable generation is sufficient to satisfy current demand."
        )

        if surplus > 5:

            battery_action = (
                f"Charge battery using approximately "
                f"{surplus:.2f} kWh surplus renewable energy."
            )

            autonomous_decision = "USE_RENEWABLE_AND_CHARGE_BATTERY"

            decision_reason = (
                "Renewable generation exceeds demand, creating surplus energy "
                "that can be stored instead of importing from the grid."
            )

            explanation = [
                "Renewable generation is sufficient for current demand.",
                "Main-grid import can be avoided.",
                f"{surplus:.2f} kWh renewable surplus is available.",
                "Battery charging is selected to improve renewable utilization.",
            ]

            decision_trace.append(
                f"OPTIMIZE: Detected {surplus:.2f} kWh renewable surplus."
            )

            decision_trace.append(
                "DECIDE: Prioritize renewable demand coverage and battery charging."
            )

        else:

            battery_action = (
                "Maintain battery state and use renewable energy "
                "for current demand."
            )

            autonomous_decision = "USE_RENEWABLE"

            decision_reason = (
                "Renewable generation covers demand with limited surplus, "
                "so battery state should be maintained."
            )

            explanation = [
                "Renewable generation covers current demand.",
                "Grid import is unnecessary.",
                "Surplus is too small for aggressive battery charging.",
                "Battery state is preserved.",
            ]

            decision_trace.append(
                "OPTIMIZE: Renewable supply covers demand with limited surplus."
            )

            decision_trace.append(
                "DECIDE: Use renewable energy and preserve battery state."
            )

        grid_status = "GREEN"

    # Case B — renewable energy is insufficient but battery can help
    else:

        decision_trace.append(
            "ANALYZE: Renewable generation does not fully satisfy current demand."
        )

        # Keep a reserve of 10 kWh whenever possible.
        battery_reserve = min(10.0, battery_storage_kwh)

        usable_battery = max(
            battery_storage_kwh - battery_reserve,
            0.0,
        )

        if usable_battery >= energy_gap:

            grid_import = 0.0

            battery_action = (
                f"Discharge approximately "
                f"{energy_gap:.2f} kWh from battery while "
                f"maintaining approximately {battery_reserve:.2f} kWh reserve."
            )

            autonomous_decision = "USE_RENEWABLE_AND_DISCHARGE_BATTERY"

            decision_reason = (
                "Renewable energy is insufficient, but the battery can cover "
                "the remaining demand while maintaining its reserve."
            )

            explanation = [
                f"Renewable generation leaves a {energy_gap:.2f} kWh demand gap.",
                "Battery energy is available to cover the gap.",
                f"A {battery_reserve:.2f} kWh reserve is protected.",
                "Main-grid import is avoided.",
            ]

            decision_trace.append(
                f"OPTIMIZE: Demand gap identified at {energy_gap:.2f} kWh."
            )

            decision_trace.append(
                "DECIDE: Use renewable energy first, then discharge battery."
            )

            grid_status = "BALANCED"

        # Case C — battery cannot fully cover demand
        elif usable_battery > 0:

            battery_used = usable_battery

            grid_import = max(
                energy_gap - battery_used,
                0.0,
            )

            battery_action = (
                f"Use approximately {battery_used:.2f} kWh battery energy "
                f"and preserve approximately {battery_reserve:.2f} kWh reserve."
            )

            autonomous_decision = "USE_RENEWABLE_DISCHARGE_BATTERY_THEN_GRID"

            decision_reason = (
                "Renewable generation and usable battery energy partially "
                "cover demand; the remaining deficit requires grid support."
            )

            explanation = [
                f"Renewable generation leaves a {energy_gap:.2f} kWh gap.",
                f"Approximately {battery_used:.2f} kWh battery energy is usable.",
                f"{grid_import:.2f} kWh must be imported from the main grid.",
                "Battery reserve is protected.",
            ]

            decision_trace.append(
                f"OPTIMIZE: Battery can cover {battery_used:.2f} kWh of the demand gap."
            )

            decision_trace.append(
                f"RESPOND: Import approximately {grid_import:.2f} kWh from the main grid."
            )

            grid_status = "IMPORT_REQUIRED"

        # Case D — battery is empty / reserve only
        else:

            grid_import = energy_gap

            battery_action = (
                "Battery reserve is protected; use main grid "
                "for the remaining demand."
            )

            autonomous_decision = "USE_RENEWABLE_AND_GRID"

            decision_reason = (
                "Renewable generation is insufficient and available battery "
                "energy cannot safely cover the remaining demand."
            )

            explanation = [
                f"Renewable generation leaves a {energy_gap:.2f} kWh gap.",
                "Usable battery energy is insufficient.",
                "Battery reserve is protected.",
                f"Approximately {grid_import:.2f} kWh grid support is required.",
            ]

            decision_trace.append(
                "OPTIMIZE: Battery reserve cannot safely cover the demand gap."
            )

            decision_trace.append(
                f"RESPOND: Import approximately {grid_import:.2f} kWh from the grid."
            )

            grid_status = "GRID_DEPENDENT"

    # ---------------------------------------------------------
    # 5. Grid dependency risk
    # ---------------------------------------------------------

    grid_dependency_ratio = (
        grid_import / demand_kwh
    )

    if grid_dependency_ratio >= 0.50:
        grid_dependency_risk = "HIGH"
    elif grid_dependency_ratio > 0:
        grid_dependency_risk = "MEDIUM"
    else:
        grid_dependency_risk = "LOW"

    # ---------------------------------------------------------
    # 6. Overall risk score
    # ---------------------------------------------------------

    risk_points = {
        "LOW": 0,
        "MEDIUM": 15,
        "HIGH": 30,
    }

    raw_risk_score = (
        risk_points[demand_risk]
        + risk_points[renewable_risk]
        + risk_points[battery_risk]
        + risk_points[grid_dependency_risk]
    )

    risk_score = min(
        100,
        raw_risk_score,
    )

    if risk_score >= 60:
        risk_level = "HIGH"
    elif risk_score >= 30:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # ---------------------------------------------------------
    # 7. Optimization score
    # ---------------------------------------------------------

    demand_coverage_score = min(
        renewable_coverage,
        100,
    )

    grid_efficiency_score = max(
        0,
        100 - (
            grid_dependency_ratio * 100
        ),
    )

    renewable_utilization_score = min(
        100,
        (
            renewable_generation / demand_kwh
        ) * 100,
    )

    battery_management_score = 100

    if battery_risk == "HIGH":
        battery_management_score = 60
    elif battery_risk == "MEDIUM":
        battery_management_score = 80

    optimization_score = (
        demand_coverage_score * 0.35
        + grid_efficiency_score * 0.30
        + renewable_utilization_score * 0.20
        + battery_management_score * 0.15
    )

    optimization_score = round(
        min(100, max(0, optimization_score)),
        2,
    )

    # ---------------------------------------------------------
    # 8. Complete decision trace
    # ---------------------------------------------------------

    decision_trace.append(
        f"RISK: Overall grid risk classified as {risk_level} "
        f"with score {risk_score:.0f}/100."
    )

    decision_trace.append(
        f"OPTIMIZATION SCORE: {optimization_score:.2f}/100."
    )

    decision_trace.append(
        f"RESPOND: Grid operating status = {grid_status}."
    )

    # ---------------------------------------------------------
    # 9. Return result
    # ---------------------------------------------------------

    return GridOptimizationResult(
        demand_kwh=round(demand_kwh, 2),
        solar_kwh=round(solar_kwh, 2),
        wind_kwh=round(wind_kwh, 2),
        renewable_generation_kwh=round(
            renewable_generation,
            2,
        ),
        battery_storage_kwh=round(
            battery_storage_kwh,
            2,
        ),
        renewable_coverage_percent=round(
            renewable_coverage,
            2,
        ),
        grid_import_kwh=round(
            grid_import,
            2,
        ),
        battery_action=battery_action,
        recommended_action=decision_reason,
        grid_status=grid_status,

        surplus_kwh=round(
            surplus,
            2,
        ),
        energy_gap_kwh=round(
            energy_gap,
            2,
        ),

        risk_score=round(
            risk_score,
            2,
        ),
        risk_level=risk_level,
        demand_risk=demand_risk,
        renewable_risk=renewable_risk,
        battery_risk=battery_risk,
        grid_dependency_risk=grid_dependency_risk,

        optimization_score=optimization_score,
        optimization_method=(
            "Multi-objective deterministic optimization "
            "with autonomous decision policy"
        ),

        autonomous_decision=autonomous_decision,
        decision_reason=decision_reason,

        decision_trace=decision_trace,
        explanation=explanation,
    )


def optimize_grid_from_database(
    db: Session,
) -> GridOptimizationResult:
    """
    Automatically read the latest telemetry from PostgreSQL
    and run the optimization engine.
    """

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
        raise ValueError(
            "No energy consumption records available."
        )

    if latest_renewable is None:
        raise ValueError(
            "No renewable energy records available."
        )

    return optimize_grid(
        demand_kwh=latest_energy.consumption_kwh,
        solar_kwh=latest_renewable.solar_production_kwh,
        wind_kwh=latest_renewable.wind_generation_kwh,
        battery_storage_kwh=latest_renewable.battery_storage_kwh,
    )