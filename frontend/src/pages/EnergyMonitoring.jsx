import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BatteryCharging,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gauge,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  Signal,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react";

import {
  getEnergyConsumption,
  getEnergySummary,
  getLatestMeterReading,
} from "../services/api";

import "../styles/energy-monitoring.css";

/* =========================================================
   HELPERS
========================================================= */

const getValue = (
  object,
  keys,
  fallback = null
) => {
  if (!object || typeof object !== "object") {
    return fallback;
  }

  for (const key of keys) {
    if (
      object[key] !== undefined &&
      object[key] !== null &&
      object[key] !== ""
    ) {
      return object[key];
    }
  }

  return fallback;
};

const formatNumber = (
  value,
  digits = 2
) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toLocaleString(
    undefined,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    }
  );
};

const parseDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
};

const formatTime = (value) => {
  const date = parseDate(value);

  if (!date) {
    return "—";
  }

  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

const formatDateTime = (value) => {
  const date = parseDate(value);

  if (!date) {
    return "Unknown timestamp";
  }

  return date.toLocaleString(
    [],
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

/* =========================================================
   NORMALIZE ENERGY RECORD
========================================================= */

const normalizeEnergyRecord = (
  item,
  index
) => {
  const timestamp = getValue(
    item,
    [
      "timestamp",
      "datetime",
      "date_time",
      "recorded_at",
      "created_at",
      "date",
    ]
  );

  const consumption = Number(
    getValue(
      item,
      [
        "consumption_kwh",
        "energy_consumption",
        "consumption",
        "energy",
        "load",
        "demand",
        "power_consumption",
        "value",
      ],
      0
    )
  );

  return {
    id:
      item?.id ??
      `energy-${index}`,

    timestamp,

    consumption:
      Number.isFinite(consumption)
        ? consumption
        : 0,

    raw: item,
  };
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function EnergyMonitoring() {
  const [records, setRecords] =
    useState([]);

  const [summary, setSummary] =
    useState(null);

  const [latestReading, setLatestReading] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [selectedRange, setSelectedRange] =
    useState("12");

  /* =======================================================
     LOAD ENERGY DATA

     IMPORTANT:
     Promise.allSettled prevents one slow API from
     blocking the entire page.
  ======================================================= */

  const loadEnergyData = useCallback(
    async (refresh = false) => {
      try {
        setError("");

        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const results =
          await Promise.allSettled([
            getEnergyConsumption(100),
            getEnergySummary(),
            getLatestMeterReading(),
          ]);

        const [
          consumptionResult,
          summaryResult,
          latestResult,
        ] = results;

        /* ================================================
           CONSUMPTION DATA
        ================================================= */

        if (
          consumptionResult.status ===
          "fulfilled"
        ) {
          const response =
            consumptionResult.value;

          const consumptionArray =
            Array.isArray(response)
              ? response
              : response?.data ||
                response?.results ||
                response?.items ||
                [];

          const normalized =
            consumptionArray
              .map(
                normalizeEnergyRecord
              )
              .filter(
                (item) =>
                  item.consumption > 0
              )
              .sort(
                (a, b) => {
                  const first =
                    parseDate(
                      a.timestamp
                    )?.getTime() ?? 0;

                  const second =
                    parseDate(
                      b.timestamp
                    )?.getTime() ?? 0;

                  return first - second;
                }
              );

          setRecords(normalized);
        } else {
          console.error(
            "Energy consumption API:",
            consumptionResult.reason
          );

          setRecords([]);
        }

        /* ================================================
           SUMMARY DATA
        ================================================= */

        if (
          summaryResult.status ===
          "fulfilled"
        ) {
          setSummary(
            summaryResult.value || null
          );
        } else {
          console.error(
            "Energy summary API:",
            summaryResult.reason
          );

          setSummary(null);
        }

        /* ================================================
           LATEST READING
        ================================================= */

        if (
          latestResult.status ===
          "fulfilled"
        ) {
          const latest =
            latestResult.value;

          setLatestReading(
            latest
              ? normalizeEnergyRecord(
                  latest,
                  0
                )
              : null
          );
        } else {
          console.error(
            "Latest meter API:",
            latestResult.reason
          );

          setLatestReading(null);
        }

        /* ================================================
           SHOW ERROR ONLY IF ALL REQUESTS FAILED
        ================================================= */

        const allFailed = results.every(
          (result) =>
            result.status ===
            "rejected"
        );

        if (allFailed) {
          const firstError =
            results.find(
              (result) =>
                result.status ===
                "rejected"
            )?.reason;

          setError(
            firstError?.response
              ?.data?.detail ||
              firstError?.message ||
              "Unable to connect with the energy intelligence service."
          );
        }
      } catch (err) {
        console.error(
          "Energy Monitoring:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Unable to connect with the energy intelligence service."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadEnergyData(false);
  }, [loadEnergyData]);

  /* =======================================================
     AUTO REFRESH EVERY 30 SECONDS
  ======================================================= */

  useEffect(() => {
    const interval =
      setInterval(() => {
        loadEnergyData(true);
      }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [loadEnergyData]);

  /* =======================================================
     ANALYTICS
  ======================================================= */

  const analytics = useMemo(() => {
    if (!records.length) {
      return {
        latest: 0,
        average: 0,
        peak: 0,
        minimum: 0,
        total: 0,
        trend: 0,
        trendDirection: "stable",
      };
    }

    const values =
      records.map(
        (record) =>
          record.consumption
      );

    const latest =
      latestReading?.consumption ??
      values[values.length - 1];

    const previous =
      values.length > 1
        ? values[values.length - 2]
        : latest;

    const average =
      values.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / values.length;

    const peak =
      Math.max(...values);

    const minimum =
      Math.min(...values);

    const total =
      values.reduce(
        (sum, value) =>
          sum + value,
        0
      );

    const trend =
      previous !== 0
        ? ((latest - previous) /
            previous) *
          100
        : 0;

    return {
      latest,
      average,
      peak,
      minimum,
      total,
      trend,

      trendDirection:
        trend > 1
          ? "up"
          : trend < -1
          ? "down"
          : "stable",
    };
  }, [
    records,
    latestReading,
  ]);

  /* =======================================================
     SUMMARY METRICS
  ======================================================= */

  const summaryMetrics =
    useMemo(() => {
      const summaryTotal =
        Number(
          getValue(
            summary,
            [
              "total_consumption_kwh",
              "total_consumption",
              "total_energy",
              "total_energy_consumption",
              "total",
            ]
          )
        );

      const summaryAverage =
        Number(
          getValue(
            summary,
            [
              "average_consumption_kwh",
              "average_consumption",
              "avg_consumption",
              "mean_consumption",
            ]
          )
        );

      const summaryPeak =
        Number(
          getValue(
            summary,
            [
              "peak_consumption_kwh",
              "peak_consumption",
              "peak_demand",
              "max_consumption",
            ]
          )
        );

      return {
        total:
          Number.isFinite(
            summaryTotal
          )
            ? summaryTotal
            : analytics.total,

        average:
          Number.isFinite(
            summaryAverage
          )
            ? summaryAverage
            : analytics.average,

        peak:
          Number.isFinite(
            summaryPeak
          )
            ? summaryPeak
            : analytics.peak,
      };
    }, [
      summary,
      analytics,
    ]);

  /* =======================================================
     VISIBLE RECORDS
  ======================================================= */

  const visibleRecords =
    useMemo(() => {
      const count =
        Number(selectedRange);

      return records.slice(-count);
    }, [
      records,
      selectedRange,
    ]);

  /* =======================================================
     CHART MAX
  ======================================================= */

  const chartMax =
    useMemo(() => {
      if (!visibleRecords.length) {
        return 1;
      }

      return Math.max(
        ...visibleRecords.map(
          (record) =>
            record.consumption
        ),
        1
      );
    }, [visibleRecords]);

  /* =======================================================
     CHART MIN
  ======================================================= */

  const chartMin =
    useMemo(() => {
      if (!visibleRecords.length) {
        return 0;
      }

      return Math.min(
        ...visibleRecords.map(
          (record) =>
            record.consumption
        )
      );
    }, [visibleRecords]);

  /* =======================================================
     LOAD STATUS
  ======================================================= */

  const loadStatus =
    useMemo(() => {
      if (!analytics.average) {
        return {
          label: "STANDBY",
          description:
            "Waiting for telemetry",
          className: "standby",
        };
      }

      const ratio =
        analytics.latest /
        analytics.average;

      if (ratio >= 1.25) {
        return {
          label: "HIGH LOAD",
          description:
            "Demand above normal range",
          className: "high",
        };
      }

      if (ratio >= 1.08) {
        return {
          label: "ELEVATED",
          description:
            "Demand slightly above average",
          className: "elevated",
        };
      }

      return {
        label: "NORMAL",
        description:
          "Grid demand within range",
        className: "normal",
      };
    }, [analytics]);

  /* =======================================================
     LATEST RECORD
  ======================================================= */

  const latestRecord =
    latestReading ||
    (records.length > 0
      ? records[
          records.length - 1
        ]
      : null);

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh =
    useCallback(() => {
      loadEnergyData(true);
    }, [loadEnergyData]);

  /* =======================================================
     INITIAL LOADING SCREEN
  ======================================================= */

  if (loading) {
    return (
      <main className="energy-monitoring-page">

        <div className="energy-loading-state">

          <div className="energy-loading-core">
            <div className="energy-loading-ring" />

            <Zap size={27} />
          </div>

          <span>
            GRIDPULSE / ENERGY INTELLIGENCE
          </span>

          <h2>
            Initializing grid telemetry
          </h2>

          <p>
            Connecting to smart-meter data
            streams and preparing consumption
            analytics...
          </p>

        </div>

      </main>
    );
  }

  return (
    <main className="energy-monitoring-page">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <section className="energy-command-header">

        <div className="energy-title-area">

          <div className="energy-breadcrumb">

            <span>
              GRID OPERATIONS
            </span>

            <ChevronRight size={12} />

            <strong>
              ENERGY MONITORING
            </strong>

          </div>

          <div className="energy-title-row">

            <div className="energy-title-icon">
              <Waves size={23} />
            </div>

            <div>

              <div className="energy-live-label">

                <span className="energy-live-pulse" />

                LIVE TELEMETRY

              </div>

              <h1>
                Energy{" "}
                <span>
                  Monitoring
                </span>
              </h1>

              <p>
                Real-time visibility into
                electricity consumption, grid
                load behavior and smart-meter
                telemetry.
              </p>

            </div>

          </div>

        </div>

        <div className="energy-command-actions">

          <div className="energy-system-state">

            <span className="energy-system-dot" />

            <div>

              <strong>
                GRID ONLINE
              </strong>

              <small>
                Telemetry operational
              </small>

            </div>

          </div>

          <button
            type="button"
            className="energy-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
          >

            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "energy-refresh-spin"
                  : ""
              }
            />

            {refreshing
              ? "Syncing"
              : "Sync Data"}

          </button>

        </div>

      </section>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <section className="energy-alert energy-alert-error">

          <div className="energy-alert-icon">
            <AlertTriangle size={17} />
          </div>

          <div>

            <strong>
              Telemetry connection issue
            </strong>

            <span>
              {error}
            </span>

          </div>

          <button
            type="button"
            onClick={handleRefresh}
          >
            Retry
          </button>

        </section>
      )}

      {/* =====================================================
          LIVE TELEMETRY STRIP
      ====================================================== */}

      <section className="energy-telemetry-strip">

        <div className="energy-telemetry-item">

          <div className="telemetry-icon">
            <Radio size={16} />
          </div>

          <div>

            <span>
              DATA STREAM
            </span>

            <strong>
              Smart Meter Network
            </strong>

          </div>

        </div>

        <div className="energy-telemetry-divider" />

        <div className="energy-telemetry-item">

          <div className="telemetry-icon">
            <Server size={16} />
          </div>

          <div>

            <span>
              RECORDS PROCESSED
            </span>

            <strong>
              {formatNumber(
                records.length,
                0
              )}
            </strong>

          </div>

        </div>

        <div className="energy-telemetry-divider" />

        <div className="energy-telemetry-item">

          <div className="telemetry-icon">
            <Clock3 size={16} />
          </div>

          <div>

            <span>
              LAST READING
            </span>

            <strong>
              {latestRecord
                ? formatDateTime(
                    latestRecord.timestamp
                  )
                : "No reading"}
            </strong>

          </div>

        </div>

        <div className="energy-stream-status">

          <Signal size={14} />

          STREAM ACTIVE

        </div>

      </section>

      {/* =====================================================
          PRIMARY KPI MATRIX
      ====================================================== */}

      <section className="energy-kpi-grid">

        {/* LIVE DEMAND */}

        <article className="energy-kpi featured">

          <div className="energy-kpi-header">

            <div className="energy-kpi-symbol">
              <Zap size={18} />
            </div>

            <span>
              LIVE DEMAND
            </span>

            <div
              className={`energy-load-pill ${loadStatus.className}`}
            >

              <span />

              {loadStatus.label}

            </div>

          </div>

          <div className="energy-kpi-value">

            {formatNumber(
              analytics.latest
            )}

            <small>
              kWh
            </small>

          </div>

          <div className="energy-kpi-bottom">

            <span>
              {loadStatus.description}
            </span>

            <div
              className={`energy-trend ${analytics.trendDirection}`}
            >

              {analytics.trendDirection ===
              "up" ? (
                <ArrowUpRight size={13} />
              ) : analytics.trendDirection ===
                "down" ? (
                <ArrowDownRight size={13} />
              ) : (
                <Activity size={13} />
              )}

              {Math.abs(
                analytics.trend
              ).toFixed(1)}
              %

            </div>

          </div>

        </article>

        {/* AVERAGE */}

        <article className="energy-kpi">

          <div className="energy-kpi-header">

            <div className="energy-kpi-symbol blue">
              <Gauge size={18} />
            </div>

            <span>
              AVERAGE LOAD
            </span>

          </div>

          <div className="energy-kpi-value">

            {formatNumber(
              summaryMetrics.average
            )}

            <small>
              kWh
            </small>

          </div>

          <div className="energy-kpi-description">
            Baseline monitored demand
          </div>

        </article>

        {/* PEAK */}

        <article className="energy-kpi">

          <div className="energy-kpi-header">

            <div className="energy-kpi-symbol amber">
              <TrendingUp size={18} />
            </div>

            <span>
              PEAK DEMAND
            </span>

          </div>

          <div className="energy-kpi-value">

            {formatNumber(
              summaryMetrics.peak
            )}

            <small>
              kWh
            </small>

          </div>

          <div className="energy-kpi-description">
            Highest observed load
          </div>

        </article>

        {/* TELEMETRY */}

        <article className="energy-kpi">

          <div className="energy-kpi-header">

            <div className="energy-kpi-symbol green">
              <Activity size={18} />
            </div>

            <span>
              TELEMETRY
            </span>

          </div>

          <div className="energy-kpi-value">

            {formatNumber(
              records.length,
              0
            )}

            <small>
              PTS
            </small>

          </div>

          <div className="energy-kpi-description">
            Consumption readings available
          </div>

        </article>

      </section>

      {/* =====================================================
          ANALYTICS WORKSPACE
      ====================================================== */}

      <section className="energy-workspace">

        {/* ===================================================
            CHART
        ==================================================== */}

        <article className="energy-panel energy-chart-panel">

          <header className="energy-panel-header">

            <div>

              <div className="energy-panel-kicker">
                LOAD TELEMETRY
              </div>

              <h2>
                Consumption Behavior
              </h2>

              <p>
                Recent electricity demand across
                the monitored smart-meter stream.
              </p>

            </div>

            <div className="energy-range-switcher">

              {[
                ["6", "6"],
                ["12", "12"],
                ["24", "24"],
              ].map(
                ([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={
                      selectedRange ===
                      value
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setSelectedRange(
                        value
                      )
                    }
                  >
                    {label}
                  </button>
                )
              )}

            </div>

          </header>

          <div className="energy-chart-meta">

            <div>
              <span>
                MAX
              </span>

              <strong>
                {formatNumber(
                  chartMax
                )}
              </strong>
            </div>

            <div>
              <span>
                MIN
              </span>

              <strong>
                {formatNumber(
                  chartMin
                )}
              </strong>
            </div>

            <div>
              <span>
                AVERAGE
              </span>

              <strong>
                {formatNumber(
                  summaryMetrics.average
                )}
              </strong>
            </div>

          </div>

          {visibleRecords.length >
          0 ? (
            <div className="energy-visual-chart">

              <div className="energy-chart-scale">

                <span>
                  {formatNumber(
                    chartMax
                  )}
                </span>

                <span>
                  {formatNumber(
                    chartMax *
                      0.75
                  )}
                </span>

                <span>
                  {formatNumber(
                    chartMax *
                      0.5
                  )}
                </span>

                <span>
                  {formatNumber(
                    chartMax *
                      0.25
                  )}
                </span>

                <span>
                  0
                </span>

              </div>

              <div className="energy-chart-canvas">

                <div className="energy-chart-guides">

                  <span />
                  <span />
                  <span />
                  <span />
                  <span />

                </div>

                <div className="energy-bars">

                  {visibleRecords.map(
                    (record) => {
                      const percentage =
                        chartMax > 0
                          ? (record.consumption /
                              chartMax) *
                            100
                          : 0;

                      return (
                        <div
                          className="energy-bar-group"
                          key={record.id}
                          title={`${formatNumber(
                            record.consumption
                          )} kWh`}
                        >

                          <div className="energy-bar-track">

                            <div
                              className="energy-bar-fill"
                              style={{
                                height: `${Math.max(
                                  percentage,
                                  3
                                )}%`,
                              }}
                            />

                          </div>

                          <span>
                            {formatTime(
                              record.timestamp
                            )}
                          </span>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

            </div>
          ) : (
            <div className="energy-empty">

              <BarChart3 size={30} />

              <strong>
                No telemetry available
              </strong>

              <span>
                Consumption readings will appear
                here when the meter stream becomes
                available.
              </span>

            </div>
          )}

        </article>

        {/* ===================================================
            GRID CONDITION
        ==================================================== */}

        <article className="energy-panel energy-condition-panel">

          <header className="energy-panel-header compact">

            <div>

              <div className="energy-panel-kicker">
                GRID CONDITION
              </div>

              <h2>
                Load Intelligence
              </h2>

            </div>

            <div className="energy-health-icon">
              <ShieldCheck size={17} />
            </div>

          </header>

          <div className="energy-condition-hero">

            <div className="energy-condition-ring">

              <div>

                <strong>

                  {analytics.average >
                  0
                    ? Math.min(
                        Math.round(
                          (analytics.latest /
                            analytics.average) *
                            100
                        ),
                        199
                      )
                    : 0}

                  <small>
                    %
                  </small>

                </strong>

                <span>
                  BASELINE
                </span>

              </div>

            </div>

            <div className="energy-condition-copy">

              <span>
                CURRENT STATE
              </span>

              <strong>
                {loadStatus.label}
              </strong>

              <p>
                {loadStatus.description}.
                GridPulse is continuously
                evaluating the incoming load
                pattern.
              </p>

            </div>

          </div>

          <div className="energy-condition-list">

            <div>
              <span>
                Current load
              </span>

              <strong>
                {formatNumber(
                  analytics.latest
                )}{" "}
                kWh
              </strong>
            </div>

            <div>
              <span>
                Grid average
              </span>

              <strong>
                {formatNumber(
                  summaryMetrics.average
                )}{" "}
                kWh
              </strong>
            </div>

            <div>
              <span>
                Peak recorded
              </span>

              <strong>
                {formatNumber(
                  summaryMetrics.peak
                )}{" "}
                kWh
              </strong>
            </div>

          </div>

        </article>

      </section>

      {/* =====================================================
          TELEMETRY TABLE + AI INSIGHT
      ====================================================== */}

      <section className="energy-bottom-grid">

        {/* ===================================================
            TELEMETRY
        ==================================================== */}

        <article className="energy-panel energy-record-panel">

          <header className="energy-panel-header">

            <div>

              <div className="energy-panel-kicker">
                SMART METER STREAM
              </div>

              <h2>
                Latest Telemetry
              </h2>

              <p>
                Most recent consumption readings
                received by GridPulse.
              </p>

            </div>

            <div className="energy-record-live">

              <span />

              LIVE

            </div>

          </header>

          <div className="energy-record-list">

            {records.length >
            0 ? (
              [...records]
                .slice(-8)
                .reverse()
                .map(
                  (
                    record,
                    index
                  ) => {
                    const highLoad =
                      analytics.average >
                        0 &&
                      record.consumption >
                        analytics.average *
                          1.25;

                    return (
                      <div
                        className="energy-record"
                        key={record.id}
                      >

                        <div className="energy-record-index">
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </div>

                        <div className="energy-record-main">

                          <strong>
                            {formatDateTime(
                              record.timestamp
                            )}
                          </strong>

                          <span>
                            Smart meter telemetry
                            point
                          </span>

                        </div>

                        <div className="energy-record-value">

                          <strong>
                            {formatNumber(
                              record.consumption
                            )}
                          </strong>

                          <small>
                            kWh
                          </small>

                        </div>

                        <div
                          className={`energy-record-state ${
                            highLoad
                              ? "warning"
                              : "normal"
                          }`}
                        >

                          {highLoad ? (
                            <AlertTriangle
                              size={12}
                            />
                          ) : (
                            <CheckCircle2
                              size={12}
                            />
                          )}

                          {highLoad
                            ? "HIGH"
                            : "NORMAL"}

                        </div>

                      </div>
                    );
                  }
                )
            ) : (
              <div className="energy-empty compact">

                <Activity size={25} />

                <strong>
                  No meter readings
                </strong>

              </div>
            )}

          </div>

        </article>

        {/* ===================================================
            AI INSIGHT
        ==================================================== */}

        <article className="energy-panel energy-ai-panel">

          <header className="energy-panel-header compact">

            <div>

              <div className="energy-panel-kicker">
                GRIDPULSE AI
              </div>

              <h2>
                Operational Insight
              </h2>

            </div>

            <div className="energy-ai-chip">

              <Zap size={12} />

              AI ACTIVE

            </div>

          </header>

          <div className="energy-ai-visual">

            <div className="energy-ai-orbit">

              <div className="energy-ai-core">
                <Zap size={20} />
              </div>

            </div>

            <div>

              <span>
                CONSUMPTION SIGNAL
              </span>

              <strong>

                {analytics.trendDirection ===
                "up"
                  ? "Demand is moving upward"
                  : analytics.trendDirection ===
                    "down"
                  ? "Demand is trending downward"
                  : "Demand is relatively stable"}

              </strong>

            </div>

          </div>

          <div className="energy-ai-message">

            <div className="energy-ai-message-icon">
              <Activity size={16} />
            </div>

            <p>

              {analytics.average ===
              0
                ? "GridPulse is waiting for enough telemetry to generate a reliable operational insight."
                : analytics.latest >
                  analytics.average *
                    1.2
                ? "Current demand is materially above the monitored baseline. Continue observing the load trajectory for potential peak-demand conditions."
                : analytics.latest <
                  analytics.average *
                    0.8
                ? "Current demand is below the monitored baseline. The present load pattern does not indicate immediate peak pressure."
                : "Current demand remains close to the monitored baseline. The grid is presently showing a relatively balanced consumption pattern."}

            </p>

          </div>

          <div className="energy-ai-footer">

            <div>

              <span>
                MONITORING ENGINE
              </span>

              <strong>
                ONLINE
              </strong>

            </div>

            <div>

              <span>
                DATA QUALITY
              </span>

              <strong>
                {records.length >
                0
                  ? "AVAILABLE"
                  : "WAITING"}
              </strong>

            </div>

          </div>

        </article>

      </section>

      {/* =====================================================
          OPERATION FOOTER
      ====================================================== */}

      <section className="energy-operation-footer">

        <div>

          <div className="operation-footer-icon">
            <BatteryCharging size={16} />
          </div>

          <div>

            <span>
              ENERGY INTELLIGENCE ENGINE
            </span>

            <strong>
              Consumption analytics pipeline
              operational
            </strong>

          </div>

        </div>

        <div className="operation-footer-status">

          <span />

          MONITORING ACTIVE

        </div>

      </section>

    </main>
  );
}

