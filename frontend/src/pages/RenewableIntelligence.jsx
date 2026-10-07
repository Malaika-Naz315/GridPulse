import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BatteryCharging,
  RefreshCw,
  Sun,
  TrendingUp,
  Wind,
  Zap,
  Gauge,
  Leaf,
  Clock3,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getRenewableEnergy } from "../services/api";
import "../styles/renewable-intelligence.css";

export default function RenewableIntelligence() {
  const [renewableData, setRenewableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /* =====================================================
     LOAD DATA FROM BACKEND
     ===================================================== */

  const loadRenewableData = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await getRenewableEnergy(100);
    

      if (!Array.isArray(data)) {
        throw new Error("Invalid renewable energy response.");
      }

      setRenewableData(data);
    } catch (err) {
      console.error(
        "Renewable intelligence loading error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to connect to renewable energy service."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
     ===================================================== */

  useEffect(() => {
    loadRenewableData();
  }, []);

  /* =====================================================
     CALCULATE GRID INTELLIGENCE
     ===================================================== */

  const metrics = useMemo(() => {
    if (!renewableData.length) {
      return {
        totalSolar: 0,
        totalWind: 0,
        totalRenewable: 0,
        avgBattery: 0,
        avgAvailability: 0,
        peakSolar: 0,
        peakWind: 0,
        latest: null,
      };
    }

    const totalSolar = renewableData.reduce(
      (sum, item) =>
        sum + Number(item.solar_production_kwh || 0),
      0
    );

    const totalWind = renewableData.reduce(
      (sum, item) =>
        sum + Number(item.wind_generation_kwh || 0),
      0
    );

    const avgBattery =
      renewableData.reduce(
        (sum, item) =>
          sum + Number(item.battery_storage_kwh || 0),
        0
      ) / renewableData.length;

    const avgAvailability =
      renewableData.reduce(
        (sum, item) =>
          sum +
          Number(
            item.renewable_availability_percent || 0
          ),
        0
      ) / renewableData.length;

    const peakSolar = Math.max(
      ...renewableData.map((item) =>
        Number(item.solar_production_kwh || 0)
      )
    );

    const peakWind = Math.max(
      ...renewableData.map((item) =>
        Number(item.wind_generation_kwh || 0)
      )
    );

    const sorted = [...renewableData].sort(
      (a, b) =>
        new Date(b.timestamp) -
        new Date(a.timestamp)
    );

    return {
      totalSolar: Number(totalSolar.toFixed(2)),
      totalWind: Number(totalWind.toFixed(2)),
      totalRenewable: Number(
        (totalSolar + totalWind).toFixed(2)
      ),
      avgBattery: Number(avgBattery.toFixed(2)),
      avgAvailability: Number(
        avgAvailability.toFixed(2)
      ),
      peakSolar: Number(peakSolar.toFixed(2)),
      peakWind: Number(peakWind.toFixed(2)),
      latest: sorted[0],
    };
  }, [renewableData]);

  /* =====================================================
     CHART DATA
     ===================================================== */

  const chartData = useMemo(() => {
    return [...renewableData]
      .sort(
        (a, b) =>
          new Date(a.timestamp) -
          new Date(b.timestamp)
      )
      .map((item) => ({
        time: new Date(
          item.timestamp
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),

        solar: Number(
          item.solar_production_kwh || 0
        ),

        wind: Number(
          item.wind_generation_kwh || 0
        ),
      }));
  }, [renewableData]);

  /* =====================================================
     RENEWABLE MIX
     ===================================================== */

  const solarShare =
    metrics.totalRenewable > 0
      ? (
          (metrics.totalSolar /
            metrics.totalRenewable) *
          100
        ).toFixed(1)
      : 0;

  const windShare =
    metrics.totalRenewable > 0
      ? (
          (metrics.totalWind /
            metrics.totalRenewable) *
          100
        ).toFixed(1)
      : 0;

  /* =====================================================
     STATUS
     ===================================================== */

  const getAvailabilityStatus = (value) => {
    if (value >= 90) {
      return {
        label: "Excellent",
        className: "excellent",
      };
    }

    if (value >= 75) {
      return {
        label: "Stable",
        className: "stable",
      };
    }

    return {
      label: "Low",
      className: "low",
    };
  };

  const availabilityStatus =
    getAvailabilityStatus(
      metrics.avgAvailability
    );

  /* =====================================================
     LOADING STATE
     ===================================================== */

  if (loading) {
    return (
      <div className="renewable-page">
        <div className="renewable-loading">
          <RefreshCw
            size={30}
            className="spin"
          />

          <strong>
            Loading Renewable Intelligence
          </strong>

          <span>
            Connecting to GridPulse renewable telemetry...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="renewable-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="renewable-header">

        <div>
          <div className="renewable-eyebrow">
            <Leaf size={15} />
            GRIDPULSE • CLEAN ENERGY INTELLIGENCE
          </div>

          <h1>
            Renewable Energy Intelligence
          </h1>

          <p>
            Real-time renewable generation analytics,
            battery availability, and clean-energy
            contribution across the smart grid.
          </p>
        </div>

        <button
          className="renewable-refresh"
          onClick={() =>
            loadRenewableData(true)
          }
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing ? "spin" : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh Data"}
        </button>

      </header>

      {/* =================================================
          ERROR
          ================================================= */}

      {error && (
        <div className="renewable-error">
          <Activity size={19} />

          <div>
            <strong>
              Renewable service connection issue
            </strong>

            <span>{error}</span>
          </div>
        </div>
      )}

      {/* =================================================
          KPI SECTION
          ================================================= */}

      <section className="renewable-kpis">

        {/* Solar */}

        <div className="renewable-kpi-card solar">

          <div className="kpi-icon">
            <Sun size={22} />
          </div>

          <div>
            <span>
              Solar Production
            </span>

            <strong>
              {metrics.totalSolar.toLocaleString()} kWh
            </strong>

            <small>
              Total recorded generation
            </small>
          </div>

        </div>

        {/* Wind */}

        <div className="renewable-kpi-card wind">

          <div className="kpi-icon">
            <Wind size={22} />
          </div>

          <div>
            <span>
              Wind Generation
            </span>

            <strong>
              {metrics.totalWind.toLocaleString()} kWh
            </strong>

            <small>
              Total recorded generation
            </small>
          </div>

        </div>

        {/* Battery */}

        <div className="renewable-kpi-card battery">

          <div className="kpi-icon">
            <BatteryCharging size={22} />
          </div>

          <div>
            <span>
              Battery Storage
            </span>

            <strong>
              {metrics.avgBattery.toLocaleString()} kWh
            </strong>

            <small>
              Average available storage
            </small>
          </div>

        </div>

        {/* Availability */}

        <div className="renewable-kpi-card availability">

          <div className="kpi-icon">
            <Gauge size={22} />
          </div>

          <div>
            <span>
              Renewable Availability
            </span>

            <strong>
              {metrics.avgAvailability}%
            </strong>

            <small>
              Average renewable availability
            </small>
          </div>

        </div>

      </section>

      {/* =================================================
          MAIN CONTENT
          ================================================= */}

      <div className="renewable-main-grid">

        {/* =================================================
            GENERATION CHART
            ================================================= */}

        <section className="renewable-panel chart-panel">

          <div className="panel-heading">

            <div>
              <span className="panel-label">
                GENERATION TELEMETRY
              </span>

              <h2>
                Solar vs Wind Generation
              </h2>
            </div>

            <div className="panel-status">
              <span className="status-dot" />
              Backend Connected
            </div>

          </div>

          <div className="renewable-chart">

            {chartData.length > 0 ? (

             <BarChart
  width={700}
  height={340}
  data={chartData}
  margin={{
    top: 10,
    right: 20,
    left: 10,
    bottom: 5,
  }}
>
  <CartesianGrid
    strokeDasharray="3 3"
    vertical={false}
  />

  <XAxis
    dataKey="time"
    tick={{
      fontSize: 10,
    }}
  />

  <YAxis
    tick={{
      fontSize: 10,
    }}
  />

  <Tooltip />
  <Legend />

  <Bar
    dataKey="solar"
    name="Solar"
    fill="#f4c542"
    radius={[5, 5, 0, 0]}
  />

  <Bar
    dataKey="wind"
    name="Wind"
    fill="#28a9d6"
    radius={[5, 5, 0, 0]}
  />
</BarChart>

            ) : (
              <div className="renewable-empty">
                No generation data available.
              </div>
            )}

          </div>

        </section>

        {/* =================================================
            INTELLIGENCE PANEL
            ================================================= */}

        <section className="renewable-panel insight-panel">

          <div className="panel-heading">

            <div>
              <span className="panel-label">
                GRID INTELLIGENCE
              </span>

              <h2>
                Renewable Health
              </h2>
            </div>

          </div>

          <div className="health-score">

            <div className="health-ring">
              <strong>
                {metrics.avgAvailability}%
              </strong>

              <span>
                Available
              </span>
            </div>

            <div>
              <h3>
                Renewable Capacity Status
              </h3>

              <p>
                Current renewable resources are
                operating at{" "}
                <strong>
                  {availabilityStatus.label.toLowerCase()}
                </strong>{" "}
                availability.
              </p>
            </div>

          </div>

          {/* Renewable Mix */}

          <div className="renewable-mix">

            <div className="mix-header">
              <span>
                Renewable Generation Mix
              </span>

              <strong>
                {metrics.totalRenewable} kWh
              </strong>
            </div>

            <div className="mix-bar">

              <div
                className="mix-solar"
                style={{
                  width: `${solarShare}%`,
                }}
              />

              <div
                className="mix-wind"
                style={{
                  width: `${windShare}%`,
                }}
              />

            </div>

            <div className="mix-legend">

              <span>
                <i className="solar-dot" />
                Solar {solarShare}%
              </span>

              <span>
                <i className="wind-dot" />
                Wind {windShare}%
              </span>

            </div>

          </div>

          {/* Insight */}

          <div className="ai-insight">

            <div className="ai-icon">
              <Zap size={20} />
            </div>

            <div>
              <strong>
                GridPulse Insight
              </strong>

              <p>
                Renewable generation is being
                monitored across{" "}
                <strong>
                  {renewableData.length}
                </strong>{" "}
                telemetry records. Solar and wind
                resources are available for grid
                optimization decisions.
              </p>
            </div>

          </div>

        </section>

      </div>

      {/* =================================================
          OPERATIONAL METRICS
          ================================================= */}

      <section className="renewable-panel operational-panel">

        <div className="panel-heading">

          <div>
            <span className="panel-label">
              OPERATIONAL INTELLIGENCE
            </span>

            <h2>
              Renewable Resource Performance
            </h2>
          </div>

        </div>

        <div className="operational-grid">

          <div className="operational-card">
            <Sun size={20} />

            <span>
              Peak Solar
            </span>

            <strong>
              {metrics.peakSolar} kWh
            </strong>
          </div>

          <div className="operational-card">
            <Wind size={20} />

            <span>
              Peak Wind
            </span>

            <strong>
              {metrics.peakWind} kWh
            </strong>
          </div>

          <div className="operational-card">
            <BatteryCharging size={20} />

            <span>
              Battery Reserve
            </span>

            <strong>
              {metrics.avgBattery} kWh
            </strong>
          </div>

          <div className="operational-card">
            <TrendingUp size={20} />

            <span>
              Availability
            </span>

            <strong>
              {metrics.avgAvailability}%
            </strong>
          </div>

        </div>

      </section>

      {/* =================================================
          RECENT TELEMETRY
          ================================================= */}

      <section className="renewable-panel records-panel">

        <div className="panel-heading">

          <div>
            <span className="panel-label">
              LIVE RENEWABLE FEED
            </span>

            <h2>
              Recent Generation Records
            </h2>
          </div>

          <span className="record-count">
            {renewableData.length} records
          </span>

        </div>

        <div className="renewable-table-wrapper">

          <table className="renewable-table">

            <thead>

              <tr>
                <th>Timestamp</th>
                <th>Source</th>
                <th>Solar</th>
                <th>Wind</th>
                <th>Battery</th>
                <th>Availability</th>
              </tr>

            </thead>

            <tbody>

              {[...renewableData]
                .sort(
                  (a, b) =>
                    new Date(b.timestamp) -
                    new Date(a.timestamp)
                )
                .slice(0, 10)
                .map((item) => {

                  const status =
                    getAvailabilityStatus(
                      Number(
                        item.renewable_availability_percent ||
                          0
                      )
                    );

                  return (
                    <tr key={item.id}>

                      <td>
                        <div className="timestamp-cell">
                          <Clock3 size={13} />

                          {new Date(
                            item.timestamp
                          ).toLocaleString()}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`source-badge ${
                            item.energy_source?.toLowerCase() ||
                            ""
                          }`}
                        >
                          {item.energy_source}
                        </span>
                      </td>

                      <td>
                        {Number(
                          item.solar_production_kwh
                        ).toFixed(1)}{" "}
                        kWh
                      </td>

                      <td>
                        {Number(
                          item.wind_generation_kwh
                        ).toFixed(1)}{" "}
                        kWh
                      </td>

                      <td>
                        {Number(
                          item.battery_storage_kwh
                        ).toFixed(1)}{" "}
                        kWh
                      </td>

                      <td>
                        <span
                          className={`availability-badge ${status.className}`}
                        >
                          {Number(
                            item.renewable_availability_percent
                          ).toFixed(0)}
                          %
                        </span>
                      </td>

                    </tr>
                  );
                })}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}