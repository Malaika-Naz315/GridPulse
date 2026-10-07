import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BatteryCharging,
  BrainCircuit,
  CheckCircle2,
  Cloud,
  Download,
  Leaf,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import api from "../services/api";
import "../styles/reports.css";

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // FETCH EXECUTIVE REPORT
  // =========================================================
  const fetchReport = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/api/v1/reports/executive");

      setReport(response.data);
    } catch (err) {
      console.error("Executive report error:", err);

      setError(
        "Unable to load the executive report. Please make sure the GridPulse backend is running."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // DOWNLOAD EXECUTIVE PDF
  // =========================================================
  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      setError("");

      const response = await api.get(
        "/api/v1/reports/executive/pdf",
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "GridPulse_Executive_Intelligence_Report.pdf";

      document.body.appendChild(link);
      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Executive PDF download error:", err);

      setError(
        "Unable to generate the Executive Intelligence PDF. Please make sure the GridPulse backend is running."
      );
    } finally {
      setDownloading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================
  useEffect(() => {
    fetchReport();
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================
  const formatNumber = (value, decimals = 2) => {
    const number = Number(value ?? 0);

    return number.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatDate = (value) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleString();
  };

  const statusClass = (status) => {
    const value = String(status || "").toUpperCase();

    if (
      [
        "EXCELLENT",
        "GOOD",
        "OPTIMAL",
        "HEALTHY",
        "NORMAL",
        "ONLINE",
        "LOW RISK",
      ].includes(value)
    ) {
      return "status-good";
    }

    if (
      [
        "STABLE",
        "MODERATE",
        "MODERATE VARIATION",
        "AVAILABLE",
        "MONITOR",
        "NEEDS ATTENTION",
        "LOW",
      ].includes(value)
    ) {
      return "status-warning";
    }

    return "status-alert";
  };

  const priorityClass = (priority) => {
    const value = String(priority || "").toUpperCase();

    if (value === "HIGH") return "priority-high";
    if (value === "MEDIUM") return "priority-medium";
    if (value === "AI") return "priority-ai";

    return "priority-low";
  };

  const handleRefresh = () => {
    fetchReport(true);
  };

  // =========================================================
  // LOADING STATE
  // =========================================================
  if (loading) {
    return (
      <div className="reports-page">
        <div className="reports-loading">
          <div className="loading-orb">
            <Activity size={30} />
          </div>

          <h2>Generating Executive Intelligence</h2>

          <p>
            GridPulse is collecting energy, forecast, renewable and carbon
            intelligence...
          </p>

          <div className="loading-line">
            <span />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR STATE
  // =========================================================
  if (error && !report) {
    return (
      <div className="reports-page">
        <div className="reports-error">
          <div className="error-icon">
            <AlertTriangle size={30} />
          </div>

          <h2>Report Unavailable</h2>

          <p>{error}</p>

          <button
            className="report-action-btn primary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "report-spin" : ""}
            />

            {refreshing ? "Retrying..." : "Retry Connection"}
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  // =========================================================
  // SAFE REPORT DATA
  // =========================================================
  const energy = report.energy_performance || {};
  const forecast = report.forecast_performance || {};
  const renewable = report.renewable_performance || {};
  const carbon = report.carbon_performance || {};
  const grid = report.grid_performance || {};
  const dataQuality = report.data_quality || {};

  const kpis = report.kpis || [];
  const aiInsights = report.ai_insights || [];
  const recommendations = report.recommendations || [];

  const overallScore = Math.min(
    Math.max(Number(report.overall_score ?? 0), 0),
    100
  );

  const forecastR2 = Math.min(
    Math.max(Number(forecast.r2_score ?? 0), 0),
    1
  );

  const renewableContribution = Math.min(
    Math.max(
      Number(renewable.renewable_contribution_percent ?? 0),
      0
    ),
    100
  );

  const sustainabilityScore = Math.min(
    Math.max(Number(carbon.sustainability_score ?? 0), 0),
    100
  );

  const batteryStorage = Math.min(
    Math.max(Number(renewable.average_battery_storage_kwh ?? 0), 0),
    100
  );

  return (
    <div className="reports-page">
      <style>{`
        .reports-page {
          min-height: 100%;
          padding: 28px;
          background:
            radial-gradient(
              circle at 8% 4%,
              rgba(186, 230, 253, 0.42),
              transparent 28%
            ),
            radial-gradient(
              circle at 92% 12%,
              rgba(125, 211, 252, 0.22),
              transparent 25%
            ),
            linear-gradient(
              180deg,
              #f7fcff 0%,
              #eef9fe 48%,
              #f8fcff 100%
            );
          color: #0f172a;
          box-sizing: border-box;
        }

        .reports-container {
          max-width: 1500px;
          margin: 0 auto;
        }

        .reports-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 24px;
        }

        .reports-title-area {
          display: flex;
          gap: 15px;
          align-items: flex-start;
        }

        .reports-title-icon {
          width: 50px;
          height: 50px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #e0f5ff, #bae6fd);
          color: #0284c7;
          border: 1px solid rgba(14, 165, 233, 0.18);
          box-shadow: 0 8px 25px rgba(14, 165, 233, 0.12);
          flex-shrink: 0;
        }

        .reports-header h1 {
          margin: 0;
          font-size: 28px;
          line-height: 1.2;
          font-weight: 800;
          letter-spacing: -0.6px;
          color: #0f2940;
        }

        .reports-header p {
          margin: 7px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
        }

        .reports-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .report-action-btn {
          border: 1px solid #d7eaf5;
          background: rgba(255, 255, 255, 0.88);
          color: #0f5f88;
          min-height: 40px;
          padding: 0 15px;
          border-radius: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s ease;
          box-shadow: 0 4px 14px rgba(15, 94, 134, 0.06);
        }

        .report-action-btn:hover {
          transform: translateY(-1px);
          border-color: #7dd3fc;
          box-shadow: 0 8px 20px rgba(14, 165, 233, 0.12);
        }

        .report-action-btn.primary {
          color: white;
          border-color: #0284c7;
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
        }

        .report-action-btn:disabled {
          opacity: 0.65;
          cursor: wait;
          transform: none;
        }

        .report-spin {
          animation: reportSpin 0.9s linear infinite;
        }

        @keyframes reportSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        .executive-banner {
          position: relative;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 25px;
          align-items: center;
          padding: 24px 26px;
          margin-bottom: 20px;
          border: 1px solid rgba(125, 211, 252, 0.48);
          border-radius: 20px;
          background:
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.97),
              rgba(235, 248, 255, 0.94)
            );
          box-shadow: 0 12px 35px rgba(14, 116, 144, 0.09);
        }

        .executive-banner::after {
          content: "";
          position: absolute;
          width: 190px;
          height: 190px;
          right: -70px;
          top: -100px;
          border-radius: 50%;
          background: rgba(125, 211, 252, 0.17);
        }

        .banner-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0284c7;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .executive-banner h2 {
          margin: 0;
          font-size: 22px;
          color: #123b55;
        }

        .executive-banner p {
          margin: 7px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .overall-score {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .score-ring {
          width: 82px;
          height: 82px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(
              circle,
              white 57%,
              transparent 59%
            ),
            conic-gradient(
              #0ea5e9 ${overallScore * 3.6}deg,
              #dceff8 0deg
            );
          box-shadow: 0 7px 25px rgba(14, 165, 233, 0.15);
        }

        .score-ring span {
          font-size: 20px;
          font-weight: 800;
          color: #075985;
        }

        .score-info {
          min-width: 100px;
        }

        .score-info small {
          display: block;
          color: #64748b;
          font-size: 11px;
          margin-bottom: 4px;
        }

        .score-status {
          display: inline-flex;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .status-good {
          color: #047857;
          background: #dcfce7;
        }

        .status-warning {
          color: #b45309;
          background: #fef3c7;
        }

        .status-alert {
          color: #b91c1c;
          background: #fee2e2;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .report-card {
          border: 1px solid rgba(186, 230, 253, 0.72);
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 8px 28px rgba(15, 94, 134, 0.065);
          backdrop-filter: blur(8px);
        }

        .kpi-card {
          padding: 18px;
          min-height: 115px;
          box-sizing: border-box;
        }

        .kpi-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .kpi-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          color: #0284c7;
          background: #e0f5ff;
        }

        .kpi-status {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.5px;
          padding: 4px 7px;
          border-radius: 999px;
        }

        .kpi-card h3 {
          margin: 13px 0 4px;
          font-size: 22px;
          color: #123b55;
          letter-spacing: -0.4px;
        }

        .kpi-card p {
          margin: 0;
          font-size: 11px;
          color: #718096;
        }

        .section-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 18px;
        }

        .section-card {
          padding: 20px;
          min-width: 0;
        }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .section-heading-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .section-heading-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #e8f7ff;
          color: #0284c7;
        }

        .section-heading h3 {
          margin: 0;
          font-size: 15px;
          color: #16425d;
        }

        .section-heading span {
          font-size: 10px;
          color: #94a3b8;
        }

        .metrics-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .metric-item {
          padding: 13px;
          border-radius: 12px;
          background: #f7fcff;
          border: 1px solid #e2f1f8;
          min-width: 0;
        }

        .metric-label {
          display: block;
          color: #7890a0;
          font-size: 10px;
          margin-bottom: 5px;
        }

        .metric-value {
          color: #16425d;
          font-size: 15px;
          font-weight: 800;
        }

        .metric-value.small {
          font-size: 13px;
        }

        .performance-bar {
          height: 7px;
          margin-top: 8px;
          border-radius: 999px;
          background: #e2f1f8;
          overflow: hidden;
        }

        .performance-bar span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #38bdf8, #0284c7);
        }

        .grid-status-list {
          display: grid;
          gap: 10px;
        }

        .grid-status-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 14px;
          border-radius: 12px;
          background: #f7fcff;
          border: 1px solid #e2f1f8;
        }

        .grid-status-label {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #526b7b;
          font-size: 12px;
          font-weight: 600;
        }

        .grid-status-label svg {
          color: #0ea5e9;
        }

        .grid-status-value {
          font-size: 10px;
          font-weight: 800;
          padding: 5px 8px;
          border-radius: 999px;
        }

        .ai-section {
          padding: 21px;
          margin-bottom: 18px;
          background:
            linear-gradient(
              135deg,
              rgba(240, 249, 255, 0.98),
              rgba(255, 255, 255, 0.95)
            );
        }

        .ai-heading {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 15px;
        }

        .ai-heading-icon {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0369a1;
          background: #dff4ff;
        }

        .ai-heading h3 {
          margin: 0;
          font-size: 15px;
          color: #16425d;
        }

        .ai-heading p {
          margin: 3px 0 0;
          color: #7890a0;
          font-size: 10px;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .insight-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 13px;
          border-radius: 12px;
          background: white;
          border: 1px solid #e2f1f8;
          color: #526b7b;
          font-size: 11px;
          line-height: 1.55;
        }

        .insight-item svg {
          flex-shrink: 0;
          margin-top: 1px;
          color: #0ea5e9;
        }

        .empty-message {
          padding: 16px;
          border-radius: 12px;
          background: #f7fcff;
          border: 1px dashed #cbd5e1;
          color: #7890a0;
          font-size: 11px;
        }

        .recommendations {
          display: grid;
          gap: 10px;
        }

        .recommendation-item {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: flex-start;
          padding: 14px;
          border-radius: 13px;
          background: #f9fdff;
          border: 1px solid #e2f1f8;
        }

        .priority-badge {
          min-width: 55px;
          text-align: center;
          padding: 5px 7px;
          border-radius: 7px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.4px;
        }

        .priority-high {
          color: #b91c1c;
          background: #fee2e2;
        }

        .priority-medium {
          color: #a16207;
          background: #fef3c7;
        }

        .priority-ai {
          color: #0369a1;
          background: #dff4ff;
        }

        .priority-low {
          color: #475569;
          background: #e2e8f0;
        }

        .recommendation-category {
          color: #16425d;
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 3px;
        }

        .recommendation-text {
          color: #64748b;
          font-size: 11px;
          line-height: 1.5;
        }

        .data-quality {
          padding: 18px 20px;
          margin-bottom: 18px;
        }

        .data-quality-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .quality-item {
          text-align: center;
          padding: 12px;
          border-radius: 11px;
          background: #f7fcff;
          border: 1px solid #e2f1f8;
        }

        .quality-item strong {
          display: block;
          color: #16425d;
          font-size: 16px;
        }

        .quality-item span {
          display: block;
          margin-top: 3px;
          color: #7890a0;
          font-size: 9px;
        }

        .report-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 15px 4px 2px;
          color: #8aa0ae;
          font-size: 10px;
        }

        .report-footer-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
        }

        .reports-loading,
        .reports-error {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px;
        }

        .loading-orb,
        .error-icon {
          width: 68px;
          height: 68px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        .loading-orb {
          color: #0284c7;
          background: #e0f5ff;
          animation: reportPulse 1.5s infinite ease-in-out;
        }

        .error-icon {
          color: #dc2626;
          background: #fee2e2;
        }

        .reports-loading h2,
        .reports-error h2 {
          margin: 0;
          color: #16425d;
          font-size: 21px;
        }

        .reports-loading p,
        .reports-error p {
          max-width: 480px;
          margin: 8px 0 18px;
          color: #718096;
          font-size: 13px;
          line-height: 1.5;
        }

        .loading-line {
          width: 220px;
          height: 5px;
          overflow: hidden;
          border-radius: 999px;
          background: #dff1f8;
        }

        .loading-line span {
          display: block;
          width: 45%;
          height: 100%;
          border-radius: inherit;
          background: #0ea5e9;
          animation: loadingMove 1.2s infinite ease-in-out;
        }

        @keyframes loadingMove {
          0% {
            transform: translateX(-110%);
          }

          100% {
            transform: translateX(330%);
          }
        }

        @keyframes reportPulse {
          0%,
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(14, 165, 233, 0);
          }

          50% {
            transform: scale(1.06);
            box-shadow: 0 0 28px rgba(14, 165, 233, 0.18);
          }
        }

        @media (max-width: 1100px) {
          .kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .data-quality-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 800px) {
          .reports-page {
            padding: 18px;
          }

          .reports-header {
            flex-direction: column;
          }

          .reports-actions {
            width: 100%;
          }

          .report-action-btn {
            flex: 1;
          }

          .executive-banner {
            grid-template-columns: 1fr;
          }

          .overall-score {
            justify-content: flex-start;
          }

          .section-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 560px) {
          .reports-page {
            padding: 12px;
          }

          .reports-header h1 {
            font-size: 22px;
          }

          .reports-title-icon {
            width: 43px;
            height: 43px;
          }

          .kpi-grid {
            grid-template-columns: 1fr;
          }

          .metrics-list,
          .insights-grid,
          .data-quality-grid {
            grid-template-columns: 1fr;
          }

          .section-card,
          .ai-section,
          .data-quality {
            padding: 15px;
          }

          .executive-banner {
            padding: 18px;
          }

          .report-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="reports-container">
        {/* =====================================================
            HEADER
        ====================================================== */}
        <header className="reports-header">
          <div className="reports-title-area">
            <div className="reports-title-icon">
              <BarChart3 size={25} />
            </div>

            <div>
              <h1>Executive Intelligence</h1>

              <p>
                Unified operational report across energy, forecasting,
                renewables, carbon and grid performance.
              </p>
            </div>
          </div>

          <div className="reports-actions">
            <button
              className="report-action-btn"
              onClick={handleRefresh}
              disabled={refreshing || downloading}
            >
              <RefreshCw
                size={15}
                className={refreshing ? "report-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh Report"}
            </button>

            <button
              className="report-action-btn primary"
              onClick={handleDownloadPDF}
              disabled={downloading || refreshing}
            >
              <Download
                size={15}
                className={downloading ? "report-spin" : ""}
              />

              {downloading ? "Generating PDF..." : "Export PDF"}
            </button>
          </div>
        </header>

        {/* =====================================================
            SMALL ERROR NOTICE
        ====================================================== */}
        {error && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 15px",
              borderRadius: "12px",
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#9a3412",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {/* =====================================================
            EXECUTIVE SUMMARY
        ====================================================== */}
        <section className="executive-banner">
          <div>
            <div className="banner-label">
              <Sparkles size={13} />
              GridPulse Executive Summary
            </div>

            <h2>{report.overall_status || "NEEDS ATTENTION"}</h2>

            <p>
              Report generated on {formatDate(report.generated_at)}
            </p>
          </div>

          <div className="overall-score">
            <div className="score-ring">
              <span>{formatNumber(overallScore, 1)}</span>
            </div>

            <div className="score-info">
              <small>Overall Intelligence Score</small>

              <span
                className={`score-status ${statusClass(
                  report.overall_status
                )}`}
              >
                {report.overall_status || "MONITOR"}
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
            KPI CARDS
        ====================================================== */}
        <section className="kpi-grid">
          <div className="report-card kpi-card">
            <div className="kpi-top">
              <div className="kpi-icon">
                <Zap size={18} />
              </div>

              <span
                className={`kpi-status ${statusClass(
                  kpis[0]?.status || "NORMAL"
                )}`}
              >
                {kpis[0]?.status || "NORMAL"}
              </span>
            </div>

            <h3>{kpis[0]?.value || "0 kWh"}</h3>

            <p>Total Energy Demand</p>
          </div>

          <div className="report-card kpi-card">
            <div className="kpi-top">
              <div className="kpi-icon">
                <Leaf size={18} />
              </div>

              <span
                className={`kpi-status ${statusClass(
                  kpis[1]?.status || "MONITOR"
                )}`}
              >
                {kpis[1]?.status || "MONITOR"}
              </span>
            </div>

            <h3>{kpis[1]?.value || "0 kWh"}</h3>

            <p>Renewable Generation</p>
          </div>

          <div className="report-card kpi-card">
            <div className="kpi-top">
              <div className="kpi-icon">
                <Cloud size={18} />
              </div>

              <span
                className={`kpi-status ${statusClass(
                  kpis[2]?.status || "GOOD"
                )}`}
              >
                {kpis[2]?.status || "GOOD"}
              </span>
            </div>

            <h3>{kpis[2]?.value || "0 kg"}</h3>

            <p>CO₂ Avoided</p>
          </div>

          <div className="report-card kpi-card">
            <div className="kpi-top">
              <div className="kpi-icon">
                <Target size={18} />
              </div>

              <span
                className={`kpi-status ${statusClass(
                  kpis[3]?.status || "MONITOR"
                )}`}
              >
                {kpis[3]?.status || "MONITOR"}
              </span>
            </div>

            <h3>{kpis[3]?.value || "0/100"}</h3>

            <p>Sustainability Score</p>
          </div>
        </section>

        {/* =====================================================
            ENERGY + FORECAST
        ====================================================== */}
        <section className="section-grid">
          {/* ENERGY */}
          <div className="report-card section-card">
            <div className="section-heading">
              <div className="section-heading-left">
                <div className="section-heading-icon">
                  <Zap size={17} />
                </div>

                <h3>Energy Performance</h3>
              </div>

              <span>
                {energy.energy_records ?? 0} records
              </span>
            </div>

            <div className="metrics-list">
              <div className="metric-item">
                <span className="metric-label">Total Demand</span>

                <strong className="metric-value">
                  {formatNumber(energy.total_demand_kwh)} kWh
                </strong>
              </div>

              <div className="metric-item">
                <span className="metric-label">Average Demand</span>

                <strong className="metric-value">
                  {formatNumber(energy.average_demand_kwh)} kWh
                </strong>
              </div>

              <div className="metric-item">
                <span className="metric-label">Peak Demand</span>

                <strong className="metric-value">
                  {formatNumber(energy.peak_demand_kwh)} kWh
                </strong>
              </div>

              <div className="metric-item">
                <span className="metric-label">Demand Pattern</span>

                <strong className="metric-value small">
                  {grid.demand_status || "MONITOR"}
                </strong>
              </div>
            </div>
          </div>

          {/* FORECAST */}
          <div className="report-card section-card">
            <div className="section-heading">
              <div className="section-heading-left">
                <div className="section-heading-icon">
                  <BrainCircuit size={17} />
                </div>

                <h3>Forecast Performance</h3>
              </div>

              <span>
                {forecast.model_name || "Forecast Model"}
              </span>
            </div>

            <div className="metrics-list">
              <div className="metric-item">
                <span className="metric-label">Model Version</span>

                <strong className="metric-value small">
                  {forecast.model_version
                    ? `v${forecast.model_version}`
                    : "N/A"}
                </strong>
              </div>

              <div className="metric-item">
                <span className="metric-label">Evaluation</span>

                <strong
                  className={`metric-value small ${statusClass(
                    forecast.evaluation_status
                  )}`}
                  style={{
                    display: "inline-block",
                    padding: "4px 7px",
                    borderRadius: "6px",
                  }}
                >
                  {forecast.evaluation_status || "MONITOR"}
                </strong>
              </div>

              <div className="metric-item">
                <span className="metric-label">MAE</span>

                <strong className="metric-value">
                  {formatNumber(forecast.mae)}
                </strong>
              </div>

              <div className="metric-item">
                <span className="metric-label">RMSE</span>

                <strong className="metric-value">
                  {formatNumber(forecast.rmse)}
                </strong>
              </div>

              <div
                className="metric-item"
                style={{ gridColumn: "1 / -1" }}
              >
                <span className="metric-label">
                  R² Model Accuracy
                </span>

                <strong className="metric-value">
                  {formatNumber(forecast.r2_score, 4)}
                </strong>

                <div className="performance-bar">
                  <span
                    style={{
                      width: `${forecastR2 * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            RENEWABLE + CARBON
        ====================================================== */}
        <section className="section-grid">
          {/* RENEWABLE */}
          <div className="report-card section-card">
            <div className="section-heading">
              <div className="section-heading-left">
                <div className="section-heading-icon">
                  <Leaf size={17} />
                </div>

                <h3>Renewable Performance</h3>
              </div>

              <span>
                {grid.renewable_status || "MONITOR"}
              </span>
            </div>

            <div className="metrics-list">
              <div className="metric-item">
                <span className="metric-label">
                  Solar Generation
                </span>

                <strong className="metric-value">
                  {formatNumber(
                    renewable.solar_generation_kwh
                  )}{" "}
                  kWh
                </strong>
              </div>

              <div className="metric-item">
                <span className="metric-label">
                  Wind Generation
                </span>

                <strong className="metric-value">
                  {formatNumber(
                    renewable.wind_generation_kwh
                  )}{" "}
                  kWh
                </strong>
              </div>

              <div className="metric-item">
                <span className="metric-label">
                  Total Renewable
                </span>

                <strong className="metric-value">
                  {formatNumber(
                    renewable.total_renewable_generation_kwh
                  )}{" "}
                  kWh
                </strong>
              </div>

              <div className="metric-item">
                <span className="metric-label">
                  Renewable Contribution
                </span>

                <strong className="metric-value">
                  {formatNumber(
                    renewable.renewable_contribution_percent
                  )}
                  %
                </strong>
              </div>

              <div
                className="metric-item"
                style={{ gridColumn: "1 / -1" }}
              >
                <span className="metric-label">
                  Average Battery Storage
                </span>

                <strong className="metric-value">
                  {formatNumber(
                    renewable.average_battery_storage_kwh
                  )}{" "}
                  kWh
                </strong>

                <div className="performance-bar">
                  <span
                    style={{
                      width: `${batteryStorage}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CARBON */}
          <div className="report-card section-card">
            <div className="section-heading">
              <div className="section-heading-left">
                <div className="section-heading-icon">
                  <Cloud size={17} />
                </div>

                <h3>Carbon Performance</h3>
              </div>

              <span>Sustainability</span>
            </div>

            <div className="metrics-list">
              <div className="metric-item">
                <span className="metric-label">
                  Baseline CO₂
                </span>

                <strong className="metric-value">
                  {formatNumber(carbon.baseline_co2_kg)} kg
                </strong>
              </div>

              <div className="metric-item">
                <span className="metric-label">
                  Grid CO₂
                </span>

                <strong className="metric-value">
                  {formatNumber(
                    carbon.estimated_grid_co2_kg
                  )}{" "}
                  kg
                </strong>
              </div>

              <div className="metric-item">
                <span className="metric-label">
                  CO₂ Avoided
                </span>

                <strong className="metric-value">
                  {formatNumber(
                    carbon.co2_avoided_kg
                  )}{" "}
                  kg
                </strong>
              </div>

              <div className="metric-item">
                <span className="metric-label">
                  Carbon Reduction
                </span>

                <strong className="metric-value">
                  {formatNumber(
                    carbon.carbon_reduction_percent
                  )}
                  %
                </strong>
              </div>

              <div
                className="metric-item"
                style={{ gridColumn: "1 / -1" }}
              >
                <span className="metric-label">
                  Sustainability Score
                </span>

                <strong className="metric-value">
                  {formatNumber(
                    carbon.sustainability_score,
                    1
                  )}
                  /100
                </strong>

                <div className="performance-bar">
                  <span
                    style={{
                      width: `${sustainabilityScore}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            GRID PERFORMANCE
        ====================================================== */}
        <section
          className="report-card section-card"
          style={{ marginBottom: "18px" }}
        >
          <div className="section-heading">
            <div className="section-heading-left">
              <div className="section-heading-icon">
                <Activity size={17} />
              </div>

              <h3>Grid Performance Status</h3>
            </div>

            <span>Live intelligence</span>
          </div>

          <div className="grid-status-list">
            <div className="grid-status-item">
              <div className="grid-status-label">
                <ShieldCheck size={15} />
                Overall Grid Status
              </div>

              <span
                className={`grid-status-value ${statusClass(
                  grid.grid_status
                )}`}
              >
                {grid.grid_status || "MONITOR"}
              </span>
            </div>

            <div className="grid-status-item">
              <div className="grid-status-label">
                <TrendingUp size={15} />
                Demand Status
              </div>

              <span
                className={`grid-status-value ${statusClass(
                  grid.demand_status
                )}`}
              >
                {grid.demand_status || "MONITOR"}
              </span>
            </div>

            <div className="grid-status-item">
              <div className="grid-status-label">
                <Leaf size={15} />
                Renewable Status
              </div>

              <span
                className={`grid-status-value ${statusClass(
                  grid.renewable_status
                )}`}
              >
                {grid.renewable_status || "MONITOR"}
              </span>
            </div>

            <div className="grid-status-item">
              <div className="grid-status-label">
                <BatteryCharging size={15} />
                Storage Status
              </div>

              <span
                className={`grid-status-value ${statusClass(
                  grid.storage_status
                )}`}
              >
                {grid.storage_status || "MONITOR"}
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
            AI INSIGHTS
        ====================================================== */}
        <section className="report-card ai-section">
          <div className="ai-heading">
            <div className="ai-heading-icon">
              <BrainCircuit size={19} />
            </div>

            <div>
              <h3>AI Intelligence Insights</h3>

              <p>
                Explainable operational observations generated by
                GridPulse
              </p>
            </div>
          </div>

          {aiInsights.length > 0 ? (
            <div className="insights-grid">
              {aiInsights.map((insight, index) => (
                <div className="insight-item" key={index}>
                  <CheckCircle2 size={15} />

                  <span>{insight}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-message">
              No AI insights are currently available.
            </div>
          )}
        </section>

        {/* =====================================================
            RECOMMENDATIONS
        ====================================================== */}
        <section
          className="report-card section-card"
          style={{ marginBottom: "18px" }}
        >
          <div className="section-heading">
            <div className="section-heading-left">
              <div className="section-heading-icon">
                <Target size={17} />
              </div>

              <h3>Recommended Actions</h3>
            </div>

            <span>Prioritized</span>
          </div>

          {recommendations.length > 0 ? (
            <div className="recommendations">
              {recommendations.map((item, index) => (
                <div
                  className="recommendation-item"
                  key={index}
                >
                  <span
                    className={`priority-badge ${priorityClass(
                      item.priority
                    )}`}
                  >
                    {item.priority || "LOW"}
                  </span>

                  <div>
                    <div className="recommendation-category">
                      {item.category || "Grid Operations"}
                    </div>

                    <div className="recommendation-text">
                      {item.recommendation ||
                        "No recommendation details available."}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-message">
              No recommendations are currently available.
            </div>
          )}
        </section>

        {/* =====================================================
            DATA QUALITY
        ====================================================== */}
        <section className="report-card data-quality">
          <div className="section-heading">
            <div className="section-heading-left">
              <div className="section-heading-icon">
                <CheckCircle2 size={17} />
              </div>

              <h3>Data Quality & Coverage</h3>
            </div>

            <span className={statusClass(dataQuality.status)}>
              {dataQuality.status || "GOOD"}
            </span>
          </div>

          <div className="data-quality-grid">
            <div className="quality-item">
              <strong>
                {dataQuality.energy_records ?? 0}
              </strong>

              <span>Energy Records</span>
            </div>

            <div className="quality-item">
              <strong>
                {dataQuality.forecast_records ?? 0}
              </strong>

              <span>Forecast Records</span>
            </div>

            <div className="quality-item">
              <strong>
                {dataQuality.renewable_records ?? 0}
              </strong>

              <span>Renewable Records</span>
            </div>

            <div className="quality-item">
              <strong>
                {dataQuality.carbon_records ?? 0}
              </strong>

              <span>Carbon Records</span>
            </div>
          </div>
        </section>

        {/* =====================================================
            FOOTER
        ====================================================== */}
        <footer className="report-footer">
          <div className="report-footer-left">
            <span className="live-dot" />

            GridPulse Intelligence Engine Online
          </div>

          <span>
            Generated: {formatDate(report.generated_at)}
          </span>
        </footer>
      </div>
    </div>
  );
}

