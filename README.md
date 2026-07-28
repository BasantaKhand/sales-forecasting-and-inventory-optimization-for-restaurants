# Sales Forecasting & Inventory Optimization System

**Restaurant Predictive Analysis — Individual Thesis Project**

A full-stack analytics platform for a Nepali restaurant (Deurali Thakali) that
turns three years of point-of-sale history into demand forecasts and
inventory decisions. It compares two time-series models (Facebook Prophet and
ARIMA/SARIMAX), visualizes sales trends, and generates forecast-driven reorder
suggestions and low-stock alerts.

## Features

1. **JWT Authentication** — register/login with role-based users (admin/staff).
2. **Sales Management** — paginated, filterable sales explorer with CSV import/export.
3. **Demand Forecasting** — Prophet and ARIMA forecasts for overall revenue, individual items, and categories.
4. **Model Comparison** — back-tests Prophet vs ARIMA with RMSE/MAE/MAPE and a winner.
5. **Inventory Optimization** — forecast-driven reorder quantities and cost estimates.
6. **Reports & Analytics** — revenue trends, top/bottom items, seasonal (day/month/festival/weather) patterns, and category analysis.
7. **Alerts & Notifications** — low-stock and high-demand alerts with a header notification bell.

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, React Router, Recharts, Axios, react-hot-toast
- **Backend:** Python Flask (REST API), Flask-JWT-Extended, Flask-CORS
- **Database:** MongoDB (PyMongo)
- **ML Models:** Facebook Prophet, statsmodels SARIMAX, scikit-learn (metrics)

## Project Structure

```
restaurant-sales-forecasting/
├── backend/          Flask API, ML services, seed script
├── frontend/         React + Vite + Tailwind app
└── data/             nepali_restaurant_sales_data.csv
```

## Setup

### Prerequisites
- Python 3.11+ and pip
- Node.js 18+ and npm
- MongoDB running locally on `mongodb://localhost:27017`

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows (use: source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
copy .env.example .env          # then adjust values if needed
python seed_data.py             # resets DB, imports data, creates users + inventory
python run.py                   # starts API on http://localhost:5000
```

> **Prophet note (Windows):** if Prophet fails to initialize with a
> "CmdStan installation missing makefile" error, run
> `python -c "import cmdstanpy; cmdstanpy.install_cmdstan(overwrite=True)"`
> (or create an empty `makefile` in the bundled
> `prophet/stan_model/cmdstan-*/` folder). The precompiled model then loads.

### Frontend
```bash
cd frontend
npm install
npm run dev                     # starts app on http://localhost:3000
```

The Vite dev server proxies `/api` requests to the Flask backend on port 5000.

## Default Login Credentials

| Role  | Email               | Password  |
|-------|---------------------|-----------|
| Admin | admin@deurali.com   | admin123  |
| Staff | staff@deurali.com   | staff123  |

## Dataset

- ~206,000 sales line-items across **3 years** (2022–2024)
- **194** unique menu items across **38** categories
- Fields include date, meal period, item, category, quantity, prices, weather,
  temperature, weekend/holiday flags, festival events, season, and order type.

## API Endpoints (summary)

| Area      | Endpoints |
|-----------|-----------|
| Auth      | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/change-password` |
| Sales     | `GET /api/sales`, `GET /api/sales/summary`, `GET /api/sales/daily-totals`, `POST /api/sales/import-csv`, `GET /api/sales/items`, `GET /api/sales/categories` |
| Forecast  | `GET /api/forecast/overall`, `/item/<name>`, `/category/<name>`, `/compare`, `/top-demand` |
| Inventory | `GET/POST/PUT/DELETE /api/inventory`, `GET /api/inventory/alerts`, `POST /api/inventory/optimize` |
| Reports   | `GET /api/reports/revenue`, `/top-items`, `/bottom-items`, `/trends`, `/category-performance`, `/category-trends`, `/overview` |

## Screenshots

_Add dashboard, forecast, inventory, and reports screenshots here._
