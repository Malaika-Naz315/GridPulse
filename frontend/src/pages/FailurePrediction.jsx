import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Gauge,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Target,
  Thermometer,
  TrendingUp,
  Wind,
  X,
  Zap,
} from "lucide-react";

import {
  getEnergyConsumption,
  getWeatherData,
  getSystemHealth,
} from "../services/api";

import api from "../services/api";

import "../styles/failure-prediction.css";


/* =========================================================
   HELPERS
========================================================= */

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;

  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.items)) return value.items;

  return [];
};


const getRiskClass = (level = "") => {
  const normalized = String(level).toLowerCase();

  if (normalized === "critical") return "critical";
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";

  return "low";
};


const getRiskIcon = (level = "") => {
  const normalized = String(level).toLowerCase();

  if (normalized === "critical") {
    return <AlertOctagon size={18} />;
  }

  if (normalized === "high") {
    return <ShieldAlert size={18} />;
  }

  if (normalized === "medium") {
    return <AlertTriangle size={18} />;
  }

  return <ShieldCheck size={18} />;
};


/* =========================================================
   COMPONENT
========================================================= */

export default function FailurePrediction() {
  const [prediction, setPrediction] = useState(null);
  const [energy, setEnergy] = useState([]);
  const [weather, setWeather] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Selected failure card
  const [selectedPrediction, setSelectedPrediction] = useState(null);


  /* =========================================================
     FETCH DATA
  ========================================================= */

  const fetchPredictions = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const results = await Promise.allSettled([
        api.get("/api/v1/failure-prediction"),
        getEnergyConsumption(30),
        getWeatherData(30),
        getSystemHealth(),
      ]);


      /* -----------------------------------------
         Failure prediction
      ----------------------------------------- */

      const predictionResult = results[0];

      if (predictionResult.status === "fulfilled") {
        setPrediction(predictionResult.value.data);
      } else {
        throw new Error(
          predictionResult.reason?.response?.data?.detail ||
            "Unable to load failure prediction data."
        );
      }


      /* -----------------------------------------
         Energy
      ----------------------------------------- */

      const energyResult = results[1];

      if (energyResult.status === "fulfilled") {
        setEnergy(normalizeArray(energyResult.value));
      }


      /* -----------------------------------------
         Weather
      ----------------------------------------- */

      const weatherResult = results[2];

      if (weatherResult.status === "fulfilled") {
        setWeather(normalizeArray(weatherResult.value));
      }


      /* -----------------------------------------
         System health
      ----------------------------------------- */

      const healthResult = results[3];

      if (healthResult.status === "fulfilled") {
        setSystemHealth(healthResult.value);
      }


      window.dispatchEvent(
        new CustomEvent("gridpulse:failure-refresh")
      );

    } catch (err) {
      console.error("Failure prediction error:", err);

      setError(
        err?.message ||
          "Unable to load failure prediction data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);


  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);


  /* =========================================================
     PREDICTION LIST
  ========================================================= */

  const predictions = useMemo(() => {
    return Array.isArray(prediction?.predictions)
      ? prediction.predictions
      : [];
  }, [prediction]);


  /* =========================================================
     SUMMARY
  ========================================================= */

  const summary = useMemo(() => {
    const backendCounts = {
      critical: Number(prediction?.critical_count || 0),
      high: Number(prediction?.high_count || 0),
      medium: Number(prediction?.medium_count || 0),
      low: Number(prediction?.low_count || 0),
    };

    const hasBackendCounts =
      prediction &&
      (
        "critical_count" in prediction ||
        "high_count" in prediction ||
        "medium_count" in prediction ||
        "low_count" in prediction
      );


    if (hasBackendCounts) {
      return backendCounts;
    }


    return predictions.reduce(
      (acc, item) => {
        const level = String(
          item?.risk_level || "LOW"
        ).toLowerCase();

        if (level === "critical") acc.critical += 1;
        else if (level === "high") acc.high += 1;
        else if (level === "medium") acc.medium += 1;
        else acc.low += 1;

        return acc;
      },
      {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      }
    );
  }, [prediction, predictions]);


  /* =========================================================
     TELEMETRY CONTEXT
  ========================================================= */

  const telemetry = useMemo(() => {
    const context = prediction?.input_context || {};

    const latestEnergy =
      energy.length > 0
        ? energy[0]
        : null;

    const latestWeather =
      weather.length > 0
        ? weather[0]
        : null;


    const currentConsumption =
      context.current_consumption_kwh ??
      latestEnergy?.consumption_kwh ??
      latestEnergy?.value ??
      0;


    const solar =
      context.solar_production_kwh ??
      latestEnergy?.solar_production_kwh ??
      0;


    const wind =
      context.wind_generation_kwh ??
      latestEnergy?.wind_generation_kwh ??
      0;


    const battery =
      context.battery_storage_kwh ??
      latestEnergy?.battery_storage_kwh ??
      0;


    const temperature =
      latestWeather?.temperature_c ??
      latestWeather?.temperature ??
      latestWeather?.temp_c ??
      latestWeather?.temp ??
      0;


    const windSpeed =
      latestWeather?.wind_speed_kmh ??
      latestWeather?.wind_speed ??
      0;


    return {
      currentConsumption,
      solar,
      wind,
      battery,
      temperature,
      windSpeed,
    };
  }, [prediction, energy, weather]);


  /* =========================================================
     RENEWABLE TOTAL
  ========================================================= */

  const renewableTotal = useMemo(() => {
    return (
      Number(telemetry.solar || 0) +
      Number(telemetry.wind || 0)
    );
  }, [telemetry]);


  /* =========================================================
     OVERALL RISK
  ========================================================= */

  const overallRisk = Number(
    prediction?.overall_risk_score || 0
  );


  const overallRiskLevel =
    prediction?.overall_risk_level || "LOW";


  const highestRisk =
    prediction?.highest_risk_failure ||
    "No major risk detected";


  const highestRiskScore = Number(
    prediction?.highest_risk_score || 0
  );


  /* =========================================================
     SELECT FAILURE
  ========================================================= */

  const handlePredictionClick = (item) => {
    setSelectedPrediction(item);
  };


  const closeDetails = () => {
    setSelectedPrediction(null);
  };


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="failure-page">
        <div className="failure-loading">
          <RefreshCw
            size={24}
            className="spin"
          />

          <span>
            Analyzing current grid telemetry...
          </span>
        </div>
      </div>
    );
  }


  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className="failure-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="failure-header">

        <div>
          <div className="failure-eyebrow">
            AI GRID RISK INTELLIGENCE
          </div>

          <h1>
            Failure Prediction
          </h1>

          <p>
            Detect potential grid equipment and
            stability risks using live telemetry,
            historical patterns and explainable
            risk scoring.
          </p>
        </div>


        <button
          className="failure-refresh-btn"
          onClick={() => fetchPredictions(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "spin" : ""}
          />

          {refreshing
            ? "Analyzing..."
            : "Refresh Analysis"}
        </button>

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="failure-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}


      {/* =====================================================
          TOP SUMMARY
      ===================================================== */}

      <div className="failure-summary-grid">

        {/* Overall Risk */}

        <div className="failure-summary-card primary">

          <div className="summary-card-top">
            <span>OVERALL RISK</span>

            <Gauge size={20} />
          </div>

          <div className="summary-risk-value">
            {overallRisk.toFixed(2)}%
          </div>

          <div className="summary-risk-label">
            {overallRiskLevel}
          </div>

          <div className="summary-progress">
            <div
              style={{
                width: `${Math.min(
                  Math.max(overallRisk, 0),
                  100
                )}%`,
              }}
            />
          </div>

        </div>


        {/* Highest Risk */}

        <div className="failure-summary-card">

          <div className="summary-card-top">
            <span>HIGHEST RISK</span>

            <Target size={20} />
          </div>

          <div className="summary-main-text">
            {highestRisk}
          </div>

          <div className="summary-secondary">
            {highestRiskScore.toFixed(2)}% risk score
          </div>

        </div>


        {/* Anomaly Detection */}

        <div className="failure-summary-card">

          <div className="summary-card-top">
            <span>ANOMALY DETECTION</span>

            <BrainCircuit size={20} />
          </div>

          <div className="summary-main-text">
            {prediction?.anomaly_detection
              ? "ACTIVE"
              : "NORMAL"}
          </div>

          <div className="summary-secondary">
            Telemetry-based analysis
          </div>

        </div>


        {/* Historical Records */}

        <div className="failure-summary-card">

          <div className="summary-card-top">
            <span>HISTORICAL DATA</span>

            <Activity size={20} />
          </div>

          <div className="summary-main-text">
            {prediction?.input_context
              ?.historical_records ?? 0}
          </div>

          <div className="summary-secondary">
            telemetry records analyzed
          </div>

        </div>

      </div>


      {/* =====================================================
          LIVE TELEMETRY
      ===================================================== */}

      <section className="failure-section">

        <div className="failure-section-heading">

          <div>
            <span className="section-kicker">
              LIVE INPUT CONTEXT
            </span>

            <h2>
              Grid Telemetry
            </h2>
          </div>

          <span className="live-indicator">
            <span />
            LIVE
          </span>

        </div>


        <div className="failure-telemetry-grid">

          <div className="telemetry-card">

            <div className="telemetry-icon">
              <Zap size={19} />
            </div>

            <div>
              <span>Current Consumption</span>

              <strong>
                {Number(
                  telemetry.currentConsumption || 0
                ).toFixed(1)}{" "}
                kWh
              </strong>
            </div>

          </div>


          <div className="telemetry-card">

            <div className="telemetry-icon">
              <Thermometer size={19} />
            </div>

            <div>
              <span>Temperature</span>

              <strong>
                {Number(
                  telemetry.temperature || 0
                ).toFixed(1)}
                °C
              </strong>
            </div>

          </div>


          <div className="telemetry-card">

            <div className="telemetry-icon">
              <Wind size={19} />
            </div>

            <div>
              <span>Wind Speed</span>

              <strong>
                {Number(
                  telemetry.windSpeed || 0
                ).toFixed(1)}{" "}
                km/h
              </strong>
            </div>

          </div>


          <div className="telemetry-card">

            <div className="telemetry-icon">
              <TrendingUp size={19} />
            </div>

            <div>
              <span>Renewable Generation</span>

              <strong>
                {renewableTotal.toFixed(1)} kWh
              </strong>
            </div>

          </div>


          <div className="telemetry-card">

            <div className="telemetry-icon">
              <Activity size={19} />
            </div>

            <div>
              <span>Solar Production</span>

              <strong>
                {Number(
                  telemetry.solar || 0
                ).toFixed(1)}{" "}
                kWh
              </strong>
            </div>

          </div>


          <div className="telemetry-card">

            <div className="telemetry-icon">
              <Gauge size={19} />
            </div>

            <div>
              <span>Battery Reserve</span>

              <strong>
                {Number(
                  telemetry.battery || 0
                ).toFixed(1)}{" "}
                kWh
              </strong>
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          RISK DISTRIBUTION
      ===================================================== */}

      <section className="failure-section">

        <div className="failure-section-heading">

          <div>
            <span className="section-kicker">
              RISK DISTRIBUTION
            </span>

            <h2>
              Prediction Overview
            </h2>
          </div>

        </div>


        <div className="risk-distribution">

          <div className="risk-distribution-item critical">
            <span>Critical</span>
            <strong>{summary.critical}</strong>
          </div>

          <div className="risk-distribution-item high">
            <span>High</span>
            <strong>{summary.high}</strong>
          </div>

          <div className="risk-distribution-item medium">
            <span>Medium</span>
            <strong>{summary.medium}</strong>
          </div>

          <div className="risk-distribution-item low">
            <span>Low</span>
            <strong>{summary.low}</strong>
          </div>

        </div>

      </section>


      {/* =====================================================
          FAILURE PREDICTIONS
      ===================================================== */}

      <section className="failure-section">

        <div className="failure-section-heading">

          <div>
            <span className="section-kicker">
              AI PREDICTIONS
            </span>

            <h2>
              Failure Risk Assessment
            </h2>

            <p>
              Select any prediction to inspect
              the AI risk assessment and recommended
              response.
            </p>
          </div>

        </div>


        <div className="failure-predictions-grid">

          {predictions.map((item, index) => {

            const riskLevel =
              item?.risk_level || "LOW";

            const riskClass =
              getRiskClass(riskLevel);

            const isSelected =
              selectedPrediction === item;


            return (
              <button
                key={
                  item?.failure_type ||
                  `prediction-${index}`
                }
                type="button"
                className={`failure-prediction-card ${riskClass} ${
                  isSelected
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  handlePredictionClick(item)
                }
              >

                <div className="prediction-card-header">

                  <div className="prediction-icon">
                    {getRiskIcon(riskLevel)}
                  </div>

                  <div className="prediction-title-wrap">

                    <span>
                      {riskLevel}
                    </span>

                    <h3>
                      {item?.failure_type ||
                        "Unknown Failure"}
                    </h3>

                  </div>

                  <ChevronRight
                    size={19}
                    className="prediction-arrow"
                  />

                </div>


                <div className="prediction-score-row">

                  <div>
                    <small>
                      Risk Score
                    </small>

                    <strong>
                      {Number(
                        item?.risk_score || 0
                      ).toFixed(2)}
                      %
                    </strong>
                  </div>


                  <div>
                    <small>
                      Probability
                    </small>

                    <strong>
                      {Number(
                        item?.probability_percent ??
                        item?.risk_score ??
                        0
                      ).toFixed(2)}
                      %
                    </strong>
                  </div>

                </div>


                <div className="prediction-status">

                  <span>
                    Status
                  </span>

                  <strong>
                    {item?.status ||
                      "NORMAL"}
                  </strong>

                </div>


                <div className="prediction-card-footer">

                  <span>
                    View risk details
                  </span>

                  <ChevronRight size={15} />

                </div>

              </button>
            );
          })}

        </div>

      </section>


      {/* =====================================================
          SELECTED FAILURE DETAILS
      ===================================================== */}

      {selectedPrediction && (
        <section className="failure-details-panel">

          <div className="failure-details-header">

            <div>

              <span className="section-kicker">
                SELECTED RISK ANALYSIS
              </span>

              <h2>
                {selectedPrediction.failure_type}
              </h2>

            </div>


            <button
              type="button"
              className="failure-details-close"
              onClick={closeDetails}
              aria-label="Close risk details"
            >
              <X size={19} />
            </button>

          </div>


          <div className="failure-details-grid">

            {/* Risk Score */}

            <div className="failure-detail-card">

              <span>
                Risk Score
              </span>

              <strong>
                {Number(
                  selectedPrediction.risk_score || 0
                ).toFixed(2)}
                %
              </strong>

            </div>


            {/* Probability */}

            <div className="failure-detail-card">

              <span>
                Probability
              </span>

              <strong>
                {Number(
                  selectedPrediction.probability_percent ??
                  selectedPrediction.risk_score ??
                  0
                ).toFixed(2)}
                %
              </strong>

            </div>


            {/* Risk Level */}

            <div className="failure-detail-card">

              <span>
                Risk Level
              </span>

              <strong>
                {selectedPrediction.risk_level ||
                  "LOW"}
              </strong>

            </div>


            {/* Status */}

            <div className="failure-detail-card">

              <span>
                Current Status
              </span>

              <strong>
                {selectedPrediction.status ||
                  "NORMAL"}
              </strong>

            </div>


            {/* Severity */}

            <div className="failure-detail-card">

              <span>
                Severity
              </span>

              <strong>
                {selectedPrediction.severity ||
                  "LOW"}
              </strong>

            </div>

          </div>


          {/* Explanation */}

          <div className="failure-detail-explanation">

            <div className="detail-block-icon">
              <BrainCircuit size={19} />
            </div>

            <div>

              <span>
                Why this risk was detected
              </span>

              <p>
                {selectedPrediction.explanation ||
                  "No additional explanation was provided by the prediction engine."}
              </p>

            </div>

          </div>


          {/* Recommended Action */}

          <div className="failure-detail-action">

            <div className="detail-block-icon">
              <CheckCircle2 size={19} />
            </div>

            <div>

              <span>
                Recommended Operator Action
              </span>

              <p>
                {selectedPrediction.recommended_action ||
                  "Continue monitoring the affected grid condition."}
              </p>

            </div>

          </div>


          {/* Context */}

          <div className="failure-detail-context">

            <div className="detail-context-header">

              <Activity size={18} />

              <span>
                Model Input Context
              </span>

            </div>


            <div className="detail-context-grid">

              <div>
                <small>
                  Current Consumption
                </small>

                <strong>
                  {Number(
                    telemetry.currentConsumption || 0
                  ).toFixed(1)}{" "}
                  kWh
                </strong>
              </div>


              <div>
                <small>
                  Solar Production
                </small>

                <strong>
                  {Number(
                    telemetry.solar || 0
                  ).toFixed(1)}{" "}
                  kWh
                </strong>
              </div>


              <div>
                <small>
                  Wind Generation
                </small>

                <strong>
                  {Number(
                    telemetry.wind || 0
                  ).toFixed(1)}{" "}
                  kWh
                </strong>
              </div>


              <div>
                <small>
                  Battery Storage
                </small>

                <strong>
                  {Number(
                    telemetry.battery || 0
                  ).toFixed(1)}{" "}
                  kWh
                </strong>
              </div>

            </div>

          </div>

        </section>
      )}


      {/* =====================================================
          AI ENGINE
      ===================================================== */}

      <section className="failure-section">

        <div className="failure-engine-card">

          <div className="engine-icon">
            <BrainCircuit size={24} />
          </div>

          <div className="engine-content">

            <span className="section-kicker">
              AI PREDICTION ENGINE
            </span>

            <h2>
              Explainable Multi-Factor Risk Scoring
            </h2>

            <p>
              {prediction?.prediction_method ||
                "Telemetry-based anomaly detection with explainable multi-factor risk scoring"}
            </p>

          </div>

          <div className="engine-status">

            <span className="engine-status-dot" />

            ACTIVE

          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="failure-footer">

        <div>
          <ShieldCheck size={16} />

          <span>
            GridPulse AI Risk Intelligence
          </span>
        </div>

        <span>
          Analysis based on current and historical
          grid telemetry
        </span>

      </div>

    </div>
  );
}