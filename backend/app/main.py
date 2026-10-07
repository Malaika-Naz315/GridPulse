from fastapi import FastAPI

from app.api.v1.health import router as health_router
from app.api.v1.energy_consumption import router as energy_consumption_router
from app.api.v1.weather_data import router as weather_data_router
from app.api.v1.forecast import router as forecast_router
from app.api.v1.renewable_energy import router as renewable_energy_router
from app.api.v1.grid_optimization import router as grid_optimization_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.failure_prediction import (
    router as failure_prediction_router
)
from app.api.v1.emergency_response import (
    router as emergency_response_router
)
from app.api.v1.digital_twin import router as digital_twin_router
from app.api.v1.carbon_intelligence import (
    router as carbon_intelligence_router,
)
from app.api.v1.reports import (
    router as reports_router,
)

app = FastAPI(
    title="GridPulse API",
    description=(
        "AI-Powered Smart Grid Intelligence & Demand Forecasting Platform"
    ),
    version="1.0.0",
)


@app.get(
    "/",
    tags=["Root"],
)
def root():
    return {
        "message": "GridPulse API is running",
        "status": "online",
        "version": "1.0.0",
    }


# ---------------------------------------------------------
# Health
# ---------------------------------------------------------

app.include_router(
    health_router,
)


# ---------------------------------------------------------
# API v1
# ---------------------------------------------------------

app.include_router(
    energy_consumption_router,
)

app.include_router(
    weather_data_router,
)

app.include_router(
    forecast_router,
)

app.include_router(
    renewable_energy_router,
)
app.include_router(
    grid_optimization_router,
)
app.include_router(failure_prediction_router)
app.include_router(emergency_response_router)
app.include_router(digital_twin_router)
app.include_router(carbon_intelligence_router)
app.include_router(
    reports_router
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
