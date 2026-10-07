import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BatteryCharging,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  Leaf,
  Network,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TrendingDown,
  TriangleAlert,
  Wind,
  Zap,
} from "lucide-react";

import { getGridOptimization } from "../services/api";
import "../styles/grid-optimization.css";

export default function GridOptimization() {
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState("");

  const runOptimization = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setOptimizing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await getGridOptimization();

      if (!data || typeof data !== "object") {
        throw new Error("Invalid grid optimization response.");
      }

      setOptimization(data);
    } catch (err) {
      console.error("Grid optimization error:", err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to connect to Grid Optimization service."
      );
    } finally {
      setLoading(false);
      setOptimizing(false);
    }
  };

  useEffect(() => {
    runOptimization();
  }, []);

  const metrics = useMemo(() => {
    if (!optimization) {
      return {
        demand: 0,
        solar: 0,
        wind: 0,
        renewable: 0,
        battery: 0,
        coverage: 0,
        gridImport: 0,
        surplus: 0,
        energyGap: 0,
      };
    }

    const demand = Number(optimization.demand_kwh || 0);
    const solar = Number(optimization.solar_kwh || 0);
    const wind = Number(optimization.wind_kwh || 0);
    const renewable = Number(
      optimization.renewable_generation_kwh || 0
    );
    const battery = Number(
      optimization.battery_storage_kwh || 0
    );
    const gridImport = Number(
      optimization.grid_import_kwh || 0
    );

    return {
      demand,
      solar,
      wind,
      renewable,
      battery,
      coverage: Number(
        optimization.renewable_coverage_percent || 0
      ),
      gridImport,
      surplus: Number(
        optimization.surplus_kwh ??
          Math.max(renewable - demand, 0)
      ),
      energyGap: Number(
        optimization.energy_gap_kwh ??
          Math.max(demand - renewable, 0)
      ),
    };
  }, [optimization]);

  const intelligence = useMemo(() => {
    return {
      riskScore: Number(optimization?.risk_score || 0),
      riskLevel: optimization?.risk_level || "UNKNOWN",
      demandRisk: optimization?.demand_risk || "UNKNOWN",
      renewableRisk:
        optimization?.renewable_risk || "UNKNOWN",
      batteryRisk: optimization?.battery_risk || "UNKNOWN",
      gridRisk:
        optimization?.grid_dependency_risk || "UNKNOWN",

      optimizationScore: Number(
        optimization?.optimization_score || 0
      ),

      autonomousDecision:
        optimization?.autonomous_decision ||
        "NO_DECISION",

      decisionReason:
        optimization?.decision_reason ||
        optimization?.recommended_action ||
        "No decision explanation available.",

      optimizationMethod:
        optimization?.optimization_method ||
        "Optimization policy",

      decisionTrace: Array.isArray(
        optimization?.decision_trace
      )
        ? optimization.decision_trace
        : [],

      explanation: Array.isArray(
        optimization?.explanation
      )
        ? optimization.explanation
        : [],
    };
  }, [optimization]);

  const renewableVsDemand = useMemo(() => {
    if (!metrics.demand) return 0;

    return Math.min(
      (metrics.renewable / metrics.demand) * 100,
      100
    );
  }, [metrics]);

  const solarContribution =
    metrics.renewable > 0
      ? (metrics.solar / metrics.renewable) * 100
      : 0;

  const windContribution =
    metrics.renewable > 0
      ? (metrics.wind / metrics.renewable) * 100
      : 0;

  const getRiskClass = (risk) => {
    const value = risk?.toUpperCase();

    if (value === "LOW") return "risk-low";
    if (value === "MEDIUM") return "risk-medium";
    if (value === "HIGH") return "risk-high";

    return "risk-neutral";
  };

  const getGridStatus = () => {
    const status = optimization?.grid_status?.toUpperCase();

    if (status === "GREEN") {
      return {
        label: "GREEN",
        description:
          "Grid operating in optimal condition",
        className: "green",
        icon: <CheckCircle2 size={22} />,
      };
    }

    if (status === "YELLOW") {
      return {
        label: "YELLOW",
        description:
          "Grid requires operational attention",
        className: "yellow",
        icon: <AlertTriangle size={22} />,
      };
    }

    return {
      label: status || "UNKNOWN",
      description:
        "Grid status requires monitoring",
      className: "red",
      icon: <AlertTriangle size={22} />,
    };
  };

  const gridStatus = getGridStatus();

  if (loading) {
    return (
      <div className="optimization-page">
        <div className="optimization-loading">
          <RefreshCw
            size={32}
            className="spin"
          />

          <strong>
            Running Grid Optimization
          </strong>

          <span>
            Analyzing demand, renewable generation,
            battery conditions and grid risk...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="optimization-page">

      {/* HEADER */}
      <header className="optimization-header">
        <div>
          <div className="optimization-eyebrow">
            <BrainCircuit size={15} />
            GRIDPULSE • AI GRID OPTIMIZATION
          </div>

          <h1>Grid Optimization</h1>

          <p>
            Autonomous grid intelligence for balancing
            demand, renewable generation, battery storage,
            risk and grid imports.
          </p>
        </div>

        <button
          className="optimization-run-button"
          onClick={() => runOptimization(true)}
          disabled={optimizing}
        >
          <RefreshCw
            size={17}
            className={optimizing ? "spin" : ""}
          />

          {optimizing
            ? "Optimizing..."
            : "Run Optimization"}
        </button>
      </header>

      {/* ERROR */}
      {error && (
        <div className="optimization-error">
          <AlertTriangle size={20} />

          <div>
            <strong>
              Optimization service unavailable
            </strong>

            <span>{error}</span>
          </div>
        </div>
      )}

      {/* GRID STATUS */}
      <section
        className={`optimization-status ${gridStatus.className}`}
      >
        <div className="status-main">
          <div className="status-icon">
            {gridStatus.icon}
          </div>

          <div>
            <span>GRID STATUS</span>

            <strong>
              {gridStatus.label}
            </strong>

            <p>
              {gridStatus.description}
            </p>
          </div>
        </div>

        <div className="status-live">
          <span className="live-dot" />
          Autonomous Optimization Active
        </div>
      </section>

      {/* KPI CARDS */}
      <section className="optimization-kpis">

        <div className="optimization-kpi demand">
          <div className="optimization-kpi-icon">
            <Gauge size={21} />
          </div>

          <div>
            <span>CURRENT CONSUMPTION</span>
            <strong>
              {metrics.demand.toFixed(1)} kWh
            </strong>
            <small>
              Grid consumption requirement
            </small>
          </div>
        </div>

        <div className="optimization-kpi solar">
          <div className="optimization-kpi-icon">
            <Sun size={21} />
          </div>

          <div>
            <span>Solar Generation</span>
            <strong>
              {metrics.solar.toFixed(1)} kWh
            </strong>
            <small>
              Available solar energy
            </small>
          </div>
        </div>

        <div className="optimization-kpi wind">
          <div className="optimization-kpi-icon">
            <Wind size={21} />
          </div>

          <div>
            <span>Wind Generation</span>
            <strong>
              {metrics.wind.toFixed(1)} kWh
            </strong>
            <small>
              Available wind energy
            </small>
          </div>
        </div>

        <div className="optimization-kpi renewable">
          <div className="optimization-kpi-icon">
            <Leaf size={21} />
          </div>

          <div>
            <span>Renewable Generation</span>
            <strong>
              {metrics.renewable.toFixed(1)} kWh
            </strong>
            <small>
              Solar + wind contribution
            </small>
          </div>
        </div>

        <div className="optimization-kpi battery">
          <div className="optimization-kpi-icon">
            <BatteryCharging size={21} />
          </div>

          <div>
            <span>Battery Storage</span>
            <strong>
              {metrics.battery.toFixed(1)} kWh
            </strong>
            <small>
              Available storage
            </small>
          </div>
        </div>

        <div className="optimization-kpi import">
          <div className="optimization-kpi-icon">
            <Network size={21} />
          </div>

          <div>
            <span>Grid Import</span>
            <strong>
              {metrics.gridImport.toFixed(1)} kWh
            </strong>
            <small>
              External grid requirement
            </small>
          </div>
        </div>

      </section>

      {/* AI INTELLIGENCE */}
      <section className="ai-intelligence-grid">

        {/* OPTIMIZATION SCORE */}
        <div className="intelligence-card score-card">
          <div className="intelligence-card-header">
            <div>
              <span className="optimization-label">
                AI OPTIMIZATION
              </span>
              <h3>Optimization Score</h3>
            </div>

            <Target size={20} />
          </div>

          <div className="score-content">
            <div
              className="score-ring"
              style={{
                "--score":
                  `${intelligence.optimizationScore * 3.6}deg`,
              }}
            >
              <strong>
                {Math.round(
                  intelligence.optimizationScore
                )}
              </strong>
              <span>/ 100</span>
            </div>

            <div className="score-description">
              <strong>
                {intelligence.optimizationScore >= 85
                  ? "Highly Optimized"
                  : intelligence.optimizationScore >= 60
                  ? "Moderately Optimized"
                  : "Needs Attention"}
              </strong>

              <p>
                {intelligence.optimizationMethod}
              </p>
            </div>
          </div>
        </div>

        {/* RISK */}
        <div className="intelligence-card risk-card">
          <div className="intelligence-card-header">
            <div>
              <span className="optimization-label">
                RISK INTELLIGENCE
              </span>
              <h3>Grid Risk Assessment</h3>
            </div>

            <ShieldCheck size={20} />
          </div>

          <div className="risk-overview">
            <div>
              <span>Overall Risk</span>

              <strong
                className={getRiskClass(
                  intelligence.riskLevel
                )}
              >
                {intelligence.riskLevel}
              </strong>
            </div>

            <div className="risk-score">
              <strong>
                {Math.round(
                  intelligence.riskScore
                )}
              </strong>
              <span>/100</span>
            </div>
          </div>

          <div className="risk-breakdown">

            <div>
              <span>Demand</span>
              <b className={getRiskClass(
                intelligence.demandRisk
              )}>
                {intelligence.demandRisk}
              </b>
            </div>

            <div>
              <span>Renewable</span>
              <b className={getRiskClass(
                intelligence.renewableRisk
              )}>
                {intelligence.renewableRisk}
              </b>
            </div>

            <div>
              <span>Battery</span>
              <b className={getRiskClass(
                intelligence.batteryRisk
              )}>
                {intelligence.batteryRisk}
              </b>
            </div>

            <div>
              <span>Grid Dependency</span>
              <b className={getRiskClass(
                intelligence.gridRisk
              )}>
                {intelligence.gridRisk}
              </b>
            </div>

          </div>
        </div>

      </section>

      {/* MAIN GRID */}
      <div className="optimization-main-grid">

        {/* ENERGY BALANCE */}
        <section className="optimization-panel balance-panel">

          <div className="optimization-panel-heading">
            <div>
              <span className="optimization-label">
                REAL-TIME BALANCE
              </span>

              <h2>
                Energy Supply vs Demand
              </h2>
            </div>

            <Activity size={19} />
          </div>

          <div className="energy-balance">

            <div className="balance-visual">
              <div className="balance-circle">
                <strong>
                  {Math.round(
                    renewableVsDemand
                  )}%
                </strong>

                <span>
                  Demand Covered
                </span>
              </div>
            </div>

            <div className="balance-details">

              <div className="balance-row">
                <div>
                  <span>
                    <i className="solar-marker" />
                    Solar
                  </span>

                  <strong>
                    {metrics.solar.toFixed(1)} kWh
                  </strong>
                </div>

                <div className="balance-bar">
                  <div
                    className="solar-fill"
                    style={{
                      width: `${solarContribution}%`,
                    }}
                  />
                </div>
              </div>

              <div className="balance-row">
                <div>
                  <span>
                    <i className="wind-marker" />
                    Wind
                  </span>

                  <strong>
                    {metrics.wind.toFixed(1)} kWh
                  </strong>
                </div>

                <div className="balance-bar">
                  <div
                    className="wind-fill"
                    style={{
                      width: `${windContribution}%`,
                    }}
                  />
                </div>
              </div>

              <div className="balance-row total">
                <div>
                  <span>
                    <i className="renewable-marker" />
                    Total Renewable
                  </span>

                  <strong>
                    {metrics.renewable.toFixed(1)} kWh
                  </strong>
                </div>

                <div className="balance-bar">
                  <div
                    className="renewable-fill"
                    style={{
                      width: `${renewableVsDemand}%`,
                    }}
                  />
                </div>
              </div>

              <div className="demand-summary">

                <div>
                  <span>Demand</span>
                  <strong>
                    {metrics.demand.toFixed(1)} kWh
                  </strong>
                </div>

                <ArrowUpRight size={20} />

                <div>
                  <span>
                    {metrics.energyGap > 0
                      ? "Energy Gap"
                      : "Surplus"}
                  </span>

                  <strong>
                    {metrics.energyGap > 0
                      ? `${metrics.energyGap.toFixed(1)} kWh`
                      : `${metrics.surplus.toFixed(1)} kWh`}
                  </strong>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* AI DECISION */}
        <section className="optimization-panel ai-panel">

          <div className="optimization-panel-heading">
            <div>
              <span className="optimization-label">
                AUTONOMOUS AI DECISION
              </span>

              <h2>
                Optimization Recommendation
              </h2>
            </div>

            <div className="ai-pulse">
              <BrainCircuit size={19} />
            </div>
          </div>

          <div className="autonomous-decision-box">
            <div className="autonomous-decision-icon">
              <Sparkles size={23} />
            </div>

            <div>
              <span>AUTONOMOUS DECISION</span>

              <strong>
                {intelligence.autonomousDecision
                  .replaceAll("_", " ")}
              </strong>

              <p>
                {intelligence.decisionReason}
              </p>
            </div>
          </div>

          <div className="ai-recommendation">
            <div className="recommendation-icon">
              <Zap size={23} />
            </div>

            <div>
              <span>
                RECOMMENDED ACTION
              </span>

              <p>
                {optimization?.recommended_action ||
                  "No recommendation available."}
              </p>
            </div>
          </div>

          <div className="battery-action">
            <div className="battery-action-icon">
              <BatteryCharging size={21} />
            </div>

            <div>
              <span>
                BATTERY STRATEGY
              </span>

              <p>
                {optimization?.battery_action ||
                  "No battery strategy available."}
              </p>
            </div>
          </div>

          <div className="optimization-confidence">
            <div>
              <span>
                Decision Mode
              </span>

              <strong>
                Autonomous Policy
              </strong>
            </div>

            <ShieldCheck size={20} />
          </div>

        </section>
      </div>

      {/* EXPLAINABLE AI */}
      <section className="optimization-panel explainability-panel">

        <div className="optimization-panel-heading">
          <div>
            <span className="optimization-label">
              EXPLAINABLE AI
            </span>

            <h2>
              Why did the engine make this decision?
            </h2>
          </div>

          <BrainCircuit size={19} />
        </div>

        <div className="explainability-content">

          <div className="decision-reason-box">
            <div className="decision-reason-icon">
              <TriangleAlert size={19} />
            </div>

            <div>
              <span>DECISION REASON</span>

              <p>
                {intelligence.decisionReason}
              </p>
            </div>
          </div>

          <div className="explanation-list">

            {intelligence.explanation.length > 0 ? (
              intelligence.explanation.map(
                (item, index) => (
                  <div
                    className="explanation-item"
                    key={index}
                  >
                    <CheckCircle2 size={16} />
                    <span>{item}</span>
                  </div>
                )
              )
            ) : (
              <div className="explanation-item">
                <CheckCircle2 size={16} />
                <span>
                  Optimization engine completed
                  its analysis successfully.
                </span>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* DECISION TRACE */}
      <section className="optimization-panel trace-panel">

        <div className="optimization-panel-heading">
          <div>
            <span className="optimization-label">
              AUTONOMOUS DECISION TRACE
            </span>

            <h2>
              Observe → Analyze → Optimize → Respond
            </h2>
          </div>

          <Activity size={19} />
        </div>

        <div className="trace-list">

          {intelligence.decisionTrace.map(
            (step, index) => {

              const parts = step.split(":");
              const stage = parts[0] || "STEP";
              const description =
                parts.slice(1).join(":").trim();

              return (
                <div
                  className="trace-item"
                  key={index}
                >
                  <div className="trace-number">
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <div className="trace-content">
                    <span>
                      {stage}
                    </span>

                    <p>
                      {description || step}
                    </p>
                  </div>

                  {index <
                    intelligence.decisionTrace
                      .length - 1 && (
                    <div className="trace-line" />
                  )}
                </div>
              );
            }
          )}

        </div>
      </section>

      {/* OPERATIONAL INSIGHTS */}
      <section className="optimization-panel insights-panel">

        <div className="optimization-panel-heading">
          <div>
            <span className="optimization-label">
              OPERATIONAL INTELLIGENCE
            </span>

            <h2>
              Grid Optimization Insights
            </h2>
          </div>
        </div>

        <div className="insights-grid">

          <div className="insight-card">
            <div className="insight-card-icon">
              <Leaf size={20} />
            </div>

            <div>
              <span>
                Renewable Coverage
              </span>

              <strong>
                {metrics.coverage.toFixed(0)}%
              </strong>

              <p>
                Renewable generation relative
                to current demand.
              </p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-card-icon">
              <TrendingDown size={20} />
            </div>

            <div>
              <span>
                Grid Import
              </span>

              <strong>
                {metrics.gridImport === 0
                  ? "Zero"
                  : `${metrics.gridImport.toFixed(
                      1
                    )} kWh`}
              </strong>

              <p>
                {metrics.gridImport === 0
                  ? "No external grid energy required."
                  : "External energy is required."}
              </p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-card-icon">
              <BatteryCharging size={20} />
            </div>

            <div>
              <span>
                Renewable Surplus
              </span>

              <strong>
                {metrics.surplus.toFixed(1)} kWh
              </strong>

              <p>
                Renewable energy remaining
                after meeting demand.
              </p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-card-icon">
              <Gauge size={20} />
            </div>

            <div>
              <span>
                Optimization State
              </span>

              <strong>
                {gridStatus.label === "GREEN"
                  ? "Optimal"
                  : "Monitor"}
              </strong>

              <p>
                Current operating condition
                from AI analysis.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* DECISION FLOW */}
      <section className="optimization-panel flow-panel">

        <div className="optimization-panel-heading">
          <div>
            <span className="optimization-label">
              GRIDPULSE AUTONOMOUS FLOW
            </span>

            <h2>
              Observe → Analyze → Optimize → Respond
            </h2>
          </div>
        </div>

        <div className="decision-flow">

          <div className="flow-step">
            <div className="flow-number">
              01
            </div>

            <Activity size={21} />

            <strong>
              Observe
            </strong>

            <span>
              Read grid telemetry
            </span>
          </div>

          <div className="flow-line" />

          <div className="flow-step">
            <div className="flow-number">
              02
            </div>

            <BrainCircuit size={21} />

            <strong>
              Analyze
            </strong>

            <span>
              Evaluate risk & supply
            </span>
          </div>

          <div className="flow-line" />

          <div className="flow-step active">
            <div className="flow-number">
              03
            </div>

            <Zap size={21} />

            <strong>
              Optimize
            </strong>

            <span>
              Select best energy strategy
            </span>
          </div>

          <div className="flow-line" />

          <div className="flow-step">
            <div className="flow-number">
              04
            </div>

            <ShieldCheck size={21} />

            <strong>
              Respond
            </strong>

            <span>
              Generate autonomous action
            </span>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <div className="optimization-footer">

        <span>
          <span className="live-dot" />
          Live backend optimization
        </span>

        <span>
          GridPulse AI Optimization Engine
        </span>

      </div>

    </div>
  );
}