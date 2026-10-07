from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.energy_consumption import EnergyConsumption
from app.models.renewable_energy import RenewableEnergy


INFRASTRUCTURE = {
    "power_stations": 250,
    "solar_farms": 40,
    "wind_farms": 18,
    "battery_storage_facilities": 12,
    "smart_meters": 15_000_000,
}


SCENARIO_MULTIPLIERS = {
    "normal": {
        "demand": 1.00,
        "solar": 1.00,
        "wind": 1.00,
        "battery": 1.00,
    },
    "peak_demand": {
        "demand": 1.80,
        "solar": 0.95,
        "wind": 0.95,
        "battery": 0.85,
    },
    "renewable_drop": {
        "demand": 1.05,
        "solar": 0.45,
        "wind": 0.55,
        "battery": 0.80,
    },
    "battery_stress": {
        "demand": 1.35,
        "solar": 0.90,
        "wind": 0.90,
        "battery": 0.25,
    },
    "blackout": {
        "demand": 1.20,
        "solar": 0.10,
        "wind": 0.10,
        "battery": 0.05,
    },
}


def _get_latest_energy(
    db: Session,
) -> EnergyConsumption | None:
    statement = (
        select(EnergyConsumption)
        .order_by(EnergyConsumption.timestamp.desc())
        .limit(1)
    )

    return db.scalar(statement)


def _get_latest_renewable(
    db: Session,
) -> RenewableEnergy | None:
    statement = (
        select(RenewableEnergy)
        .order_by(RenewableEnergy.timestamp.desc())
        .limit(1)
    )

    return db.scalar(statement)


def _calculate_balance(
    demand_kwh: float,
    renewable_kwh: float,
) -> dict:
    demand = max(demand_kwh, 0.0)
    renewable = max(renewable_kwh, 0.0)

    energy_gap = max(demand - renewable, 0.0)
    surplus = max(renewable - demand, 0.0)

    if demand > 0:
        coverage = (renewable / demand) * 100
    else:
        coverage = 0.0

    return {
        "energy_gap_kwh": round(energy_gap, 2),
        "surplus_kwh": round(surplus, 2),
        "renewable_coverage_percent": round(
            coverage,
            2,
        ),
        "grid_import_kwh": round(
            energy_gap,
            2,
        ),
    }


def _calculate_risk(
    demand_kwh: float,
    renewable_kwh: float,
    battery_kwh: float,
    scenario: str,
) -> tuple[float, str]:
    if demand_kwh <= 0:
        demand_stress = 0.0
    else:
        demand_stress = min(
            (demand_kwh / max(demand_kwh, 1.0)) * 100,
            100,
        )

    renewable_ratio = (
        renewable_kwh / demand_kwh
        if demand_kwh > 0
        else 1.0
    )

    risk = 0.0

    if renewable_ratio < 0.30:
        risk += 45
    elif renewable_ratio < 0.60:
        risk += 30
    elif renewable_ratio < 1.00:
        risk += 15

    if battery_kwh < 10:
        risk += 35
    elif battery_kwh < 30:
        risk += 20
    elif battery_kwh < 50:
        risk += 10

    if scenario == "peak_demand":
        risk += 20

    elif scenario == "renewable_drop":
        risk += 25

    elif scenario == "battery_stress":
        risk += 25

    elif scenario == "blackout":
        risk += 55

    risk = min(round(risk, 2), 100.0)

    if risk >= 75:
        level = "CRITICAL"
    elif risk >= 50:
        level = "HIGH"
    elif risk >= 25:
        level = "MEDIUM"
    else:
        level = "LOW"

    return risk, level


def _recovery_strategy(
    scenario: str,
    energy_gap: float,
    surplus: float,
    battery_kwh: float,
) -> str:

    if scenario == "blackout":
        return (
            "Activate virtual backup power, prioritize critical "
            "loads, redistribute available energy and initiate "
            "controlled load shedding."
        )

    if scenario == "peak_demand":
        if energy_gap > 0:
            return (
                "Redistribute virtual grid load, prioritize "
                "critical demand and use available battery backup."
            )

        return (
            "Monitor peak demand and maintain renewable-first "
            "dispatch."
        )

    if scenario == "renewable_drop":
        if energy_gap > 0:
            return (
                "Increase virtual battery discharge, prioritize "
                "critical loads and prepare additional grid support."
            )

        return (
            "Maintain renewable allocation while monitoring "
            "renewable recovery."
        )

    if scenario == "battery_stress":
        return (
            "Protect battery reserve, reduce non-critical demand "
            "and prioritize direct renewable consumption."
        )

    if surplus > 0:
        return (
            "Use renewable generation for demand and virtually "
            "charge available battery storage with surplus energy."
        )

    if energy_gap > 0:
        return (
            "Use available battery reserve and virtually "
            "redistribute grid supply to cover the energy gap."
        )

    return (
        "Maintain balanced virtual grid operation."
    )


