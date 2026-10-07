# ⚡ GridPulse

### AI-Powered Smart Grid Intelligence & Demand Forecasting Platform

GridPulse is an AI-powered smart grid intelligence and decision-support platform designed to help grid operators monitor energy consumption, forecast demand, analyze renewable energy availability, identify operational risks, optimize energy resources, and generate executive-level reports from a unified dashboard.

The platform combines **machine learning, FastAPI, PostgreSQL, React, and real-time API-driven dashboards** to transform raw smart-grid data into actionable operational insights.

## 🌐 Overview

Modern power grids generate large volumes of data from smart meters, weather systems, renewable energy assets, batteries, and other grid infrastructure. Without intelligent analytics, this data can be difficult to interpret and act upon quickly.

GridPulse addresses this challenge by providing a centralized intelligence platform for:

* Energy consumption monitoring
* AI-based demand forecasting
* Renewable energy intelligence
* Grid optimization
* Failure and risk prediction
* Anomaly detection
* Emergency response support
* Digital twin visualization
* Carbon intelligence
* Executive reporting

The goal is to help decision-makers understand **what is happening, what may happen next, and what actions can be considered**.

## 🎯 Problem Statement

Large-scale smart grids can face several operational challenges:

* Unexpected demand peaks
* Energy wastage
* Renewable energy imbalance
* Grid instability
* Equipment and operational risks
* Difficulties in interpreting large volumes of meter data
* Delayed response to abnormal conditions
* Lack of centralized operational intelligence
* Limited visibility into carbon impact and energy efficiency

GridPulse provides an integrated platform that brings these intelligence capabilities together in one system.

# 🚀 Key Features

## 1. ⚡ Energy Monitoring

The Energy Monitoring module processes and displays energy consumption information through the backend API and frontend dashboard.

### Implemented:

* Smart-meter energy data processing
* Historical consumption retrieval
* Latest meter reading
* Consumption summaries
* Backend API integration
* Dashboard visualization
* Consumption trend analysis

## 2. 📈 AI Demand Forecasting

GridPulse includes a machine-learning based demand forecasting pipeline.

### Implemented:

* Forecast model training
* Forecast model loading
* Forecast result generation
* Historical energy data processing
* Forecast evaluation
* Multiple forecast horizons
* Model performance metrics
* Stored trained model artifact

The trained model is stored as:

```text
backend/app/ml/models/gridpulse_forecast_model.joblib
```

### Current Evaluation Results

| Metric           | Result |
| ---------------- | -----: |
| R² Score         | 0.9923 |
| MAE              |   1.46 |
| RMSE             |   1.68 |
| Test Samples     |      5 |
| Training Samples |     19 |

These metrics represent the current implemented forecasting model evaluation.


## 3. ☀️ Renewable Energy Intelligence

GridPulse analyzes renewable generation information to provide visibility into available renewable resources.

### Implemented:

* Solar energy data
* Wind energy data
* Renewable energy API
* Renewable availability analysis
* Integration with optimization logic
* Dashboard visualization

Example system data includes:

```text
Solar Generation: 9.8 kWh
Wind Generation: 19.6 kWh
```

## 4. 🔋 Grid Optimization

The Grid Optimization module uses available renewable energy and grid information to generate operational optimization recommendations.

### Implemented:

* Renewable surplus analysis
* Battery charging recommendations
* Optimization API
* Backend optimization service
* Frontend optimization dashboard

Example implemented recommendation:

```text
Recommended Battery Charging:
~28.40 kWh from renewable surplus
```

The purpose is to reduce renewable energy wastage and improve resource utilization.

## 5. 🛡️ Failure Prediction & Risk Intelligence

GridPulse includes a failure prediction module that evaluates multiple operational signals and generates risk levels.

### Implemented:

* Multi-factor risk scoring
* Historical consumption analysis
* Renewable generation context
* Battery state context
* Consumption volatility analysis
* Baseline comparison
* Anomaly detection
* Component-level risk assessment
* Overall system risk score
* Risk distribution
* Frontend risk visualization

The system categorizes risks into:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

Current implemented API output provides an overall risk score and identifies higher-risk operational factors such as voltage and frequency deviation.


## 6. 🚨 Emergency Response

GridPulse includes an Emergency Response module designed to support operators when abnormal or critical grid conditions are detected.

### Implemented:

* Emergency response API router
* Emergency response service
* Frontend emergency response interface
* Operational response logic
* Risk-based response information

The module is designed as a decision-support layer rather than an autonomous control system.

## 7. 🧠 Digital Twin

The Digital Twin module provides a software representation of the smart-grid environment for monitoring and operational analysis.

