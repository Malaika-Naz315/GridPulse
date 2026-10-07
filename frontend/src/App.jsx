import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  CloudSun,
  FileText,
  Gauge,
  Leaf,
  Menu,
  Network,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";

import {
  getSystemHealth,
  getWeatherData,
} from "./services/api";

import "./App.css";


/* =========================================================
   NAVIGATION
========================================================= */

const navigation = [
  {
    section: "COMMAND CENTER",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: Gauge,
      },
    ],
  },

  {
    section: "ENERGY INTELLIGENCE",
    items: [
      {
        label: "Energy Monitoring",
        path: "/energy",
        icon: Activity,
      },
      {
        label: "Demand Forecasting",
        path: "/forecast",
        icon: BarChart3,
      },
      {
        label: "Renewable Intelligence",
        path: "/renewable",
        icon: Leaf,
      },
      {
        label: "Grid Optimization",
        path: "/optimization",
        icon: Zap,
      },
    ],
  },

  {
    section: "GRID OPERATIONS",
    items: [
      {
        label: "Failure Prediction",
        path: "/failures",
        icon: TriangleAlert,
      },
      {
        label: "Emergency Response",
        path: "/emergency",
        icon: AlertTriangle,
      },
      {
        label: "Digital Twin",
        path: "/digital-twin",
        icon: Network,
      },
    ],
  },

  {
    section: "SUSTAINABILITY & REPORTING",
    items: [
      {
        label: "Carbon Intelligence",
        path: "/carbon",
        icon: Leaf,
      },
      {
        label: "Reports",
        path: "/reports",
        icon: FileText,
      },
    ],
  },
];


/* =========================================================
   PAGE META
========================================================= */

const pageMeta = {
  "/dashboard": {
    title: "Grid Command Center",
    subtitle:
      "Real-time smart grid intelligence and system overview",
  },

  "/energy": {
    title: "Energy Monitoring",
    subtitle:
      "Monitor energy consumption and historical grid activity",
  },

  "/forecast": {
    title: "Demand Forecasting",
    subtitle:
      "AI-powered demand prediction and forecast evaluation",
  },

  "/renewable": {
    title: "Renewable Intelligence",
    subtitle:
      "Monitor renewable generation, availability and contribution",
  },

  "/optimization": {
    title: "Grid Optimization",
    subtitle:
      "Intelligent energy balancing and optimization decisions",
  },

  "/failures": {
    title: "Failure Prediction",
    subtitle:
      "AI-based equipment health and failure risk monitoring",
  },

  "/emergency": {
    title: "Emergency Response",
    subtitle:
      "Monitor critical events and recommended grid responses",
  },

  "/digital-twin": {
    title: "Digital Twin",
    subtitle:
      "Visual representation of grid assets and system state",
  },

  "/carbon": {
    title: "Carbon Intelligence",
    subtitle:
      "Track emissions, sustainability and environmental impact",
  },

  "/reports": {
    title: "Executive Reports",
    subtitle:
      "Generate and review GridPulse intelligence reports",
  },
};


/* =========================================================
   APP
========================================================= */