def _build_trace(
    scenario: str,
    demand: float,
    renewable: float,
    battery: float,
    risk: float,
    risk_level: str,
    balance: dict,
) -> list[str]:

    trace = [
        "OBSERVE: Latest smart-meter and renewable telemetry loaded.",
        (
            f"SIMULATE: Scenario '{scenario}' applied to "
            "the virtual national grid."
        ),
        (
            f"ANALYZE: Simulated demand = "
            f"{demand:.2f} kWh."
        ),
        (
            f"ANALYZE: Simulated renewable generation = "
            f"{renewable:.2f} kWh."
        ),
        (
            f"BATTERY: Virtual storage level = "
            f"{battery:.2f} kWh."
        ),
    ]

    if balance["surplus_kwh"] > 0:
        trace.append(
            f"BALANCE: {balance['surplus_kwh']:.2f} kWh "
            "renewable surplus detected."
        )

    elif balance["energy_gap_kwh"] > 0:
        trace.append(
            f"BALANCE: {balance['energy_gap_kwh']:.2f} kWh "
            "virtual energy gap detected."
        )

    else:
        trace.append(
            "BALANCE: Demand and renewable supply are virtually balanced."
        )

    trace.extend(
        [
            (
                f"RISK: Grid risk classified as "
                f"{risk_level} ({risk:.2f}/100)."
            ),
            (
                "RESPOND: Virtual recovery strategy generated "
                "for the selected scenario."
            ),
            "SAFETY: Simulation is virtual only and does not control real grid equipment.",
        ]
    )

    return trace


def get_digital_twin_state(
    db: Session,
) -> dict:

    energy = _get_latest_energy(db)
    renewable = _get_latest_renewable(db)

    now = datetime.utcnow()

    if energy is None:
        demand = 0.0
        timestamp = now
        energy_id = None
    else:
        demand = float(energy.consumption_kwh)
        timestamp = energy.timestamp
        energy_id = energy.id

    if renewable is None:
        solar = 0.0
        wind = 0.0
        battery = 0.0
        availability = 0.0
        renewable_id = None
    else:
        solar = float(
            renewable.solar_production_kwh
        )
        wind = float(
            renewable.wind_generation_kwh
        )
        battery = float(
            renewable.battery_storage_kwh
        )
        availability = float(
            renewable.renewable_availability_percent
        )
        renewable_id = renewable.id

    renewable_generation = solar + wind

    balance = _calculate_balance(
        demand,
        renewable_generation,
    )

    risk, risk_level = _calculate_risk(
        demand,
        renewable_generation,
        battery,
        "normal",
    )

    if risk_level == "CRITICAL":
        grid_status = "RED"
    elif risk_level == "HIGH":
        grid_status = "ORANGE"
    elif risk_level == "MEDIUM":
        grid_status = "YELLOW"
    else:
        grid_status = "GREEN"

    return {
        "twin_status": "ONLINE",
        "simulation_mode": "VIRTUAL",
        "timestamp": timestamp,
        "infrastructure": INFRASTRUCTURE,
        "telemetry": {
            "timestamp": timestamp,
            "demand_kwh": round(demand, 2),
            "solar_kwh": round(solar, 2),
            "wind_kwh": round(wind, 2),
            "renewable_generation_kwh": round(
                renewable_generation,
                2,
            ),
            "battery_storage_kwh": round(
                battery,
                2,
            ),
            "renewable_availability_percent": round(
                availability,
                2,
            ),
        },
        "balance": balance,
        "grid_status": grid_status,
        "risk_level": risk_level,
        "risk_score": risk,
        "virtual_power_flow": [
            "Smart Meters",
            "National Demand",
            "Power Stations",
            "Solar + Wind Generation",
            "Battery Storage",
            "Virtual Grid Distribution",
        ],
        "source_data": {
            "energy_consumption_record_id": energy_id,
            "renewable_energy_record_id": renewable_id,
        },
    }


