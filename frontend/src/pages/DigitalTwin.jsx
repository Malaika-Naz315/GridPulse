import { useEffect, useState } from "react";
import {
  Activity,
  BatteryCharging,
  Building2,
  Cpu,
  Factory,
  Gauge,
  GitBranch,
  Grid3X3,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  Sparkles,
  Sun,
  TowerControl,
  TrendingDown,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react";

import api from "../services/api";
import "../styles/digital-twin.css";


const SCENARIOS = {
  normal: {
    label: "Normal Operation",
    description:
      "Baseline national grid operating condition.",
    icon: ShieldCheck,
  },

  peak_demand: {
    label: "Peak Demand",
    description:
      "Simulates a sudden increase in electricity demand.",
    icon: TrendingUp,
  },

  renewable_drop: {
    label: "Renewable Drop",
    description:
      "Simulates reduced renewable energy availability.",
    icon: TrendingDown,
  },

  battery_stress: {
    label: "Battery Stress",
    description:
      "Simulates reduced battery reserve during grid stress.",
    icon: BatteryCharging,
  },

  blackout: {
    label: "Blackout Scenario",
    description:
      "Simulates a severe supply-demand imbalance.",
    icon: Siren,
  },
};


const round = (value) =>
  Number(Number(value ?? 0).toFixed(2));


const clamp = (value, min, max) =>
  Math.min(Math.max(Number(value ?? 0), min), max);


const formatNumber = (value) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));


