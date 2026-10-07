import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gauge,
  RefreshCw,
  Target,
  TrendingUp,
  Zap,
  AlertTriangle,
} from "lucide-react";

import {
  getForecastHorizon,
  evaluateForecast,
} from "../services/api";

import "../styles/demand-forecast.css";

const HORIZONS = [
  { key: "24H", label: "24 Hours" },
  { key: "7D", label: "7 Days" },
  { key: "30D", label: "30 Days" },
];

function formatNumber(value) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "--";
  }

  return Number(value).toFixed(2);
}

function formatDate(value, short = false) {
  if (!value) return "--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: short ? undefined : "2-digit",
    minute: short ? undefined : "2-digit",
  });
}

/*
 * 24H -> show time
 * 7D / 30D -> show date
 */
function formatForecastLabel(value, horizon) {
  if (!value) return "--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "--";

  if (horizon === "24H") {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function getPeakTime(data) {
  if (!data.length) return "--";

  const peak = data.reduce((max, item) =>
    Number(item.predicted_consumption_kwh) >
    Number(max.predicted_consumption_kwh)
      ? item
      : max
  );

  return formatDate(peak.forecast_timestamp);
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  description,
}) {
  return (
    <div className="forecast-stat-card">
      <div className="forecast-stat-icon">
        <Icon size={20} />
      </div>

      <div className="forecast-stat-content">
        <span>{label}</span>

        <strong>
          {value}
          {suffix && <small>{suffix}</small>}
        </strong>

        <p>{description}</p>
      </div>
    </div>
  );
}

function ForecastChart({ data, horizon }) {
  if (!data.length) {
    return (
      <div className="forecast-empty">
        <Activity size={32} />
        <p>No forecast data available.</p>
      </div>
    );
  }

  const values = data.map(
    (item) =>
      Number(item.predicted_consumption_kwh) || 0
  );

  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  const range = maxValue - minValue || 1;

  return (
    <div className="forecast-chart">
      <div className="chart-y-label max">
        {formatNumber(maxValue)} kWh
      </div>

      <div className="chart-area">
        <div className="chart-grid-line line-1" />
        <div className="chart-grid-line line-2" />
        <div className="chart-grid-line line-3" />
        <div className="chart-grid-line line-4" />

        <div className="forecast-bars">
          {data.map((item, index) => {
            const value =
              Number(item.predicted_consumption_kwh) || 0;

            const height =
              ((value - minValue) / range) * 75 + 25;

            /*
             * Show fewer labels for longer horizons
             */
            const showLabel =
              horizon === "24H"
                ? index % 3 === 0
                : horizon === "7D"
                ? true
                : index % 5 === 0;

            return (
              <div
                className="forecast-bar-wrapper"
                key={`${item.forecast_timestamp}-${index}`}
                title={`${formatDate(
                  item.forecast_timestamp
                )}: ${formatNumber(value)} kWh`}
              >
                <div
                  className="forecast-bar"
                  style={{
                    height: `${height}%`,
                  }}
                />

                {showLabel && (
                  <span className="forecast-bar-label">
                    {formatForecastLabel(
                      item.forecast_timestamp,
                      horizon
                    )}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="chart-y-label min">
        {formatNumber(minValue)} kWh
      </div>
    </div>
  );
}

export default function DemandForecast() {
  const [horizon, setHorizon] = useState("24H");

  const [forecastData, setForecastData] = useState([]);

  const [evaluation, setEvaluation] = useState(null);

  /*
   * Stores information returned by /forecast/horizon
   */
  const [forecastMeta, setForecastMeta] = useState(null);

  const [loading, setLoading] = useState(false);
  const [evaluationLoading, setEvaluationLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [evaluationError, setEvaluationError] =
    useState("");

  /*
   * Load selected forecast horizon
   */
  const loadForecast = async (
    selectedHorizon = horizon
  ) => {
    try {
      setLoading(true);
      setError("");

      const data = await getForecastHorizon(
        selectedHorizon
      );

      const forecasts = Array.isArray(data?.forecasts)
        ? data.forecasts
        : [];

      setForecastData(forecasts);

      /*
       * Keep backend metadata separately.
       * Example:
       * confidence_score = 0.90
       * model_name = RandomForest
       * model_version = 1.0
       */
      setForecastMeta({
        horizon: data?.horizon || selectedHorizon,
        model_name:
          data?.model_name || "RandomForest",
        model_version:
          data?.model_version || "1.0",
        confidence_score:
          data?.confidence_score ?? null,
        forecast_count:
          data?.forecast_count ?? forecasts.length,
      });
    } catch (err) {
      console.error(
        "Forecast loading error:",
        err
      );

      setForecastData([]);
      setForecastMeta(null);

      setError(
        err?.response?.data?.detail ||
          "Unable to load forecast data from the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Load ML evaluation
   */
  const loadEvaluation = async () => {
    try {
      setEvaluationLoading(true);
      setEvaluationError("");

      const data = await evaluateForecast();

      setEvaluation(data);
    } catch (err) {
      console.error(
        "Forecast evaluation error:",
        err
      );

      setEvaluationError(
        err?.response?.data?.detail ||
          "Forecast evaluation is currently unavailable."
      );
    } finally {
      setEvaluationLoading(false);
    }
  };

  /*
   * Initial page load
   */
  useEffect(() => {
    loadForecast("24H");
    loadEvaluation();
  }, []);

  /*
   * Horizon button
   */
  const handleHorizonChange = async (
    newHorizon
  ) => {
    if (newHorizon === horizon && forecastData.length) {
      return;
    }

    setHorizon(newHorizon);

    await loadForecast(newHorizon);
  };

  /*
   * Refresh button
   */
  const handleRefresh = async () => {
    await loadForecast(horizon);
    await loadEvaluation();
  };

  /*
   * Forecast statistics
   */
  const statistics = useMemo(() => {
    if (!forecastData.length) {
      return {
        average: 0,
        peak: 0,
        minimum: 0,
      };
    }

    const values = forecastData.map(
      (item) =>
        Number(item.predicted_consumption_kwh) || 0
    );

    const total = values.reduce(
      (sum, value) => sum + value,
      0
    );

    return {
      average: total / values.length,
      peak: Math.max(...values),
      minimum: Math.min(...values),
    };
  }, [forecastData]);

  /*
   * IMPORTANT:
   * Use the backend confidence score directly.
   *
   * Backend:
   * confidence_score = 0.90
   *
   * Display:
   * 90%
   */
  const modelConfidence =
    forecastMeta?.confidence_score !== null &&
    forecastMeta?.confidence_score !== undefined
      ? Math.max(
          0,
          Math.min(
            100,
            Number(
              forecastMeta.confidence_score
            ) * 100
          )
        )
      : null;

  const systemReady =
    forecastData.length > 0;

  return (
    <div className="demand-forecast-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="forecast-page-header">

        <div>
          <div className="forecast-title-row">

            <div className="forecast-main-icon">
              <BrainCircuit size={28} />
            </div>

            <div>
              <h1>AI Demand Forecast</h1>

              <p>
                Intelligent electricity demand prediction
                powered by machine learning.
              </p>
            </div>

          </div>
        </div>

        <button
          className="forecast-refresh-btn"
          onClick={handleRefresh}
          disabled={
            loading || evaluationLoading
          }
        >
          <RefreshCw
            size={17}
            className={
              loading || evaluationLoading
                ? "spin"
                : ""
            }
          />

          {loading
            ? "Refreshing..."
            : "Refresh Forecast"}
        </button>

      </div>

      {/* =========================
          SYSTEM STATUS
      ========================= */}

      <div className="forecast-status-banner">

        <div className="status-left">

          {systemReady ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertTriangle size={20} />
          )}

          <div>
            <strong>
              {systemReady
                ? "Forecast Engine Online"
                : "Forecast Engine Waiting"}
            </strong>

            <span>
              {systemReady
                ? "Live predictions received from GridPulse AI backend"
                : "Waiting for forecast data"}
            </span>
          </div>

        </div>

        <div className="status-model">
          <span>MODEL</span>

          <strong>
            {forecastMeta?.model_name ||
              "RandomForest"}
          </strong>
        </div>

        <div className="status-model">
          <span>VERSION</span>

          <strong>
            {forecastMeta?.model_version ||
              "1.0"}
          </strong>
        </div>

      </div>

      {/* =========================
          HORIZON SELECTOR
      ========================= */}

      <div className="forecast-toolbar">

        <div className="toolbar-heading">

          <CalendarDays size={19} />

          <div>
            <strong>
              Forecast Horizon
            </strong>

            <span>
              Select prediction period
            </span>
          </div>

        </div>

        <div className="horizon-buttons">

          {HORIZONS.map((item) => (
            <button
              key={item.key}
              className={
                horizon === item.key
                  ? "horizon-btn active"
                  : "horizon-btn"
              }
              onClick={() =>
                handleHorizonChange(item.key)
              }
              disabled={loading}
            >
              {item.label}
            </button>
          ))}

        </div>

      </div>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="forecast-error">

          <AlertTriangle size={19} />

          <div>
            <strong>
              Forecast API Error
            </strong>

            <p>{error}</p>
          </div>

        </div>
      )}

      {/* =========================
          KPI CARDS
      ========================= */}

      <div className="forecast-stat-grid">

        <StatCard
          icon={Gauge}
          label="Average Demand"
          value={formatNumber(
            statistics.average
          )}
          suffix=" kWh"
          description="Average predicted consumption"
        />

        <StatCard
          icon={TrendingUp}
          label="Peak Demand"
          value={formatNumber(
            statistics.peak
          )}
          suffix=" kWh"
          description="Highest forecasted demand"
        />

        <StatCard
          icon={Target}
          label="Model Confidence"
          value={
            modelConfidence !== null
              ? formatNumber(modelConfidence)
              : "--"
          }
          suffix={
            modelConfidence !== null
              ? "%"
              : ""
          }
          description="Backend forecast confidence"
        />

        <StatCard
          icon={Clock3}
          label="Peak Time"
          value={getPeakTime(
            forecastData
          )}
          description="Expected highest demand period"
        />

      </div>

      {/* =========================
          MAIN FORECAST
      ========================= */}

      <div className="forecast-main-grid">

        {/* CHART */}

        <section className="forecast-panel forecast-chart-panel">

          <div className="panel-header">

            <div>
              <h2>
                Predicted Energy Demand
              </h2>

              <p>
                {horizon === "24H"
                  ? "Next 24 hours"
                  : horizon === "7D"
                  ? "Next 7 days"
                  : "Next 30 days"}
              </p>
            </div>

            <div className="live-indicator">
              <span />
              AI Forecast
            </div>

          </div>

          {loading ? (
            <div className="forecast-loading">

              <RefreshCw
                size={30}
                className="spin"
              />

              <p>
                Generating AI forecast...
              </p>

            </div>
          ) : (
            <ForecastChart
              data={forecastData}
              horizon={horizon}
            />
          )}

        </section>

        {/* MODEL HEALTH */}

        <section className="forecast-panel">

          <div className="panel-header">

            <div>
              <h2>
                Forecast Health
              </h2>

              <p>
                Machine learning model performance
              </p>
            </div>

            <BrainCircuit size={23} />

          </div>

          {evaluationLoading ? (
            <div className="small-loading">

              <RefreshCw
                size={20}
                className="spin"
              />

              Loading evaluation...

            </div>
          ) : evaluationError ? (
            <div className="evaluation-warning">

              <AlertTriangle size={18} />

              <span>
                {evaluationError}
              </span>

            </div>
          ) : (
            <div className="health-metrics">

              <div className="health-item">
                <span>R² Score</span>

                <strong>
                  {evaluation
                    ? Number(
                        evaluation.r2_score
                      ).toFixed(4)
                    : "--"}
                </strong>
              </div>

              <div className="health-item">
                <span>MAE</span>

                <strong>
                  {evaluation
                    ? `${Number(
                        evaluation.mae
                      ).toFixed(2)} kWh`
                    : "--"}
                </strong>
              </div>

              <div className="health-item">
                <span>RMSE</span>

                <strong>
                  {evaluation
                    ? `${Number(
                        evaluation.rmse
                      ).toFixed(2)} kWh`
                    : "--"}
                </strong>
              </div>

              <div className="health-item">
                <span>
                  Training Records
                </span>

                <strong>
                  {evaluation?.training_records ??
                    "--"}
                </strong>
              </div>

              <div className="health-item">
                <span>
                  Testing Records
                </span>

                <strong>
                  {evaluation?.testing_records ??
                    "--"}
                </strong>
              </div>

              <div className="health-progress">

                <div className="health-progress-header">

                  <span>
                    Model Confidence
                  </span>

                  <strong>
                    {modelConfidence !== null
                      ? `${formatNumber(
                          modelConfidence
                        )}%`
                      : "--"}
                  </strong>

                </div>

                <div className="progress-track">

                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        modelConfidence ?? 0
                      }%`,
                    }}
                  />

                </div>

              </div>

            </div>
          )}

        </section>

      </div>

      {/* =========================
          UPCOMING FORECASTS
      ========================= */}

      <section className="forecast-panel upcoming-panel">

        <div className="panel-header">

          <div>
            <h2>
              Upcoming Predictions
            </h2>

            <p>
              Live forecast values generated by
              the AI model
            </p>
          </div>

          <Zap size={23} />

        </div>

        {forecastData.length === 0 ? (
          <div className="forecast-empty">

            <Activity size={30} />

            <p>
              No predictions available.
            </p>

          </div>
        ) : (
          <div className="prediction-table-wrapper">

            <table className="prediction-table">

              <thead>
                <tr>
                  <th>
                    {horizon === "24H"
                      ? "Time"
                      : "Date"}
                  </th>

                  <th>
                    Predicted Demand
                  </th>

                  <th>
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>

                {forecastData
                  .slice(0, 12)
                  .map((item, index) => {

                    const value =
                      Number(
                        item.predicted_consumption_kwh
                      ) || 0;

                    const isHigh =
                      value >=
                      statistics.average * 1.15;

                    return (
                      <tr
                        key={`${item.forecast_timestamp}-${index}`}
                      >

                        <td>
                          {formatDate(
                            item.forecast_timestamp
                          )}
                        </td>

                        <td>
                          <strong>
                            {formatNumber(
                              value
                            )}{" "}
                            kWh
                          </strong>
                        </td>

                        <td>
                          <span
                            className={
                              isHigh
                                ? "prediction-status high"
                                : "prediction-status normal"
                            }
                          >
                            {isHigh
                              ? "High Demand"
                              : "Normal"}
                          </span>
                        </td>

                      </tr>
                    );
                  })}

              </tbody>

            </table>

          </div>
        )}

      </section>

      {/* =========================
          AI INSIGHT
      ========================= */}

      <section className="ai-insight-card">

        <div className="ai-insight-icon">
          <BrainCircuit size={25} />
        </div>

        <div>

          <span>
            AI GRID INSIGHT
          </span>

          <h3>
            {statistics.peak >
            statistics.average * 1.15
              ? "Demand peak detected — grid operators should prepare additional capacity."
              : "Demand is currently within the expected operating range."}
          </h3>

          <p>
            GridPulse continuously analyzes
            historical energy consumption patterns
            to generate demand forecasts for
            proactive grid planning.
          </p>

        </div>

      </section>

    </div>
  );
}