def simulate_digital_twin(
    db: Session,
    scenario: str,
) -> dict:

    scenario = scenario.strip().lower()

    if scenario not in SCENARIO_MULTIPLIERS:
        raise ValueError(
            "Invalid scenario. Choose one of: "
            "normal, peak_demand, renewable_drop, "
            "battery_stress, blackout."
        )

    energy = _get_latest_energy(db)
    renewable = _get_latest_renewable(db)

    now = datetime.utcnow()

    if energy is None:
        baseline_demand = 0.0
        timestamp = now
    else:
        baseline_demand = float(
            energy.consumption_kwh
        )
        timestamp = energy.timestamp

    if renewable is None:
        baseline_solar = 0.0
        baseline_wind = 0.0
        baseline_battery = 0.0
        availability = 0.0
    else:
        baseline_solar = float(
            renewable.solar_production_kwh
        )
        baseline_wind = float(
            renewable.wind_generation_kwh
        )
        baseline_battery = float(
            renewable.battery_storage_kwh
        )
        availability = float(
            renewable.renewable_availability_percent
        )

    multipliers = SCENARIO_MULTIPLIERS[scenario]

    simulated_demand = (
        baseline_demand
        * multipliers["demand"]
    )

    simulated_solar = (
        baseline_solar
        * multipliers["solar"]
    )

    simulated_wind = (
        baseline_wind
        * multipliers["wind"]
    )

    simulated_battery = (
        baseline_battery
        * multipliers["battery"]
    )

    simulated_renewable = (
        simulated_solar
        + simulated_wind
    )

    baseline_telemetry = {
        "timestamp": timestamp,
        "demand_kwh": round(
            baseline_demand,
            2,
        ),
        "solar_kwh": round(
            baseline_solar,
            2,
        ),
        "wind_kwh": round(
            baseline_wind,
            2,
        ),
        "renewable_generation_kwh": round(
            baseline_solar + baseline_wind,
            2,
        ),
        "battery_storage_kwh": round(
            baseline_battery,
            2,
        ),
        "renewable_availability_percent": round(
            availability,
            2,
        ),
    }

    simulated_availability = availability

    if scenario == "renewable_drop":
        simulated_availability *= 0.5

    elif scenario == "blackout":
        simulated_availability *= 0.1

    simulated_availability = min(
        max(simulated_availability, 0.0),
        100.0,
    )

    simulated_telemetry = {
        "timestamp": timestamp,
        "demand_kwh": round(
            simulated_demand,
            2,
        ),
        "solar_kwh": round(
            simulated_solar,
            2,
        ),
        "wind_kwh": round(
            simulated_wind,
            2,
        ),
        "renewable_generation_kwh": round(
            simulated_renewable,
            2,
        ),
        "battery_storage_kwh": round(
            simulated_battery,
            2,
        ),
        "renewable_availability_percent": round(
            simulated_availability,
            2,
        ),
    }

    balance = _calculate_balance(
        simulated_demand,
        simulated_renewable,
    )

    risk, risk_level = _calculate_risk(
        simulated_demand,
        simulated_renewable,
        simulated_battery,
        scenario,
    )

    if risk_level == "CRITICAL":
        grid_status = "RED"
    elif risk_level == "HIGH":
        grid_status = "ORANGE"
    elif risk_level == "MEDIUM":
        grid_status = "YELLOW"
    else:
        grid_status = "GREEN"

    demand_stress = (
        (simulated_demand / baseline_demand) * 100
        if baseline_demand > 0
        else 0.0
    )

    renewable_stress = (
        (
            simulated_renewable
            / (
                baseline_solar
                + baseline_wind
            )
        )
        * 100
        if (baseline_solar + baseline_wind) > 0
        else 0.0
    )

    recovery = _recovery_strategy(
        scenario,
        balance["energy_gap_kwh"],
        balance["surplus_kwh"],
        simulated_battery,
    )

    trace = _build_trace(
        scenario,
        simulated_demand,
        simulated_renewable,
        simulated_battery,
        risk,
        risk_level,
        balance,
    )

    return {
        "twin_status": "ONLINE",
        "simulation_mode": "VIRTUAL",
        "scenario": scenario,
        "timestamp": timestamp,
        "baseline": baseline_telemetry,
        "simulated": simulated_telemetry,
        "balance": balance,
        "demand_stress_percent": round(
            demand_stress,
            2,
        ),
        "renewable_stress_percent": round(
            renewable_stress,
            2,
        ),
        "risk_score": risk,
        "risk_level": risk_level,
        "grid_status": grid_status,
        "recovery_strategy": recovery,
        "decision_trace": trace,
        "simulation_method": (
            "Deterministic Digital Twin Scenario Engine "
            "using live GridPulse telemetry"
        ),
    }