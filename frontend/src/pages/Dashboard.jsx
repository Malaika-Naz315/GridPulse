import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  ArrowUpRight,
  BatteryCharging,
  BrainCircuit,
  CheckCircle2,
  CloudSun,
  Gauge,
  Leaf,
  RefreshCw,
  ShieldCheck,
  SunMedium,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react";

import {
  getEnergyConsumption,
  getEnergySummary,
  getWeatherData,
  getRenewableEnergy,
  getGridOptimization,
  evaluateForecast,
  getSystemHealth,
} from "../services/api";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "../styles/dashboard.css";


/* =========================================================
   HELPERS
========================================================= */

const number = (value, decimals = 1) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return "--";

  return parsed.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};


const firstValue = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return null;
};


const asArray = (value) => {
  if (Array.isArray(value)) return value;

  if (Array.isArray(value?.data)) return value.data;

  if (Array.isArray(value?.items)) return value.items;

  if (Array.isArray(value?.results)) return value.results;

  return [];
};


const statusText = (
  value,
  fallback = "MONITORING"
) =>
  String(value || fallback)
    .replaceAll("_", " ")
    .toUpperCase();


/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  const [energy, setEnergy] = useState([]);
  const [summary, setSummary] = useState(null);
  const [weather, setWeather] = useState([]);
  const [renewable, setRenewable] = useState([]);
  const [optimization, setOptimization] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);


  /* =======================================================
     LOAD DASHBOARD DATA
  ======================================================= */

  const loadDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const results = await Promise.allSettled([
        getEnergyConsumption(30),
        getEnergySummary(),
        getWeatherData(30),
        getRenewableEnergy(30),
        getGridOptimization(),
        evaluateForecast(),
        getSystemHealth(),
      ]);

      const [
        energyResult,
        summaryResult,
        weatherResult,
        renewableResult,
        optimizationResult,
        evaluationResult,
        healthResult,
      ] = results;


      /* Energy */

      if (energyResult.status === "fulfilled") {
        setEnergy(
          asArray(energyResult.value)
        );
      }


      /* Energy Summary */

      if (summaryResult.status === "fulfilled") {
        setSummary(
          summaryResult.value || null
        );
      }


      /* Weather */

      if (weatherResult.status === "fulfilled") {
        setWeather(
          asArray(weatherResult.value)
        );
      }


      /* Renewable */

      if (renewableResult.status === "fulfilled") {
        setRenewable(
          asArray(renewableResult.value)
        );
      }


      /* Optimization */

      if (optimizationResult.status === "fulfilled") {
        setOptimization(
          optimizationResult.value || null
        );
      }


      /* Forecast Evaluation */

      if (evaluationResult.status === "fulfilled") {
        setEvaluation(
          evaluationResult.value || null
        );
      }


      /* System Health */

      if (healthResult.status === "fulfilled") {
        setSystemHealth(
          healthResult.value || null
        );
      }


      /* Refresh time */

      setLastRefresh(new Date());


      /* Check if every API failed */

      const failed = results.filter(
        (result) =>
          result.status === "rejected"
      );

      if (failed.length === results.length) {
        throw failed[0]?.reason;
      }

    } catch (err) {
      console.error(
        "GridPulse dashboard error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load GridPulse intelligence data. Make sure the FastAPI backend is running."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  /* =======================================================
     INITIAL LOAD + GLOBAL REFRESH
  ======================================================= */

  useEffect(() => {
    loadDashboard();

    const handleGlobalRefresh = () => {
      loadDashboard(true);
    };

    window.addEventListener(
      "gridpulse:refresh",
      handleGlobalRefresh
    );

    return () => {
      window.removeEventListener(
        "gridpulse:refresh",
        handleGlobalRefresh
      );
    };

    // Dashboard intentionally loads once when mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  /* =======================================================
     LATEST DATA
  ======================================================= */

  const latestEnergy =
    energy[0] ||
    energy[energy.length - 1];

  const latestWeather =
    weather[0] ||
    weather[weather.length - 1];

  const latestRenewable =
    renewable[0] ||
    renewable[renewable.length - 1];


  /* =======================================================
     DEMAND CHART
  ======================================================= */

  const chartData = useMemo(() => {
    return [...energy]
      .reverse()
      .map((item, index) => ({
        name: item.timestamp
          ? new Date(
              item.timestamp
            ).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
              }
            )
          : `Point ${index + 1}`,

        demand: Number(
          item.consumption_kwh || 0
        ),
      }));
  }, [energy]);


  /* =======================================================
     LIVE ENERGY METRICS
  ======================================================= */

  const liveMetrics = useMemo(() => {
    const demand = Number(
      firstValue(
        latestEnergy?.consumption_kwh,
        optimization?.demand_kwh,
        summary?.current_demand_kwh,
        0
      )
    );


    const solar = Number(
      firstValue(
        latestRenewable?.solar_production_kwh,
        latestRenewable?.solar_generation_kwh,
        optimization?.solar_kwh,
        0
      )
    );


    const wind = Number(
      firstValue(
        latestRenewable?.wind_generation_kwh,
        latestRenewable?.wind_production_kwh,
        optimization?.wind_kwh,
        0
      )
    );


    const battery = Number(
      firstValue(
        latestRenewable?.battery_storage_kwh,
        optimization?.battery_storage_kwh,
        0
      )
    );


    const renewable =
      solar + wind;


    /*
      Current backend data does not prove
      actual renewable contribution to demand.

      Therefore this is treated as availability
      rather than actual grid coverage.
    */

    const availability = Number(
      firstValue(
        latestRenewable?.renewable_availability_percent,
        latestRenewable?.availability_percent,
        latestRenewable?.renewable_percentage,
        optimization?.renewable_availability_percent,
        optimization?.renewable_percentage,
        null
      )
    );


    const calculatedAvailability =
      demand > 0
        ? (renewable / demand) * 100
        : 0;


    const renewableAvailability =
      Number.isFinite(availability)
        ? availability
        : calculatedAvailability;


    return {
      demand,
      solar,
      wind,
      battery,
      renewable,
      coverage: renewableAvailability,
    };
  }, [
    latestEnergy,
    latestRenewable,
    optimization,
    summary,
  ]);


  /* =======================================================
     FORECAST MODEL
  ======================================================= */

  const forecast = useMemo(() => {
    return {
      r2: firstValue(
        evaluation?.r2_score,
        evaluation?.r2,
        evaluation?.R2
      ),

      mae: firstValue(
        evaluation?.mae,
        evaluation?.MAE
      ),

      rmse: firstValue(
        evaluation?.rmse,
        evaluation?.RMSE
      ),

      testing: firstValue(
        evaluation?.testing_records,
        evaluation?.test_records,
        evaluation?.test_size
      ),

      training: firstValue(
        evaluation?.training_records,
        evaluation?.train_records,
        evaluation?.train_size
      ),

      model:
        evaluation?.model_name ||
        evaluation?.model ||
        "Random Forest",
    };
  }, [evaluation]);


  /* =======================================================
     WEATHER
  ======================================================= */

  const weatherMetrics = useMemo(() => {
    return {
      temperature: firstValue(
        latestWeather?.temperature,
        latestWeather?.temperature_c,
        latestWeather?.temp_c
      ),

      humidity: firstValue(
        latestWeather?.humidity,
        latestWeather?.humidity_percent
      ),

      wind: firstValue(
        latestWeather?.wind_speed,
        latestWeather?.wind_speed_kmh
      ),
    };
  }, [latestWeather]);


  /* =======================================================
     GRID STATUS
  ======================================================= */

  const gridStatus = statusText(
    optimization?.grid_status,
    "SYSTEM MONITORING"
  );


  const optimizationAction =
    optimization?.recommended_action ||
    optimization?.recommendation ||
    "Continue monitoring current grid conditions.";


  const batteryAction =
    optimization?.battery_action ||
    "Maintain battery reserve and monitor grid balance.";


  const statusClass =
    gridStatus === "STABLE" ||
    gridStatus === "NORMAL"
      ? "good"
      : gridStatus ===
            "IMPORT REQUIRED" ||
          gridStatus === "WARNING"
        ? "warning"
        : "info";


  /* =======================================================
     FORECAST STATUS
  ======================================================= */

  const forecastScore = Number(
    forecast.r2 ?? 0
  );


  const forecastStatus =
    forecast.r2 === null
      ? "MONITORING"
      : forecastScore >= 0.9
        ? "EXCELLENT"
        : forecastScore >= 0.75
          ? "GOOD"
          : "MONITOR";


  /* =======================================================
     SYSTEM HEALTH
  ======================================================= */

  const healthStatus = String(
    systemHealth?.status ||
      systemHealth?.message ||
      "CONNECTED"
  ).toUpperCase();


  const systemOperational =
    healthStatus.includes("HEALTH") ||
    healthStatus.includes("OK") ||
    healthStatus.includes("CONNECTED") ||
    healthStatus.includes("ONLINE");


  /* =======================================================
     NOTIFICATIONS / INTELLIGENCE UPDATES
  ======================================================= */

  const notifications = useMemo(() => {
    const items = [];


    if (
      gridStatus !== "STABLE" &&
      gridStatus !== "NORMAL" &&
      gridStatus !== "SYSTEM MONITORING"
    ) {
      items.push({
        type: "warning",
        text: `Grid status: ${gridStatus}`,
      });
    }


    if (
      forecast.r2 !== null &&
      Number(forecast.r2) < 0.75
    ) {
      items.push({
        type: "warning",
        text: "Forecast model performance needs attention.",
      });
    }


    if (optimizationAction) {
      items.push({
        type: "info",
        text: optimizationAction,
      });
    }


    if (items.length === 0) {
      items.push({
        type: "success",
        text: "GridPulse core intelligence services are operating normally.",
      });
    }


    return items;
  }, [
    gridStatus,
    forecast.r2,
    optimizationAction,
  ]);


  /*
    Make notifications available to the application shell.
    The App header can listen to this event later.
  */

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(
        "gridpulse:notifications",
        {
          detail: notifications,
        }
      )
    );
  }, [notifications]);


  /* =======================================================
     LOADING SCREEN
  ======================================================= */

  if (loading) {
    return (
      <div className="dashboard-page dashboard-loading">
        <div className="loading-orb">
          <Zap size={30} />
        </div>

        <h2>
          Initializing GridPulse Intelligence
        </h2>

        <p>
          Connecting energy, forecasting,
          renewable and grid intelligence
          services...
        </p>

        <div className="loading-bar">
          <span />
        </div>
      </div>
    );
  }


  /* =======================================================
     ERROR SCREEN
  ======================================================= */

  if (
    error &&
    energy.length === 0
  ) {
    return (
      <div className="dashboard-page dashboard-error">
        <div className="error-icon">
          <Activity size={30} />
        </div>

        <h2>
          GridPulse is temporarily unavailable
        </h2>

        <p>{error}</p>

        <button
          className="primary-button"
          onClick={() =>
            loadDashboard()
          }
        >
          <RefreshCw size={17} />
          Try Again
        </button>
      </div>
    );
  }


  /* =======================================================
     MAIN DASHBOARD
  ======================================================= */

  return (
    <main className="dashboard-page">

      {/* ===================================================
          HERO
      =================================================== */}

      <section className="command-hero">
        <div className="hero-background-grid" />

        <div className="hero-content">

          <div className="hero-eyebrow">
            <span className="status-dot" />

            NATIONAL SMART GRID

            <span className="eyebrow-divider" />

            LIVE INTELLIGENCE
          </div>


          <h1>
            GridPulse
            <span> Command Center</span>
          </h1>


          <p className="hero-description">
            AI-powered visibility into energy
            consumption, renewable generation,
            battery storage and intelligent
            grid operations.
          </p>


          <div className="hero-actions">

            <button
              className="primary-button"
              onClick={() =>
                loadDashboard(true)
              }
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh Intelligence"}
            </button>


            <div
              className={`hero-status ${statusClass}`}
            >
              <ShieldCheck size={16} />

              <span>
                GRID STATUS
              </span>

              <strong>
                {gridStatus}
              </strong>
            </div>

          </div>
        </div>


        <div className="hero-visual">

          <div className="hero-ring ring-one" />
          <div className="hero-ring ring-two" />

          <div className="hero-core">
            <Zap size={32} />
          </div>


          <div className="hero-node node-top">
            <SunMedium size={17} />
            <span>SOLAR</span>
          </div>


          <div className="hero-node node-right">
            <Wind size={17} />
            <span>WIND</span>
          </div>


          <div className="hero-node node-bottom">
            <BatteryCharging size={17} />
            <span>STORAGE</span>
          </div>


          <div className="hero-connection connection-one" />
          <div className="hero-connection connection-two" />
          <div className="hero-connection connection-three" />

        </div>
      </section>


      {/* ===================================================
          KPI CARDS
      =================================================== */}

      <section className="kpi-grid">

        <article className="kpi-card kpi-primary">

          <div className="kpi-heading">
            <div className="kpi-icon">
              <Gauge size={20} />
            </div>

            <span>
              CURRENT CONSUMPTION
            </span>
          </div>


          <div className="kpi-value">
            {number(
              liveMetrics.demand,
              1
            )}

            <small> kWh</small>
          </div>


          <div className="kpi-footer">
            <span>
              Latest grid reading
            </span>

            <Zap size={14} />
          </div>

        </article>


        <article className="kpi-card kpi-green">

          <div className="kpi-heading">
            <div className="kpi-icon">
              <Leaf size={20} />
            </div>

            <span>
              RENEWABLE AVAILABILITY
            </span>
          </div>


          <div className="kpi-value">
            {number(
              liveMetrics.coverage,
              1
            )}

            <small>%</small>
          </div>


          <div className="kpi-footer">
            <span>
              Solar + wind availability
            </span>

            <ArrowUpRight size={14} />
          </div>

        </article>


        <article className="kpi-card kpi-blue">

          <div className="kpi-heading">
            <div className="kpi-icon">
              <BatteryCharging size={20} />
            </div>

            <span>
              BATTERY RESERVE
            </span>
          </div>


          <div className="kpi-value">
            {number(
              liveMetrics.battery,
              1
            )}

            <small> kWh</small>
          </div>


          <div className="kpi-footer">
            <span>
              Available storage
            </span>

            <CheckCircle2 size={14} />
          </div>

        </article>


        <article className="kpi-card kpi-purple">

          <div className="kpi-heading">
            <div className="kpi-icon">
              <BrainCircuit size={20} />
            </div>

            <span>
              FORECAST R²
            </span>
          </div>


          <div className="kpi-value">
            {forecast.r2 !== null
              ? number(
                  forecast.r2,
                  4
                )
              : "--"}
          </div>


          <div className="kpi-footer">
            <span>
              {forecastStatus}
            </span>

            <TrendingUp size={14} />
          </div>

        </article>

      </section>


      {/* ===================================================
          MAIN ANALYTICS
      =================================================== */}

      <section className="dashboard-grid dashboard-grid-main">

        {/* DEMAND TREND */}

        <article className="panel forecast-panel">

          <div className="panel-header">

            <div>

              <div className="panel-kicker">
                <TrendingUp size={14} />
                DEMAND INTELLIGENCE
              </div>

              <h2>
                Energy Demand Trend
              </h2>

              <p>
                Recent recorded grid consumption
                from the energy monitoring service.
              </p>

            </div>


            <div className="chart-status">
              <span className="legend-dot" />
              ACTUAL CONSUMPTION
            </div>

          </div>


          <div className="chart-container">

            {chartData.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <AreaChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0,
                  }}
                >

                  <defs>

                    <linearGradient
                      id="demandGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >

                      <stop
                        offset="0%"
                        stopColor="#38BDF8"
                        stopOpacity={0.32}
                      />

                      <stop
                        offset="100%"
                        stopColor="#38BDF8"
                        stopOpacity={0.02}
                      />

                    </linearGradient>

                  </defs>


                  <CartesianGrid
                    stroke="#E2E8F0"
                    strokeDasharray="4 5"
                    vertical={false}
                  />


                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#64748B",
                      fontSize: 11,
                    }}
                  />


                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#64748B",
                      fontSize: 11,
                    }}
                  />


                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border:
                        "1px solid #E2E8F0",
                      boxShadow:
                        "0 10px 30px rgba(15, 23, 42, 0.10)",
                    }}
                    formatter={(value) => [
                      `${number(
                        value,
                        2
                      )} kWh`,
                      "Consumption",
                    ]}
                  />


                  <Area
                    type="monotone"
                    dataKey="demand"
                    stroke="#0284C7"
                    strokeWidth={2.5}
                    fill="url(#demandGradient)"
                    activeDot={{
                      r: 5,
                      strokeWidth: 2,
                    }}
                  />

                </AreaChart>

              </ResponsiveContainer>

            ) : (

              <div className="empty-chart">
                <Activity size={24} />
                <span>
                  No demand history available
                </span>
              </div>

            )}

          </div>
        </article>


        {/* GRID BALANCE */}

        <article className="panel grid-balance-panel">

          <div className="panel-header compact">

            <div>

              <div className="panel-kicker">
                <Zap size={14} />
                GRID BALANCE
              </div>

              <h2>
                Live Power Flow
              </h2>

            </div>


            <span className="live-badge">
              <span />
              LIVE
            </span>

          </div>


          <div className="power-network">

            <div className="network-line line-solar" />
            <div className="network-line line-wind" />
            <div className="network-line line-battery" />
            <div className="network-line line-load" />


            <div className="power-node solar-node">

              <div className="node-icon">
                <SunMedium size={19} />
              </div>

              <span>SOLAR</span>

              <strong>
                {number(
                  liveMetrics.solar,
                  1
                )}

                <small> kWh</small>
              </strong>

            </div>


            <div className="power-node wind-node">

              <div className="node-icon">
                <Wind size={19} />
              </div>

              <span>WIND</span>

              <strong>
                {number(
                  liveMetrics.wind,
                  1
                )}

                <small> kWh</small>
              </strong>

            </div>


            <div className="main-grid-node">

              <div className="main-grid-icon">
                <Zap size={24} />
              </div>

              <span>
                MAIN GRID
              </span>

              <strong>
                {number(
                  liveMetrics.demand,
                  1
                )}

                <small> kWh</small>
              </strong>

            </div>


            <div className="power-node battery-node">

              <div className="node-icon">
                <BatteryCharging size={19} />
              </div>

              <span>
                BATTERY
              </span>

              <strong>
                {number(
                  liveMetrics.battery,
                  1
                )}

                <small> kWh</small>
              </strong>

            </div>


            <div className="power-node load-node">

              <div className="node-icon">
                <Activity size={19} />
              </div>

              <span>
                CITY LOAD
              </span>

              <strong>
                ACTIVE
              </strong>

            </div>


            <span className="flow-pulse flow-one" />
            <span className="flow-pulse flow-two" />
            <span className="flow-pulse flow-three" />

          </div>


          <div className="network-footer">
            <span>GENERATION</span>
            <span>TRANSMISSION</span>
            <span>STORAGE</span>
            <span>CONSUMPTION</span>
          </div>

        </article>

      </section>


      {/* ===================================================
          SECONDARY INTELLIGENCE
      =================================================== */}

      <section className="dashboard-grid dashboard-grid-secondary">

        {/* RENEWABLE */}

        <article className="panel renewable-panel">

          <div className="panel-header compact">

            <div>

              <div className="panel-kicker">
                <Leaf size={14} />
                RENEWABLE INTELLIGENCE
              </div>

              <h2>
                Renewable Generation
              </h2>

            </div>


            <span className="panel-badge blue">
              {number(
                liveMetrics.coverage,
                1
              )}
              %
            </span>

          </div>


          <div className="renewable-bars">

            <div className="source-row">

              <div className="source-info">

                <div className="source-icon solar">
                  <SunMedium size={17} />
                </div>

                <div>
                  <strong>
                    Solar
                  </strong>

                  <span>
                    Current generation
                  </span>
                </div>

              </div>


              <strong className="source-value">
                {number(
                  liveMetrics.solar,
                  1
                )}

                <small> kWh</small>
              </strong>

            </div>


            <div className="progress-track">

              <span
                style={{
                  width: `${Math.min(
                    Math.max(
                      liveMetrics.coverage,
                      0
                    ),
                    100
                  )}%`,
                }}
              />

            </div>


            <div className="source-row">

              <div className="source-info">

                <div className="source-icon wind">
                  <Wind size={17} />
                </div>

                <div>
                  <strong>
                    Wind
                  </strong>

                  <span>
                    Current generation
                  </span>
                </div>

              </div>


              <strong className="source-value">
                {number(
                  liveMetrics.wind,
                  1
                )}

                <small> kWh</small>
              </strong>

            </div>


            <div className="renewable-total">

              <div>

                <span>
                  TOTAL RENEWABLE
                </span>

                <strong>
                  {number(
                    liveMetrics.renewable,
                    1
                  )}{" "}
                  kWh
                </strong>

              </div>

              <Leaf size={23} />

            </div>

          </div>

        </article>


        {/* WEATHER */}

        <article className="panel weather-panel">

          <div className="panel-header compact">

            <div>

              <div className="panel-kicker">
                <CloudSun size={14} />
                WEATHER INTELLIGENCE
              </div>

              <h2>
                Environmental Conditions
              </h2>

            </div>

          </div>


          <div className="weather-main">

            <div className="weather-icon">
              <CloudSun size={34} />
            </div>


            <div>

              <strong>

                {weatherMetrics.temperature !==
                null
                  ? number(
                      weatherMetrics.temperature,
                      1
                    )
                  : "--"}

                <small>°C</small>

              </strong>


              <span>
                Current temperature
              </span>

            </div>

          </div>


          <div className="weather-stats">

            <div>

              <span>
                HUMIDITY
              </span>

              <strong>

                {weatherMetrics.humidity !==
                null
                  ? number(
                      weatherMetrics.humidity,
                      0
                    )
                  : "--"}

                %

              </strong>

            </div>


            <div>

              <span>
                WIND SPEED
              </span>

              <strong>

                {weatherMetrics.wind !==
                null
                  ? number(
                      weatherMetrics.wind,
                      1
                    )
                  : "--"}

                <small>
                  km/h
                </small>

              </strong>

            </div>

          </div>


          <div className="weather-note">

            <Activity size={15} />

            Environmental data is available
            to support grid intelligence and
            demand analysis.

          </div>

        </article>


        {/* OPTIMIZATION */}

        <article className="panel optimization-panel">

          <div className="panel-header compact">

            <div>

              <div className="panel-kicker">
                <BrainCircuit size={14} />
                AI GRID OPTIMIZATION
              </div>

              <h2>
                Recommended Action
              </h2>

            </div>


            <span className="ai-badge">
              <span />
              AI
            </span>

          </div>


          <div className="optimization-highlight">

            <div className="optimization-icon">
              <Zap size={22} />
            </div>


            <div>

              <span>
                GRID ACTION
              </span>

              <strong>
                {optimizationAction}
              </strong>

            </div>

          </div>


          <div className="optimization-details">

            <div>

              <span>
                GRID CONDITION
              </span>

              <strong>
                {gridStatus}
              </strong>

            </div>


            <div>

              <span>
                BATTERY ACTION
              </span>

              <strong>
                {batteryAction}
              </strong>

            </div>

          </div>

        </article>

      </section>


      {/* ===================================================
          FORECAST + AI STATUS
      =================================================== */}

      <section className="dashboard-grid dashboard-grid-bottom">

        {/* FORECAST MODEL */}

        <article className="panel model-panel">

          <div className="panel-header compact">

            <div>

              <div className="panel-kicker">
                <BrainCircuit size={14} />
                FORECAST MODEL
              </div>

              <h2>
                Model Performance
              </h2>

            </div>


            <span className="model-status">
              {forecastStatus}
            </span>

          </div>


          <div className="model-overview">

            <div className="model-score">

              <strong>
                {forecast.r2 !== null
                  ? number(
                      forecast.r2,
                      4
                    )
                  : "--"}
              </strong>

              <span>
                R² SCORE
              </span>

            </div>


            <div className="model-name">

              <span>
                MODEL
              </span>

              <strong>
                {forecast.model}
              </strong>

            </div>

          </div>


          <div className="model-metrics">

            <div>
              <span>MAE</span>

              <strong>
                {forecast.mae !== null
                  ? number(
                      forecast.mae,
                      2
                    )
                  : "--"}
              </strong>
            </div>


            <div>
              <span>RMSE</span>

              <strong>
                {forecast.rmse !== null
                  ? number(
                      forecast.rmse,
                      2
                    )
                  : "--"}
              </strong>
            </div>


            <div>
              <span>TEST SET</span>

              <strong>
                {forecast.testing ??
                  "--"}
              </strong>
            </div>


            <div>
              <span>TRAIN SET</span>

              <strong>
                {forecast.training ??
                  "--"}
              </strong>
            </div>

          </div>

        </article>


        {/* AI CORE */}

        <article className="panel system-panel">

          <div className="system-panel-main">

            <div className="system-icon">
              <BrainCircuit size={24} />
            </div>


            <div>

              <div className="panel-kicker">
                <Activity size={14} />
                GRIDPULSE AI CORE
              </div>


              <h2>
                {systemOperational
                  ? "Intelligence systems operational"
                  : "Intelligence systems require attention"}
              </h2>


              <p>
                Demand, renewable availability,
                weather and grid optimization
                services are connected to the
                command center.
              </p>

            </div>

          </div>


          <div className="system-services">

            <div>
              <CheckCircle2 size={16} />
              Energy Monitoring
            </div>


            <div>
              <CheckCircle2 size={16} />
              Demand Forecasting
            </div>


            <div>
              <CheckCircle2 size={16} />
              Renewable Intelligence
            </div>


            <div>
              <CheckCircle2 size={16} />
              Grid Optimization
            </div>

          </div>


          <div className="system-live">

            <span className="status-dot" />

            {systemOperational
              ? "ALL CORE SERVICES CONNECTED"
              : `SYSTEM STATUS: ${healthStatus}`}

          </div>

        </article>

      </section>


      {/* ===================================================
          FOOTER STATUS
      =================================================== */}

      <section className="dashboard-footer-status">

        <div>

          <span className="status-dot" />

          GRIDPULSE PLATFORM

          <strong>
            {systemOperational
              ? "OPERATIONAL"
              : "CHECK SYSTEM"}
          </strong>

        </div>


        <div>

          <span>
            Energy records:
          </span>

          <strong>
            {energy.length || 0}
          </strong>

        </div>


        <div>

          <span>
            Renewable records:
          </span>

          <strong>
            {renewable.length || 0}
          </strong>

        </div>


        <div>

          <span>
            Last refresh:
          </span>

          <strong>
            {lastRefresh
              ? lastRefresh.toLocaleTimeString(
                  undefined,
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )
              : "--"}
          </strong>

        </div>

      </section>

    </main>
  );
}