import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Gauge,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sun,
  Wind,
  Zap,
  Power,
  RotateCcw,
  Radio,
  ListChecks,
} from "lucide-react";

import api from "../services/api";
import "../styles/emergency-response.css";

export default function EmergencyResponse() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Manual response state
  const [activeResponse, setActiveResponse] = useState(null);
  const [responseMessage, setResponseMessage] = useState(
    "No manual response action has been activated."
  );
  const [responseLog, setResponseLog] = useState([]);

  const loadEmergencyData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get(
        "/api/v1/emergency-response"
      );

      setData(response.data);
    } catch (err) {
      console.error("Emergency response error:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load emergency response data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEmergencyData();
  }, []);

  const riskClass = useMemo(() => {
    if (!data) return "low";

    const level = data.emergency_level?.toLowerCase();

    if (level === "critical") return "critical";
    if (level === "high") return "high";
    if (level === "medium") return "medium";

    return "low";
  }, [data]);

  // Manual response handler
  const executeResponse = (action) => {
    const now = new Date();

    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    let message = "";

    switch (action) {
      case "emergency":
        message =
          "Emergency protocol activated. Grid resilience procedures are now active.";
        break;

      case "battery":
        message =
          "Battery backup deployed. Stored energy is reserved for critical loads.";
        break;

      case "load":
        message =
          "Non-critical load reduction initiated to decrease grid stress.";
        break;

      case "renewable":
        message =
          "Renewable supply prioritized. Solar and wind generation will be used first.";
        break;

      default:
        message = "Response action executed.";
    }

    setActiveResponse(action);
    setResponseMessage(message);

    setResponseLog((previous) => [
      {
        action,
        message,
        time,
      },
      ...previous,
    ].slice(0, 6));
  };

  const resetResponse = () => {
    setActiveResponse(null);
    setResponseMessage(
      "Manual response console has been reset. No action is currently active."
    );

    setResponseLog((previous) => [
      {
        action: "reset",
        message: "Manual response state cleared.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
      ...previous,
    ].slice(0, 6));
  };

  if (loading) {
    return (
      <div className="emergency-page">
        <div className="emergency-loading">
          <RefreshCw className="spin" size={28} />
          <h3>Analyzing grid emergency state...</h3>
          <p>
            Reading demand, renewable generation and battery telemetry.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="emergency-page">
        <div className="emergency-error">
          <CircleAlert size={32} />

          <h3>Emergency intelligence unavailable</h3>

          <p>{error}</p>

          <button
            className="emergency-refresh-btn"
            onClick={() => loadEmergencyData()}
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const telemetry = data.telemetry || {};

  return (
    <div className="emergency-page">

      {/* HEADER */}
      <section className="emergency-header">
        <div>
          <div className="emergency-eyebrow">
            <Siren size={16} />
            GRID RESILIENCE CENTER
          </div>

          <h1>Emergency Response</h1>

          <p>
            Real-time emergency assessment and controlled response
            intelligence for GridPulse.
          </p>
        </div>

        <button
          className="emergency-refresh-btn"
          onClick={() => loadEmergencyData(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "spin" : ""}
          />

          {refreshing ? "Analyzing..." : "Refresh"}
        </button>
      </section>

      {/* SYSTEM STATUS */}
      <section className={`emergency-hero ${riskClass}`}>

        <div className="hero-status-icon">
          {riskClass === "critical" || riskClass === "high" ? (
            <AlertOctagon size={34} />
          ) : riskClass === "medium" ? (
            <AlertTriangle size={34} />
          ) : (
            <ShieldCheck size={34} />
          )}
        </div>

        <div className="hero-status-content">
          <span className="hero-label">
            CURRENT GRID STATUS
          </span>

          <h2>{data.system_status}</h2>

          <p>{data.primary_issue}</p>
        </div>

        <div className="hero-score">
          <span>Emergency Score</span>

          <strong>{data.emergency_score}</strong>

          <small>/ 100</small>
        </div>
      </section>

      {/* KPI GRID */}
      <section className="emergency-kpi-grid">

        <div className="emergency-kpi">
          <div className="kpi-icon demand">
            <Zap size={20} />
          </div>

          <div>
            <span>Current Demand</span>
            <strong>
              {telemetry.demand_kwh} kWh
            </strong>
          </div>
        </div>

        <div className="emergency-kpi">
          <div className="kpi-icon solar">
            <Sun size={20} />
          </div>

          <div>
            <span>Solar Supply</span>
            <strong>
              {telemetry.solar_kwh} kWh
            </strong>
          </div>
        </div>

        <div className="emergency-kpi">
          <div className="kpi-icon wind">
            <Wind size={20} />
          </div>

          <div>
            <span>Wind Supply</span>
            <strong>
              {telemetry.wind_kwh} kWh
            </strong>
          </div>
        </div>

        <div className="emergency-kpi">
          <div className="kpi-icon battery">
            <BatteryCharging size={20} />
          </div>

          <div>
            <span>Battery Reserve</span>
            <strong>
              {telemetry.battery_storage_kwh} kWh
            </strong>
          </div>
        </div>

      </section>

      {/* MAIN GRID */}
      <section className="emergency-main-grid">

        {/* RESPONSE DECISION */}
        <div className="emergency-card decision-card">

          <div className="card-heading">
            <div>
              <span className="section-kicker">
                RESPONSE DECISION
              </span>

              <h3>Recommended Emergency Action</h3>
            </div>

            <div className="decision-badge">
              <Activity size={15} />
              AUTOMATED
            </div>
          </div>

          <div className="decision-main">

            <div className="decision-icon">
              <ShieldAlert size={27} />
            </div>

            <div>
              <span>Primary Response</span>

              <h4>{data.recommended_action}</h4>
            </div>

          </div>

          <div className="decision-details">

            <div>
              <span>Power Strategy</span>
              <strong>{data.power_strategy}</strong>
            </div>

            <div>
              <span>Affected Area</span>
              <strong>{data.affected_area}</strong>
            </div>

            <div>
              <span>Automation</span>

              <strong>
                {data.automation_enabled
                  ? "Enabled"
                  : "Manual"}
              </strong>
            </div>

          </div>

          <div className="backup-action">

            <BatteryCharging size={18} />

            <div>
              <span>Backup Response</span>

              <p>{data.backup_action}</p>
            </div>

          </div>

        </div>

        {/* RISK */}
        <div className="emergency-card risk-card">

          <div className="card-heading">

            <div>
              <span className="section-kicker">
                RISK ASSESSMENT
              </span>

              <h3>Emergency Risk</h3>
            </div>

            <Gauge size={21} />

          </div>

          <div className="risk-meter">

            <div className="risk-number">
              <strong>{data.emergency_score}</strong>
              <span>/100</span>
            </div>

            <div className="risk-track">

              <div
                className={`risk-fill ${riskClass}`}
                style={{
                  width: `${Math.min(
                    data.emergency_score,
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

          <div className={`risk-level ${riskClass}`}>
            {data.emergency_level}
          </div>

          <p className="risk-description">
            The emergency score combines demand stress,
            renewable availability and battery reserve.
          </p>

        </div>

      </section>

      {/* MANUAL RESPONSE CONSOLE */}
      <section className="emergency-card response-console">

        <div className="card-heading">

          <div>
            <span className="section-kicker">
              MANUAL RESPONSE CONSOLE
            </span>

            <h3>Operator Control Center</h3>

            <p className="console-subtitle">
              Trigger simulated resilience actions and monitor
              the response state.
            </p>
          </div>

          <div className="operator-badge">
            <Radio size={15} />
            OPERATOR MODE
          </div>

        </div>

        <div className="response-console-grid">

          {/* BUTTONS */}
          <div className="response-actions">

            <button
              className={`response-action emergency-action ${
                activeResponse === "emergency"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                executeResponse("emergency")
              }
            >
              <div className="response-action-icon">
                <Siren size={21} />
              </div>

              <div>
                <strong>Activate Emergency Protocol</strong>
                <span>
                  Start grid-wide resilience response
                </span>
              </div>

              <ChevronRight size={18} />
            </button>

            <button
              className={`response-action battery-action ${
                activeResponse === "battery"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                executeResponse("battery")
              }
            >
              <div className="response-action-icon">
                <BatteryCharging size={21} />
              </div>

              <div>
                <strong>Deploy Battery Backup</strong>
                <span>
                  Reserve stored energy for critical loads
                </span>
              </div>

              <ChevronRight size={18} />
            </button>

            <button
              className={`response-action load-action ${
                activeResponse === "load"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                executeResponse("load")
              }
            >
              <div className="response-action-icon">
                <Zap size={21} />
              </div>

              <div>
                <strong>Reduce Non-Critical Load</strong>
                <span>
                  Simulate controlled demand reduction
                </span>
              </div>

              <ChevronRight size={18} />
            </button>

            <button
              className={`response-action renewable-action ${
                activeResponse === "renewable"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                executeResponse("renewable")
              }
            >
              <div className="response-action-icon">
                <Sun size={21} />
              </div>

              <div>
                <strong>Prioritize Renewable Supply</strong>
                <span>
                  Route available clean generation first
                </span>
              </div>

              <ChevronRight size={18} />
            </button>

            <button
              className="response-reset-btn"
              onClick={resetResponse}
            >
              <RotateCcw size={17} />
              Reset Response State
            </button>

          </div>

          {/* STATUS */}
          <div className="response-live-panel">

            <div className="live-panel-header">
              <div className="live-panel-icon">
                <Power size={20} />
              </div>

              <div>
                <span>RESPONSE STATE</span>

                <strong>
                  {activeResponse
                    ? "ACTION ACTIVE"
                    : "STANDBY"}
                </strong>
              </div>

              <div
                className={`response-dot ${
                  activeResponse
                    ? "active"
                    : ""
                }`}
              />
            </div>

            <div className="response-message">
              <span>OPERATOR MESSAGE</span>

              <p>{responseMessage}</p>
            </div>

            <div className="response-state-box">

              <div>
                <span>Current Command</span>

                <strong>
                  {activeResponse
                    ? activeResponse
                        .replace("-", " ")
                        .toUpperCase()
                    : "NONE"}
                </strong>
              </div>

              <div>
                <span>Execution</span>

                <strong>
                  {activeResponse
                    ? "SIMULATED"
                    : "READY"}
                </strong>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* RESPONSE LOG */}
      <section className="emergency-card response-log-card">

        <div className="card-heading">

          <div>
            <span className="section-kicker">
              RESPONSE ACTIVITY
            </span>

            <h3>Operator Action Log</h3>
          </div>

          <ListChecks size={21} />

        </div>

        {responseLog.length === 0 ? (
          <div className="empty-response-log">
            <Activity size={20} />

            <span>
              No manual actions recorded yet.
            </span>
          </div>
        ) : (
          <div className="response-log-list">

            {responseLog.map((item, index) => (
              <div
                className="response-log-item"
                key={`${item.time}-${index}`}
              >
                <div className="log-status">
                  <CheckCircle2 size={17} />
                </div>

                <div className="log-content">
                  <strong>
                    {item.action === "reset"
                      ? "Response State Reset"
                      : item.action
                          .replace("-", " ")
                          .replace(/\b\w/g, (letter) =>
                            letter.toUpperCase()
                          )}
                  </strong>

                  <p>{item.message}</p>
                </div>

                <time>{item.time}</time>
              </div>
            ))}

          </div>
        )}

      </section>

      {/* TELEMETRY */}
      <section className="emergency-card telemetry-card">

        <div className="card-heading">

          <div>
            <span className="section-kicker">
              LIVE TELEMETRY
            </span>

            <h3>Grid Resource Availability</h3>
          </div>

          <span className="live-indicator">
            <span />
            LIVE
          </span>

        </div>

        <div className="telemetry-bars">

          <div className="telemetry-row">

            <div className="telemetry-label">
              <Zap size={17} />

              <span>Demand</span>

              <strong>
                {telemetry.demand_kwh} kWh
              </strong>
            </div>

            <div className="telemetry-track">

              <div
                className="telemetry-fill demand-fill"
                style={{
                  width: `${Math.min(
                    telemetry.demand_kwh,
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

          <div className="telemetry-row">

            <div className="telemetry-label">
              <Sun size={17} />

              <span>Renewable Generation</span>

              <strong>
                {telemetry.renewable_generation_kwh} kWh
              </strong>
            </div>

            <div className="telemetry-track">

              <div
                className="telemetry-fill renewable-fill"
                style={{
                  width: `${Math.min(
                    telemetry.renewable_generation_kwh,
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

          <div className="telemetry-row">

            <div className="telemetry-label">
              <BatteryCharging size={17} />

              <span>Battery Reserve</span>

              <strong>
                {telemetry.battery_storage_kwh} kWh
              </strong>
            </div>

            <div className="telemetry-track">

              <div
                className="telemetry-fill battery-fill"
                style={{
                  width: `${Math.min(
                    telemetry.battery_storage_kwh,
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

        </div>
      </section>

      {/* RESPONSE PROTOCOL */}
      <section className="emergency-card protocol-card">

        <div className="card-heading">

          <div>
            <span className="section-kicker">
              AUTONOMOUS RESPONSE ENGINE
            </span>

            <h3>Emergency Response Protocol</h3>
          </div>

          <div className="protocol-status">
            <CheckCircle2 size={16} />
            ACTIVE
          </div>

        </div>

        <div className="protocol-flow">

          {data.response_protocol?.map(
            (step, index) => (
              <div
                className="protocol-step"
                key={index}
              >

                <div className="protocol-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="protocol-content">
                  <p>{step}</p>
                </div>

                {index <
                  data.response_protocol.length - 1 && (
                  <ChevronRight
                    className="protocol-arrow"
                    size={18}
                  />
                )}

              </div>
            )
          )}

        </div>

      </section>

      {/* FOOTER */}
      <section className="emergency-footer">

        <div className="footer-icon">
          <ShieldCheck size={21} />
        </div>

        <div>
          <strong>
            GridPulse Resilience Intelligence
          </strong>

          <p>
            {data.response_method}
          </p>
        </div>

        <div className="footer-method">
          TELEMETRY
          <span>→</span>
          ASSESSMENT
          <span>→</span>
          RESPONSE
        </div>

      </section>

    </div>
  );
}