### Implemented:

* Digital Twin backend router
* Digital Twin service layer
* Frontend Digital Twin page
* Grid asset/operational representation
* Integration with the overall GridPulse architecture

## 8. 🌱 Carbon Intelligence

GridPulse includes a Carbon Intelligence module for analyzing energy-related carbon impact.

### Implemented:

* Carbon intelligence API
* Carbon intelligence service
* Carbon AI service
* Carbon report service
* Frontend carbon intelligence dashboard
* Carbon-related operational insights

This module connects energy intelligence with sustainability-oriented decision support.

## 9. 📊 Executive Dashboard

The Executive Dashboard acts as the main command center of GridPulse.

It brings important system information into one interface.

### Dashboard includes:

* Current consumption
* Renewable availability
* Battery information
* Forecast performance
* Forecast evaluation
* Grid optimization information
* Weather information
* System health
* Operational status
* Quick navigation to intelligence modules

### Current dashboard reference values

```text
Current Consumption: 1.0 kWh
Renewable Availability: 86%
Battery: 84 kWh
Forecast R²: 0.9923
Forecast MAE: 1.46
Forecast RMSE: 1.68
```

## 10. 📄 Executive Reporting

GridPulse includes an executive reporting system capable of generating PDF reports.

### Implemented:

* Executive report API
* Report service
* Executive PDF service
* ReportLab-based PDF generation
* Frontend Reports page
* Downloadable executive report

The reporting layer converts system intelligence into a more formal executive-level output.

# 🏗️ System Architecture

GridPulse follows a layered architecture:

```text
┌─────────────────────────────────────────────────────────────┐
│                    USERS / OPERATORS                        │
│              Grid Operators • Decision Makers              │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 REACT + VITE FRONTEND                       │
│                                                             │
│ Dashboard • Energy • Forecast • Renewable • Optimization   │
│ Failure • Emergency • Digital Twin • Carbon • Reports      │
└─────────────────────────────┬───────────────────────────────┘
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND                           │
│                                                             │
│ API Routers • Services • Schemas • Validation • Health      │
│ Reporting • Business Logic                                  │
└───────────────┬─────────────────────────┬───────────────────┘
                │                         │
                ▼                         ▼
┌──────────────────────────┐    ┌─────────────────────────────┐
│       AI / ML LAYER      │    │      POSTGRESQL DATABASE    │
│                          │    │                             │
│ Demand Forecasting       │    │ Energy Consumption          │
│ Forecast Evaluation      │    │ Weather Data                │
│ Failure Prediction       │    │ Renewable Energy            │
│ Anomaly Detection        │    │ Forecast Results             │
│ Renewable Intelligence   │    │ Carbon / Operational Data   │
│ Optimization Logic       │    │                             │
└──────────────┬───────────┘    └─────────────────────────────┘
               │
               ▼
┌──────────────────────────┐
│     TRAINED ML MODEL     │
│ gridpulse_forecast_      │
│ model.joblib             │
└──────────────────────────┘
```

# 🧩 Application Modules

GridPulse currently contains the following frontend modules:

| Module                 | Purpose                                |
| ---------------------- | -------------------------------------- |
| Dashboard              | Central smart-grid command center      |
| Energy Monitoring      | Monitor consumption and meter data     |
| Demand Forecast        | AI-based demand prediction             |
| Renewable Intelligence | Solar and wind intelligence            |
| Grid Optimization      | Energy resource optimization           |
| Failure Prediction     | Risk and anomaly analysis              |
| Emergency Response     | Emergency decision support             |
| Digital Twin           | Grid representation and analysis       |
| Carbon Intelligence    | Carbon and sustainability intelligence |
| Reports                | Executive PDF reporting                |


# 🛠️ Technology Stack

## Frontend

* React
* Vite
* JavaScript / JSX
* Axios
* Recharts
* Lucide React
* CSS

## Backend

* Python
* FastAPI
* SQLAlchemy
* Pydantic
* Alembic
* ReportLab

## Database

* PostgreSQL

## Machine Learning

* Python ML pipeline
* Demand forecasting
* Model evaluation
* Anomaly detection
* Risk scoring
* Forecast model serialization with Joblib

## Development & Version Control

* VS Code
* Git
* GitHub
* PowerShell

# 🗄️ Database & Data Layer

GridPulse uses PostgreSQL for structured storage of operational and analytical data.

### Current database areas include:

```text
energy_consumption
weather_data
renewable_energy
forecast_results
carbon intelligence / operational data
```

Database migrations are managed using **Alembic**.

# 🔌 Backend API

The backend is implemented using FastAPI and follows a modular API architecture.

Major API areas include:

```text
/api/v1/energy-consumption
/api/v1/weather
/api/v1/renewable-energy
/api/v1/grid-optimization
/api/v1/failure-prediction
/api/v1/carbon-intelligence
/api/v1/emergency-response
/api/v1/digital-twin
/api/v1/reports
/forecast
```

Health monitoring is available through:

```text
/health
```
# 📁 Project Structure

```text
GridPulse/
│
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   ├── core/
│   │   ├── ml/
│   │   │   └── models/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── pages/
│       ├── services/
│       ├── styles/
│       ├── App.jsx
│       ├── App.css
│       └── index.css
│
└── .gitignore


# 💻 Local Setup

## 1. Clone the repository

```bash
git clone https://github.com/Malaika-Naz315/GridPulse.git
cd GridPulse
```


## 2. Backend Setup

Navigate to the backend:

```powershell
cd backend
```

Create and activate the virtual environment:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Configure the environment using the provided example:

```text
.env.example
```

Then start the FastAPI server:

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Backend:

```text
http://127.0.0.1:8000
```

Health check:

```text
http://127.0.0.1:8000/health
```

## 3. Frontend Setup

Open another terminal and navigate to:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Dashboard:

```text
http://localhost:5173/dashboard
```
# 🔐 Environment & Security

Sensitive environment files are intentionally excluded from version control.

The repository contains:

```text
backend/.env.example
```

but the actual:

```text
backend/.env
```

is ignored by Git and should never be committed when it contains credentials or private configuration.

# 📌 Project Scale Scenario

GridPulse is designed around a large-scale smart-grid scenario involving:

* **250 power stations**
* **40 solar farms**
* **18 wind farms**
* **12 battery storage facilities**
* **15 million smart meters**

These figures represent the target smart-grid scenario used to frame the platform's operational requirements.

# 🎯 Project Objectives

GridPulse was developed to demonstrate how AI and modern software architecture can support smart-grid operations by:

1. Monitoring energy consumption.
2. Forecasting future demand.
3. Understanding renewable energy availability.
4. Optimizing energy resources.
5. Detecting abnormal operational conditions.
6. Predicting potential failures and risks.
7. Supporting emergency response decisions.
8. Representing grid operations through a digital twin.
9. Connecting energy intelligence with carbon analysis.
10. Producing executive-level reports.

# 📈 Current Implementation Highlights

### Backend

* FastAPI REST architecture
* Modular routers
* Service-layer architecture
* Pydantic schemas
* SQLAlchemy database layer
* Alembic migrations
* PostgreSQL integration
* ML model pipeline
* Forecast evaluation
* Failure prediction
* Renewable intelligence
* Grid optimization
* Carbon intelligence
* Digital twin services
* Emergency response services
* PDF report generation

### Frontend

* React + Vite application
* Premium light smart-grid interface
* Responsive dashboard structure
* API-connected modules
* Interactive charts
* Operational cards
* Risk visualizations
* Forecast visualizations
* Renewable intelligence views
* Optimization interface
* Failure prediction interface
* Emergency response interface
* Digital twin interface
* Carbon intelligence interface
* Executive reporting interface

# 🔬 Model Performance

The currently implemented demand forecasting model achieved:

```text
R²   = 0.9923
MAE  = 1.46
RMSE = 1.68
```

These metrics are based on the current project dataset and evaluation pipeline.


# 🔮 Future Improvements

Potential future improvements include:

* Larger real-world smart-grid datasets
* Longer historical forecasting windows
* Advanced time-series architectures
* Grid topology-aware graph learning
* Reinforcement-learning based control optimization
* More advanced explainability
* Real-time streaming smart-meter ingestion
* More extensive model monitoring
* Cloud deployment
* Role-based access control
* Automated alert notifications
* Larger-scale performance testing

# 👩‍💻 Project

**GridPulse — AI-Powered Smart Grid Intelligence & Demand Forecasting Platform**

**Project:** Ezitech Project #02 — EEF AI-023

**Primary Technologies:** React, Vite, FastAPI, Python, PostgreSQL, SQLAlchemy, Alembic, Machine Learning

**Repository:**
https://github.com/Malaika-Naz315/GridPulse

## ⭐ Why GridPulse?

GridPulse is more than a dashboard. It brings together **data processing, machine learning, operational intelligence, optimization, risk analysis, sustainability intelligence, and executive reporting** into a single smart-grid platform.

The project demonstrates how an AI-powered software system can turn complex energy data into meaningful information for monitoring, forecasting, risk awareness, and operational decision support.

### ⚡ GridPulse

**Monitor. Forecast. Analyze. Optimize. Respond.**