export default function DigitalTwin() {
  const [twinState, setTwinState] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [scenario, setScenario] = useState("normal");

  const [simulation, setSimulation] = useState(null);
  const [running, setRunning] = useState(false);


  /* =========================================================
     LOAD DIGITAL TWIN STATE
  ========================================================= */

  const loadTwinState = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get(
        "/api/v1/digital-twin/state"
      );

      setTwinState(response.data || null);

    } catch (err) {
      console.error(
        "Digital Twin state error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load Digital Twin telemetry."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadTwinState();
  }, []);


  /* =========================================================
     RUN BACKEND DIGITAL TWIN SIMULATION
  ========================================================= */

  const runSimulation = async () => {
    if (running) return;

    try {
      setRunning(true);
      setSimulation(null);
      setError("");

      const response = await api.post(
        "/api/v1/digital-twin/simulate",
        {
          scenario,
        }
      );

      setSimulation(response.data || null);

    } catch (err) {
      console.error(
        "Digital Twin simulation error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to run Digital Twin simulation."
      );

    } finally {
      setRunning(false);
    }
  };


  /* =========================================================
     RESET SIMULATION
  ========================================================= */

  const resetSimulation = () => {
    setScenario("normal");
    setSimulation(null);
    setError("");
  };


  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <div className="digital-twin-page">
        <div className="digital-twin-loading">

          <RefreshCw
            size={30}
            className="spin"
          />

          <h3>
            Initializing National Grid Digital Twin...
          </h3>

          <p>
            Synchronizing live energy and renewable
            telemetry with the virtual grid model.
          </p>

        </div>
      </div>
    );
  }


  /* =========================================================
     ERROR STATE
  ========================================================= */

  if (error && !twinState) {
    return (
      <div className="digital-twin-page">

        <div className="digital-twin-error">

          <Siren size={32} />

          <h3>
            Digital Twin unavailable
          </h3>

          <p>
            {error}
          </p>

          <button
            className="twin-refresh-btn"
            onClick={() =>
              loadTwinState()
            }
          >
            <RefreshCw size={17} />

            Try Again
          </button>

        </div>

      </div>
    );
  }


  /* =========================================================
     SAFE DATA EXTRACTION
  ========================================================= */

  const telemetry =
    twinState?.telemetry || {};

  const infrastructure =
    twinState?.infrastructure || {};

  const balance =
    twinState?.balance || {};

  const virtualPowerFlow =
    twinState?.virtual_power_flow || [];


  const demand =
    round(telemetry.demand_kwh);

  const solar =
    round(telemetry.solar_kwh);

  const wind =
    round(telemetry.wind_kwh);

  const renewableGeneration =
    round(
      telemetry.renewable_generation_kwh
    );

  const battery =
    round(
      telemetry.battery_storage_kwh
    );

  const renewableAvailability =
    round(
      telemetry.renewable_availability_percent
    );

  const renewableCoverage =
    round(
      balance.renewable_coverage_percent
    );

  const gridStatus =
    twinState?.grid_status ||
    "UNKNOWN";

  const riskLevel =
    twinState?.risk_level ||
    "UNKNOWN";

  const riskScore =
    round(twinState?.risk_score);


  const riskClass =
    simulation?.risk_level?.toLowerCase() ||
    "low";


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="digital-twin-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="twin-header">

        <div>

          <div className="twin-eyebrow">

            <Cpu size={16} />

            NATIONAL GRID DIGITAL TWIN

          </div>

          <h1>
            Digital Twin Simulation
          </h1>

          <p>
            A virtual operational model of the
            national smart grid for monitoring,
            scenario simulation, resilience analysis
            and intelligent recovery planning.
          </p>

        </div>


        <button
          className="twin-refresh-btn"
          onClick={() =>
            loadTwinState(true)
          }
          disabled={refreshing}
        >

          <RefreshCw
            size={17}
            className={
              refreshing
                ? "spin"
                : ""
            }
          />

          {refreshing
            ? "Syncing..."
            : "Sync Telemetry"}

        </button>

      </section>


      {/* =====================================================
          BACKEND ERROR NOTICE
      ====================================================== */}

      {error && twinState && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 15px",
            border: "1px solid #e9caca",
            borderRadius: "11px",
            background: "#fff5f5",
            color: "#a34d4d",
            fontSize: "11px",
          }}
        >
          {error}
        </div>
      )}


      {/* =====================================================
          TWIN STATUS
      ====================================================== */}

      <section className="twin-status-card">

        <div className="twin-status-left">

          <div className="twin-live-icon">
            <Activity size={25} />
          </div>

          <div>

            <span>
              DIGITAL TWIN STATUS
            </span>

            <h2>
              {twinState?.twin_status ===
              "ONLINE"
                ? "Synchronized"
                : "Offline"}
            </h2>

            <p>
              Virtual grid state is aligned with
              available GridPulse telemetry.
            </p>

          </div>

        </div>


        <div className="twin-status-meta">

          <div>

            <span>
              Twin Status
            </span>

            <strong>
              {twinState?.twin_status ||
                "UNKNOWN"}
            </strong>

          </div>


          <div>

            <span>
              Simulation Engine
            </span>

            <strong>
              READY
            </strong>

          </div>


          <div>

            <span>
              Operating Mode
            </span>

            <strong>
              {twinState?.simulation_mode ||
                "VIRTUAL"}
            </strong>

          </div>

        </div>

      </section>


      {/* =====================================================
          LIVE GRID KPIs
      ====================================================== */}

      <section className="twin-kpi-grid">

        {/* DEMAND */}

        <div className="twin-kpi">

          <div className="twin-kpi-icon demand">
            <Zap size={21} />
          </div>

          <div>

            <span>
              Live Demand
            </span>

            <strong>
              {formatNumber(demand)} kWh
            </strong>

          </div>

        </div>


        {/* RENEWABLE */}

        <div className="twin-kpi">

          <div className="twin-kpi-icon renewable">
            <Sparkles size={21} />
          </div>

          <div>

            <span>
              Renewable Supply
            </span>

            <strong>
              {formatNumber(
                renewableGeneration
              )}{" "}
              kWh
            </strong>

          </div>

        </div>


        {/* BATTERY */}

        <div className="twin-kpi">

          <div className="twin-kpi-icon battery">
            <BatteryCharging size={21} />
          </div>

          <div>

            <span>
              Battery Reserve
            </span>

            <strong>
              {formatNumber(battery)} kWh
            </strong>

          </div>

        </div>


        {/* GRID HEALTH */}

        <div className="twin-kpi">

          <div className="twin-kpi-icon health">
            <ShieldCheck size={21} />
          </div>

          <div>

            <span>
              Grid State
            </span>

            <strong>
              {gridStatus}
            </strong>

          </div>

        </div>

      </section>


      {/* =====================================================
          VIRTUAL NATIONAL GRID
      ====================================================== */}

      <section className="twin-card">

        <div className="twin-card-heading">

          <div>

            <span className="twin-kicker">
              VIRTUAL NATIONAL GRID
            </span>

            <h3>
              Grid Infrastructure Model
            </h3>

          </div>

          <div className="virtual-badge">

            <Grid3X3 size={15} />

            DIGITAL MODEL

          </div>

        </div>


        <div className="grid-network">

          {/* GENERATION */}

          <div className="network-stage generation-stage">

            <div className="network-stage-title">

              <Factory size={16} />

              GENERATION

            </div>


            <div className="network-assets">

              <div className="network-node">

                <Building2 size={22} />

                <strong>
                  {formatNumber(
                    infrastructure.power_stations ??
                      250
                  )}
                </strong>

                <span>
                  Power Stations
                </span>

              </div>


              <div className="network-node solar-node">

                <Sun size={22} />

                <strong>
                  {formatNumber(
                    infrastructure.solar_farms ??
                      40
                  )}
                </strong>

                <span>
                  Solar Farms
                </span>

              </div>


              <div className="network-node wind-node">

                <Wind size={22} />

                <strong>
                  {formatNumber(
                    infrastructure.wind_farms ??
                      18
                  )}
                </strong>

                <span>
                  Wind Farms
                </span>

              </div>

            </div>

          </div>


          {/* CONNECTOR */}

          <div className="network-connector">

            <span />

            <GitBranch size={20} />

            <span />

          </div>


          {/* TRANSMISSION */}

          <div className="network-stage transmission-stage">

            <div className="network-stage-title">

              <TowerControl size={16} />

              TRANSMISSION

            </div>


            <div className="transmission-core">

              <GitBranch size={30} />

              <strong>
                National Transmission
              </strong>

              <span>
                Virtual Power Routing Layer
              </span>

            </div>

          </div>


          {/* CONNECTOR */}

          <div className="network-connector">

            <span />

            <GitBranch size={20} />

            <span />

          </div>


          {/* DISTRIBUTION */}

          <div className="network-stage distribution-stage">

            <div className="network-stage-title">

              <Zap size={16} />

              DISTRIBUTION

            </div>


            <div className="network-assets">

              <div className="network-node battery-node">

                <BatteryCharging size={22} />

                <strong>
                  {formatNumber(
                    infrastructure
                      .battery_storage_facilities ??
                      12
                  )}
                </strong>

                <span>
                  Battery Facilities
                </span>

              </div>


              <div className="network-node meter-node">

                <Gauge size={22} />

                <strong>
                  {(
                    (
                      infrastructure.smart_meters ??
                      15000000
                    ) /
                    1000000
                  ).toFixed(0)}
                  M
                </strong>

                <span>
                  Smart Meters
                </span>

              </div>

            </div>

          </div>

        </div>


        <div className="network-flow-line">

          <span>
            GENERATION
          </span>

          <i />

          <span>
            TRANSMISSION
          </span>

          <i />

          <span>
            DISTRIBUTION
          </span>

          <i />

          <span>
            CONSUMERS
          </span>

        </div>

      </section>


      {/* =====================================================
          RESOURCE BALANCE + INTELLIGENCE
      ====================================================== */}

      <section className="twin-two-column">

        {/* RESOURCE BALANCE */}

        <div className="twin-card resource-card">

          <div className="twin-card-heading">

            <div>

              <span className="twin-kicker">
                LIVE TELEMETRY
              </span>

              <h3>
                Resource Balance
              </h3>

            </div>

            <Activity size={20} />

          </div>


          <div className="resource-list">

            {/* SOLAR */}

            <div className="resource-row">

              <div>

                <Sun size={17} />

                <span>
                  Solar
                </span>

              </div>

              <strong>
                {formatNumber(solar)} kWh
              </strong>

            </div>


            <div className="resource-bar">

              <span
                style={{
                  width: `${clamp(
                    solar,
                    0,
                    100
                  )}%`,
                }}
              />

            </div>


            {/* WIND */}

            <div className="resource-row">

              <div>

                <Wind size={17} />

                <span>
                  Wind
                </span>

              </div>

              <strong>
                {formatNumber(wind)} kWh
              </strong>

            </div>


            <div className="resource-bar">

              <span
                style={{
                  width: `${clamp(
                    wind,
                    0,
                    100
                  )}%`,
                }}
              />

            </div>


            {/* BATTERY */}

            <div className="resource-row">

              <div>

                <BatteryCharging size={17} />

                <span>
                  Battery
                </span>

              </div>

              <strong>
                {formatNumber(battery)} kWh
              </strong>

            </div>


            <div className="resource-bar">

              <span
                style={{
                  width: `${clamp(
                    battery,
                    0,
                    100
                  )}%`,
                }}
              />

            </div>


            {/* RENEWABLE AVAILABILITY */}

            <div className="resource-row">

              <div>

                <Sparkles size={17} />

                <span>
                  Renewable Availability
                </span>

              </div>

              <strong>
                {formatNumber(
                  renewableAvailability
                )}
                %
              </strong>

            </div>


            <div className="resource-bar">

              <span
                style={{
                  width: `${clamp(
                    renewableAvailability,
                    0,
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

        </div>


        {/* TWIN INTELLIGENCE */}

        <div className="twin-card intelligence-card">

          <div className="twin-card-heading">

            <div>

              <span className="twin-kicker">
                TWIN INTELLIGENCE
              </span>

              <h3>
                Current Grid Interpretation
              </h3>

            </div>

            <Cpu size={20} />

          </div>


          <div className="intelligence-list">

            <div>

              <ShieldCheck size={18} />

              <p>

                Current grid status is{" "}

                <strong>
                  {gridStatus}
                </strong>

                .

              </p>

            </div>


            <div>

              <Zap size={18} />

              <p>

                Current demand is{" "}

                <strong>
                  {formatNumber(demand)} kWh
                </strong>

                .

              </p>

            </div>


            <div>

              <Sparkles size={18} />

              <p>

                Renewable generation is{" "}

                <strong>
                  {formatNumber(
                    renewableGeneration
                  )}{" "}
                  kWh
                </strong>

                .

              </p>

            </div>


            <div>

              <BatteryCharging size={18} />

              <p>

                Battery reserve is{" "}

                <strong>
                  {formatNumber(battery)} kWh
                </strong>

                .

              </p>

            </div>


            <div>

              <Gauge size={18} />

              <p>

                Renewable coverage is{" "}

                <strong>
                  {formatNumber(
                    renewableCoverage
                  )}%
                </strong>

                .

              </p>

            </div>


            <div>

              <ShieldCheck size={18} />

              <p>

                Current twin risk level is{" "}

                <strong>
                  {riskLevel}
                </strong>

                {" "}
                with a score of{" "}

                <strong>
                  {formatNumber(riskScore)}/100
                </strong>

                .

              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          VIRTUAL POWER FLOW
      ====================================================== */}

      <section className="twin-card">

        <div className="twin-card-heading">

          <div>

            <span className="twin-kicker">
              POWER FLOW MODEL
            </span>

            <h3>
              Virtual Energy Flow
            </h3>

          </div>

          <GitBranch size={20} />

        </div>


        <div className="intelligence-list">

          {virtualPowerFlow.length > 0 ? (
            virtualPowerFlow.map(
              (step, index) => (
                <div key={index}>

                  <Zap size={18} />

                  <p>

                    <strong>
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                      .
                    </strong>{" "}

                    {step}

                  </p>

                </div>
              )
            )
          ) : (
            <div>

              <Activity size={18} />

              <p>
                Virtual power flow is currently
                unavailable.
              </p>

            </div>
          )}

        </div>

      </section>


      {/* =====================================================
          SIMULATION ENGINE
      ====================================================== */}

      <section className="twin-card simulation-card">

        <div className="simulation-header">

          <div>

            <span className="twin-kicker">
              GRID SIMULATION ENGINE
            </span>

            <h3>
              What-If Scenario Laboratory
            </h3>

            <p>
              Test virtual national grid conditions
              without affecting real infrastructure.
            </p>

          </div>


          <div className="simulation-engine-badge">

            <SlidersHorizontal size={15} />

            VIRTUAL ONLY

          </div>

        </div>


        {/* SCENARIOS */}

        <div className="scenario-grid">

          {Object.entries(SCENARIOS).map(
            ([key, item]) => {

              const Icon = item.icon;

              return (
                <button
                  key={key}
                  className={`scenario-option ${
                    scenario === key
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => {
                    setScenario(key);
                    setSimulation(null);
                  }}
                  disabled={running}
                >

                  <div className="scenario-icon">

                    <Icon size={19} />

                  </div>


                  <div>

                    <strong>
                      {item.label}
                    </strong>

                    <span>
                      {item.description}
                    </span>

                  </div>

                </button>
              );
            }
          )}

        </div>


        {/* ACTIONS */}

        <div className="simulation-actions">

          <button
            className="run-simulation-btn"
            onClick={runSimulation}
            disabled={running}
          >

            {running ? (
              <>
                <RefreshCw
                  size={18}
                  className="spin"
                />

                Simulating Grid...
              </>
            ) : (
              <>
                <Play size={18} />

                Run Digital Twin Simulation
              </>
            )}

          </button>


          <button
            className="reset-simulation-btn"
            onClick={resetSimulation}
            disabled={running}
          >

            <RotateCcw size={17} />

            Reset

          </button>

        </div>


        {/* ===================================================
            SIMULATION RESULT
        ==================================================== */}

        {simulation && (

          <div
            className={`simulation-result ${
              riskClass
            }`}
          >

            {/* RESULT HEADER */}

            <div className="simulation-result-header">

              <div>

                <span>
                  SIMULATION RESULT
                </span>

                <h4>
                  {
                    SCENARIOS[
                      simulation.scenario
                    ]?.label ||
                    simulation.scenario
                  }
                </h4>

              </div>


              <div
                className={`simulation-risk ${
                  riskClass
                }`}
              >
                {simulation.risk_level}
              </div>

            </div>


            {/* SIMULATION METRICS */}

            <div className="simulation-metrics">

              <div>

                <span>
                  Simulated Demand
                </span>

                <strong>
                  {formatNumber(
                    simulation.simulated
                      ?.demand_kwh
                  )}{" "}
                  kWh
                </strong>

              </div>


              <div>

                <span>
                  Renewable Supply
                </span>

                <strong>
                  {formatNumber(
                    simulation.simulated
                      ?.renewable_generation_kwh
                  )}{" "}
                  kWh
                </strong>

              </div>


              <div>

                <span>
                  Battery Reserve
                </span>

                <strong>
                  {formatNumber(
                    simulation.simulated
                      ?.battery_storage_kwh
                  )}{" "}
                  kWh
                </strong>

              </div>


              <div>

                <span>
                  Energy Gap
                </span>

                <strong>
                  {formatNumber(
                    simulation.balance
                      ?.energy_gap_kwh
                  )}{" "}
                  kWh
                </strong>

              </div>


              <div>

                <span>
                  Renewable Coverage
                </span>

                <strong>
                  {formatNumber(
                    simulation.balance
                      ?.renewable_coverage_percent
                  )}
                  %
                </strong>

              </div>


              <div>

                <span>
                  Risk Score
                </span>

                <strong>
                  {formatNumber(
                    simulation.risk_score
                  )}
                  /100
                </strong>

              </div>

            </div>


            {/* ADDITIONAL SIMULATION METRICS */}

            <div
              className="simulation-metrics"
              style={{
                marginTop: "8px",
              }}
            >

              <div>

                <span>
                  Simulated Solar
                </span>

                <strong>
                  {formatNumber(
                    simulation.simulated
                      ?.solar_kwh
                  )}{" "}
                  kWh
                </strong>

              </div>


              <div>

                <span>
                  Simulated Wind
                </span>

                <strong>
                  {formatNumber(
                    simulation.simulated
                      ?.wind_kwh
                  )}{" "}
                  kWh
                </strong>

              </div>


              <div>

                <span>
                  Renewable Stress
                </span>

                <strong>
                  {formatNumber(
                    simulation.renewable_stress_percent
                  )}
                  %
                </strong>

              </div>


              <div>

                <span>
                  Demand Stress
                </span>

                <strong>
                  {formatNumber(
                    simulation.demand_stress_percent
                  )}
                  %
                </strong>

              </div>


              <div>

                <span>
                  Surplus
                </span>

                <strong>
                  {formatNumber(
                    simulation.balance
                      ?.surplus_kwh
                  )}{" "}
                  kWh
                </strong>

              </div>


              <div>

                <span>
                  Grid Status
                </span>

                <strong>
                  {simulation.grid_status}
                </strong>

              </div>

            </div>


            {/* RECOVERY STRATEGY */}

            <div className="recovery-panel">

              <div className="recovery-icon">

                <ShieldCheck size={21} />

              </div>


              <div>

                <span>
                  VIRTUAL RECOVERY STRATEGY
                </span>

                <strong>
                  {simulation.recovery_strategy}
                </strong>

                <p>
                  Simulation method:{" "}
                  {simulation.simulation_method}
                </p>

              </div>

            </div>


            {/* BACKEND DECISION TRACE */}

            <div className="simulation-trace">

              {(
                simulation.decision_trace ||
                []
              ).map(
                (trace, index) => {

                  const separator =
                    trace.indexOf(":");

                  const title =
                    separator !== -1
                      ? trace
                          .slice(
                            0,
                            separator
                          )
                          .trim()
                      : `STEP ${index + 1}`;

                  const description =
                    separator !== -1
                      ? trace
                          .slice(
                            separator + 1
                          )
                          .trim()
                      : trace;

                  return (
                    <div
                      className="trace-step"
                      key={index}
                    >

                      <span>
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </span>

                      <div>

                        <strong>
                          {title}
                        </strong>

                        <p>
                          {description}
                        </p>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </div>
        )}

      </section>


      {/* =====================================================
          ARCHITECTURE FOOTER
      ====================================================== */}

      <section className="twin-footer">

        <div className="twin-footer-icon">

          <Cpu size={22} />

        </div>


        <div>

          <strong>
            GridPulse Digital Twin Engine
          </strong>

          <p>
            Live Telemetry → Virtual Grid Model →
            Scenario Simulation → Risk Assessment →
            Recovery Strategy
          </p>

        </div>


        <div className="twin-footer-tags">

          <span>
            SIMULATION
          </span>

          <span>
            RISK ANALYSIS
          </span>

          <span>
            RESILIENCE
          </span>

        </div>

      </section>


      {/* =====================================================
          VIRTUAL SAFETY NOTICE
      ====================================================== */}

      <div
        style={{
          marginTop: "12px",
          padding: "10px 13px",
          textAlign: "center",
          color: "#7893a3",
          fontSize: "9px",
          letterSpacing: "0.5px",
        }}
      >
        DIGITAL TWIN SIMULATION IS VIRTUAL ONLY —
        NO REAL GRID EQUIPMENT OR POWER INFRASTRUCTURE
        IS CONTROLLED.
      </div>

    </div>
  );
}