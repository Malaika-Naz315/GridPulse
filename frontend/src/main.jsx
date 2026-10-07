import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import "./index.css";
import App from "./App.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import EnergyMonitoring from "./pages/EnergyMonitoring.jsx";
import DemandForecast from "./pages/DemandForecast.jsx";
import RenewableIntelligence from "./pages/RenewableIntelligence.jsx";
import GridOptimization from "./pages/GridOptimization.jsx";
import FailurePrediction from "./pages/FailurePrediction.jsx";
import EmergencyResponse from "./pages/EmergencyResponse.jsx";
import DigitalTwin from "./pages/DigitalTwin.jsx";
import CarbonIntelligence from "./pages/CarbonIntelligence.jsx";
import Reports from "./pages/Reports.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Main Application Shell */}
        <Route element={<App />}>
          {/* Command Center */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Energy Intelligence */}
          <Route
            path="/energy"
            element={<EnergyMonitoring />}
          />
          <Route
            path="/forecast"
            element={<DemandForecast />}
          />
          <Route
            path="/renewable"
            element={<RenewableIntelligence />}
          />

          {/* Grid Operations */}
          <Route
            path="/optimization"
            element={<GridOptimization />}
          />
          <Route
            path="/failures"
            element={<FailurePrediction />}
          />
          <Route
            path="/emergency"
            element={<EmergencyResponse />}
          />
          <Route
            path="/digital-twin"
            element={<DigitalTwin />}
          />

          {/* Sustainability & Reporting */}
          <Route
            path="/carbon"
            element={<CarbonIntelligence />}
          />
          <Route
            path="/reports"
            element={<Reports />}
          />

          {/* Default route */}
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          {/* Unknown route */}
          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);