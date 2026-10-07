import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const getEnergyConsumption = async (limit = 100) => {
  const response = await api.get(
    `/api/v1/energy-consumption?limit=${limit}`
  );

  return response.data;
};

export const getEnergySummary = async () => {
  const response = await api.get(
    "/api/v1/energy-consumption/analysis/summary"
  );

  return response.data;
};

export const getWeatherData = async (limit = 100) => {
  const response = await api.get(
    `/api/v1/weather?limit=${limit}`
  );

  return response.data;
};

export const getForecasts = async (limit = 100) => {
  const response = await api.get(
    `/forecast?limit=${limit}`
  );

  return response.data;
};

export const evaluateForecast = async () => {
  const response = await api.get(
    "/forecast/evaluate"
  );

  return response.data;
};

export const getForecastHorizon = async (horizon = "24H") => {
  const response = await api.get(
    `/forecast/horizon?horizon=${horizon}`
  );

  return response.data;
};

export const getRenewableEnergy = async (limit = 100) => {
  const response = await api.get(
    `/api/v1/renewable-energy?limit=${limit}`
  );

  return response.data;
};

export const getGridOptimization = async () => {
  const response = await api.post(
    "/api/v1/grid-optimization"
  );

  return response.data;
};

export const getLatestMeterReading = async () => {
  const response = await api.get(
    "/api/v1/energy-consumption/latest"
  );

  return response.data;
};
export const getSystemHealth = async () => {
  const response = await api.get("/health");
  return response.data;
};

export const downloadExecutiveReport = async () => {
  const response = await api.get(
    "/api/v1/reports/executive/pdf",
    {
      responseType: "blob",
    }
  );

  return response.data;
};

export default api;