function App() {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [operatorOpen, setOperatorOpen] =
    useState(false);

  const [weatherOpen, setWeatherOpen] =
    useState(false);

  const [statusOpen, setStatusOpen] =
    useState(false);

  const [notifications, setNotifications] =
    useState([]);

  const [weather, setWeather] =
    useState(null);

  const [health, setHealth] =
    useState(null);

  const [weatherLoading, setWeatherLoading] =
    useState(false);

  const [healthLoading, setHealthLoading] =
    useState(false);


  /* =======================================================
     CURRENT PAGE
  ======================================================= */

  const currentPage = useMemo(() => {
    return (
      pageMeta[location.pathname] || {
        title: "GridPulse",
        subtitle:
          "AI-powered smart grid intelligence platform",
      }
    );
  }, [location.pathname]);


  /* =======================================================
     CLOSE MOBILE SIDEBAR ON ROUTE CHANGE
  ======================================================= */

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);


  /* =======================================================
     BODY DRAWER STATE
  ======================================================= */

  useEffect(() => {
    document.body.classList.toggle(
      "drawer-open",
      sidebarOpen
    );

    return () => {
      document.body.classList.remove(
        "drawer-open"
      );
    };
  }, [sidebarOpen]);


  /* =======================================================
     LOAD SYSTEM HEALTH
  ======================================================= */

  const loadHealth = async () => {
    try {
      setHealthLoading(true);

      const response =
        await getSystemHealth();

      setHealth(response);
    } catch (error) {
      console.error(
        "GridPulse health check failed:",
        error
      );

      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };


  /* =======================================================
     LOAD WEATHER
  ======================================================= */

  const loadWeather = async () => {
    try {
      setWeatherLoading(true);

      const response =
        await getWeatherData(1);

      const data = Array.isArray(response)
        ? response
        : response?.data ||
          response?.items ||
          response?.results ||
          [];

      setWeather(
        data[0] ||
          data[data.length - 1] ||
          null
      );
    } catch (error) {
      console.error(
        "GridPulse weather loading failed:",
        error
      );

      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  };


  /* =======================================================
     INITIAL HEADER DATA
  ======================================================= */

  useEffect(() => {
    loadHealth();
    loadWeather();
  }, []);


  /* =======================================================
     LISTEN FOR DASHBOARD NOTIFICATIONS
  ======================================================= */

  useEffect(() => {
    const handleNotifications = (event) => {
      const items =
        event?.detail || [];

      setNotifications(
        Array.isArray(items)
          ? items
          : []
      );
    };

    window.addEventListener(
      "gridpulse:notifications",
      handleNotifications
    );

    return () => {
      window.removeEventListener(
        "gridpulse:notifications",
        handleNotifications
      );
    };
  }, []);


  /* =======================================================
     CLOSE HEADER PANELS
  ======================================================= */

  const closeHeaderPanels = () => {
    setNotificationsOpen(false);
    setOperatorOpen(false);
    setWeatherOpen(false);
    setStatusOpen(false);
  };


  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = () => {
    if (refreshing) return;

    setRefreshing(true);

    window.dispatchEvent(
      new CustomEvent(
        "gridpulse:refresh"
      )
    );

    loadHealth();
    loadWeather();

    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };


  /* =======================================================
     WEATHER VALUES
  ======================================================= */

  const weatherTemperature =
    weather?.temperature ??
    weather?.temperature_c ??
    weather?.temp_c;

  const weatherHumidity =
    weather?.humidity ??
    weather?.humidity_percent;

  const weatherWind =
    weather?.wind_speed ??
    weather?.wind_speed_kmh;


  /* =======================================================
     SYSTEM STATUS
  ======================================================= */

  const healthStatus = String(
    health?.status ||
      health?.message ||
      "ONLINE"
  ).toUpperCase();

  const isOperational =
    healthStatus.includes("HEALTH") ||
    healthStatus.includes("OK") ||
    healthStatus.includes("ONLINE") ||
    healthStatus.includes("CONNECTED");


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="app-shell">

      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      <div
        className={`sidebar-overlay ${
          sidebarOpen ? "show" : ""
        }`}
        onClick={() =>
          setSidebarOpen(false)
        }
        aria-hidden="true"
      />


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`app-sidebar ${
          sidebarOpen
            ? "mobile-open"
            : ""
        }`}
      >

        <div className="sidebar-inner">

          {/* LOGO */}

          <div className="sidebar-brand">

            <div className="brand-mark">
              <Zap
                size={22}
                strokeWidth={2.4}
              />
            </div>

            <div className="brand-copy">
              <span className="brand-name">
                GridPulse
              </span>

              <span className="brand-tagline">
                SMART GRID AI
              </span>
            </div>

            <button
              type="button"
              className="mobile-close-button"
              onClick={() =>
                setSidebarOpen(false)
              }
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>

          </div>


          {/* SIDEBAR SYSTEM STATUS */}

          <button
            type="button"
            className="sidebar-status"
            onClick={() => {
              closeHeaderPanels();
              loadHealth();
            }}
            title="Check system status"
          >

            <span className="status-indicator">
              <span className="status-pulse" />
            </span>

            <div>
              <strong>
                {isOperational
                  ? "System Online"
                  : "System Check"}
              </strong>

              <span>
                {isOperational
                  ? "Grid services operational"
                  : "Checking grid services"}
              </span>
            </div>

          </button>


          {/* NAVIGATION */}

          <nav
            className="sidebar-navigation"
            aria-label="Main navigation"
          >

            {navigation.map(
              (group) => (

                <div
                  className="nav-group"
                  key={group.section}
                >

                  <div className="nav-section-title">
                    {group.section}
                  </div>

                  <div className="nav-items">

                    {group.items.map(
                      (item) => {

                        const Icon =
                          item.icon;

                        return (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            className={({
                              isActive,
                            }) =>
                              `nav-link ${
                                isActive
                                  ? "active"
                                  : ""
                              }`
                            }
                          >

                            <span className="nav-icon">
                              <Icon
                                size={18}
                                strokeWidth={2}
                              />
                            </span>

                            <span className="nav-label">
                              {item.label}
                            </span>

                            <ChevronRight
                              className="nav-arrow"
                              size={15}
                              strokeWidth={2}
                            />

                          </NavLink>
                        );
                      }
                    )}

                  </div>

                </div>
              )
            )}

          </nav>


          {/* SIDEBAR FOOTER */}

          <div className="sidebar-footer">

            <div className="sidebar-footer-card">

              <div className="footer-icon">
                <ShieldCheck size={18} />
              </div>

              <div className="footer-copy">
                <strong>
                  GridPulse AI
                </strong>

                <span>
                  Intelligence Engine v1.0
                </span>
              </div>

            </div>

          </div>

        </div>
      </aside>


      {/* =================================================
          MAIN APPLICATION
      ================================================= */}

      <div className="app-main">


        {/* =================================================
            TOPBAR
        ================================================= */}

        <header className="app-topbar">


          {/* TOPBAR LEFT */}

          <div className="topbar-left">

            <button
              type="button"
              className="mobile-menu-button"
              onClick={() =>
                setSidebarOpen(true)
              }
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>


            <div className="page-heading">

              <div className="breadcrumb">

                <span>
                  GridPulse
                </span>

                <ChevronRight size={13} />

                <span className="breadcrumb-current">
                  {currentPage.title}
                </span>

              </div>


              <div className="page-title-row">

                <div>

                  <h1>
                    {currentPage.title}
                  </h1>

                  <p>
                    {currentPage.subtitle}
                  </p>

                </div>

              </div>

            </div>

          </div>


          {/* =================================================
              TOPBAR RIGHT
          ================================================= */}

          <div className="topbar-right">


            {/* =================================================
                WEATHER
            ================================================= */}

            <div className="topbar-popup-wrapper">

              <button
                type="button"
                className="topbar-weather"
                onClick={() => {

                  setWeatherOpen(
                    (value) => !value
                  );

                  setStatusOpen(false);
                  setNotificationsOpen(false);
                  setOperatorOpen(false);

                  if (!weather) {
                    loadWeather();
                  }

                }}
                title="View weather intelligence"
              >

                <div className="weather-icon">
                  <CloudSun size={19} />
                </div>

                <div className="weather-info">

                  <strong>
                    {weatherTemperature !==
                      undefined &&
                    weatherTemperature !==
                      null
                      ? `${Number(
                          weatherTemperature
                        ).toFixed(1)}°C`
                      : "--"}
                  </strong>

                  <span>
                    Grid Area
                  </span>

                </div>

              </button>


              {weatherOpen && (

                <div className="header-popup weather-popup">

                  <div className="popup-header">

                    <div>
                      <span>
                        WEATHER INTELLIGENCE
                      </span>

                      <strong>
                        Current Conditions
                      </strong>
                    </div>

                    <CloudSun size={20} />

                  </div>


                  {weatherLoading ? (

                    <div className="popup-loading">
                      Loading weather data...
                    </div>

                  ) : (

                    <div className="weather-popup-stats">

                      <div>
                        <span>
                          TEMPERATURE
                        </span>

                        <strong>
                          {weatherTemperature !==
                            undefined &&
                          weatherTemperature !==
                            null
                            ? `${Number(
                                weatherTemperature
                              ).toFixed(1)}°C`
                            : "--"}
                        </strong>
                      </div>


                      <div>
                        <span>
                          HUMIDITY
                        </span>

                        <strong>
                          {weatherHumidity !==
                            undefined &&
                          weatherHumidity !==
                            null
                            ? `${Number(
                                weatherHumidity
                              ).toFixed(0)}%`
                            : "--"}
                        </strong>
                      </div>


                      <div>
                        <span>
                          WIND SPEED
                        </span>

                        <strong>
                          {weatherWind !==
                            undefined &&
                          weatherWind !==
                            null
                            ? `${Number(
                                weatherWind
                              ).toFixed(1)} km/h`
                            : "--"}
                        </strong>
                      </div>

                    </div>

                  )}

                </div>

              )}

            </div>


            <div className="topbar-divider" />


            {/* =================================================
                SYSTEM STATUS
            ================================================= */}

            <div className="topbar-popup-wrapper">

              <button
                type="button"
                className="topbar-system-status"
                onClick={() => {

                  setStatusOpen(
                    (value) => !value
                  );

                  setOperatorOpen(false);
                  setNotificationsOpen(false);
                  setWeatherOpen(false);

                  loadHealth();

                }}
                title="View system health"
              >

                <span
                  className={`online-dot ${
                    isOperational
                      ? ""
                      : "warning"
                  }`}
                />

                <div>

                  <strong>
                    {isOperational
                      ? "Operational"
                      : "Check Required"}
                  </strong>

                  <span>
                    {isOperational
                      ? "All core services"
                      : healthStatus}
                  </span>

                </div>

              </button>


              {/* SYSTEM STATUS POPUP */}

              {statusOpen && (

                <div className="header-popup status-popup">

                  <div className="popup-header">

                    <div>
                      <span>
                        GRIDPULSE SYSTEM
                      </span>

                      <strong>
                        System Status
                      </strong>
                    </div>

                    <ShieldCheck size={20} />

                  </div>


                  <div className="status-popup-content">

                    <div className="status-main">

                      <span
                        className={`status-large-dot ${
                          isOperational
                            ? "status-ok"
                            : "status-warning"
                        }`}
                      />

                      <div>

                        <strong>
                          {healthLoading
                            ? "Checking System..."
                            : isOperational
                            ? "System Operational"
                            : "System Check Required"}
                        </strong>

                        <span>
                          {healthLoading
                            ? "Checking backend health..."
                            : health?.message ||
                              "GridPulse backend is responding."}
                        </span>

                      </div>

                    </div>


                    <div className="status-details">

                      <div>
                        <span>
                          BACKEND
                        </span>

                        <strong>
                          {health
                            ? "Connected"
                            : "Unavailable"}
                        </strong>
                      </div>


                      <div>
                        <span>
                          API
                        </span>

                        <strong>
                          {health
                            ? "Online"
                            : "Check"}
                        </strong>
                      </div>


                      <div>
                        <span>
                          HEALTH
                        </span>

                        <strong>
                          {health
                            ? healthStatus
                            : "N/A"}
                        </strong>
                      </div>

                    </div>

                  </div>

                </div>

              )}

            </div>


            {/* =================================================
                REFRESH
            ================================================= */}

            <button
              type="button"
              className="topbar-action"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh dashboard"
              title="Refresh GridPulse"
            >

              <RefreshCw
                size={18}
                className={
                  refreshing
                    ? "refreshing"
                    : ""
                }
              />

            </button>


            {/* =================================================
                NOTIFICATIONS
            ================================================= */}

            <div className="topbar-popup-wrapper">

              <button
                type="button"
                className="topbar-action notification-button"
                onClick={() => {

                  setNotificationsOpen(
                    (value) => !value
                  );

                  setOperatorOpen(false);
                  setWeatherOpen(false);
                  setStatusOpen(false);

                }}
                aria-label="Notifications"
                title="GridPulse notifications"
              >

                <Bell size={18} />

                <span className="notification-badge">
                  {notifications.length || 0}
                </span>

              </button>


              {notificationsOpen && (

                <div className="header-popup notification-popup">

                  <div className="popup-header">

                    <div>
                      <span>
                        GRIDPULSE INTELLIGENCE
                      </span>

                      <strong>
                        Notifications
                      </strong>
                    </div>

                    <Bell size={19} />

                  </div>


                  <div className="notification-list">

                    {notifications.length >
                    0 ? (

                      notifications.map(
                        (item, index) => (

                          <div
                            className={`notification-item ${
                              item.type ||
                              "info"
                            }`}
                            key={`${item.text}-${index}`}
                          >

                            <div className="notification-icon">

                              {item.type ===
                              "warning" ? (

                                <TriangleAlert
                                  size={16}
                                />

                              ) : item.type ===
                                "success" ? (

                                <CheckCircle2
                                  size={16}
                                />

                              ) : (

                                <Activity
                                  size={16}
                                />

                              )}

                            </div>


                            <span>
                              {item.text}
                            </span>

                          </div>

                        )
                      )

                    ) : (

                      <div className="popup-empty">
                        No intelligence updates available.
                      </div>

                    )}

                  </div>

                </div>

              )}

            </div>


            {/* =================================================
                OPERATOR PROFILE
            ================================================= */}

            <div className="topbar-popup-wrapper">

              <button
                type="button"
                className="operator-profile"
                onClick={() => {

                  setOperatorOpen(
                    (value) => !value
                  );

                  setNotificationsOpen(false);
                  setWeatherOpen(false);
                  setStatusOpen(false);

                }}
                aria-label="Operator profile"
                title="Grid Operator"
              >

                <div className="operator-avatar">
                  OP
                </div>


                <div className="operator-info">

                  <strong>
                    Grid Operator
                  </strong>

                  <span>
                    Administrator
                  </span>

                </div>

              </button>


              {operatorOpen && (

                <div className="header-popup operator-popup">

                  <div className="operator-popup-header">

                    <div className="operator-large-avatar">
                      OP
                    </div>

                    <div>

                      <strong>
                        Grid Operator
                      </strong>

                      <span>
                        Administrator
                      </span>

                    </div>

                  </div>


                  <div className="operator-details">

                    <div>
                      <span>
                        PLATFORM
                      </span>

                      <strong>
                        GridPulse AI
                      </strong>
                    </div>


                    <div>
                      <span>
                        ENGINE
                      </span>

                      <strong>
                        Intelligence Engine v1.0
                      </strong>
                    </div>


                    <div>
                      <span>
                        SYSTEM
                      </span>

                      <strong>
                        {isOperational
                          ? "Operational"
                          : "Attention Required"}
                      </strong>
                    </div>

                  </div>

                </div>

              )}

            </div>

          </div>

        </header>


        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <main className="app-content">

          <div className="content-wrapper">
            <Outlet />
          </div>

        </main>


        {/* =================================================
            MOBILE BOTTOM NAV
        ================================================= */}

        <nav
          className="mobile-bottom-nav"
          aria-label="Mobile navigation"
        >

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `mobile-nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <CircleGauge size={20} />
            <span>Home</span>
          </NavLink>


          <NavLink
            to="/energy"
            className={({ isActive }) =>
              `mobile-nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <Activity size={20} />
            <span>Energy</span>
          </NavLink>


          <NavLink
            to="/forecast"
            className={({ isActive }) =>
              `mobile-nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <BarChart3 size={20} />
            <span>Forecast</span>
          </NavLink>


          <NavLink
            to="/renewable"
            className={({ isActive }) =>
              `mobile-nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <Leaf size={20} />
            <span>Renewable</span>
          </NavLink>


          <button
            type="button"
            className="mobile-nav-item"
            onClick={() =>
              setSidebarOpen(true)
            }
          >
            <Menu size={20} />
            <span>Menu</span>
          </button>

        </nav>

      </div>

    </div>
  );
}


export default App;