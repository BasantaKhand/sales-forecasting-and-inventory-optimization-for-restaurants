"""Forecasting service (ARIMA + Prophet).

Provides a :class:`ForecastService` that pulls daily sales aggregates from
MongoDB and produces demand/revenue forecasts using either Facebook Prophet or
a statsmodels SARIMAX model, plus a head-to-head accuracy comparison.
"""
import logging
import warnings
from datetime import timedelta

import numpy as np
import pandas as pd

from ..models.sale import COLLECTION

# --- Silence the noisy ML back-ends ---------------------------------------
logging.getLogger("prophet").setLevel(logging.ERROR)
logging.getLogger("cmdstanpy").setLevel(logging.ERROR)
logging.getLogger("prophet.plot").setLevel(logging.ERROR)

MIN_DATA_POINTS = 30


class ForecastService:
    """Trains ARIMA/Prophet models and produces demand/revenue forecasts."""

    def __init__(self, db):
        self.db = db

    # ------------------------------------------------------------------ #
    # Data preparation
    # ------------------------------------------------------------------ #
    def prepare_data(self, item_name=None, category=None, days_back=365,
                     metric=None):
        """Aggregate daily sales into a Prophet-style ``(ds, y)`` frame.

        ``metric`` is ``"revenue"`` (sum of total_price_npr) or ``"quantity"``.
        When omitted it defaults to revenue for the whole restaurant and
        quantity when a specific item/category is requested.
        """
        if metric is None:
            metric = "quantity" if (item_name or category) else "revenue"
        value_field = "total_price_npr" if metric == "revenue" else "quantity"

        collection = self.db[COLLECTION]

        match = {}
        if item_name:
            match["item_name"] = item_name
        if category:
            match["category"] = category

        # Latest date within this slice, to anchor the days_back window.
        latest = collection.find_one(match, sort=[("date", -1)])
        if not latest:
            raise ValueError("No sales data found for the requested selection")
        max_date = latest["date"]
        start_date = max_date - timedelta(days=days_back)

        match_with_date = dict(match)
        match_with_date["date"] = {"$gte": start_date}

        pipeline = [
            {"$match": match_with_date},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$date"}
                    },
                    "y": {"$sum": f"${value_field}"},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        rows = list(collection.aggregate(pipeline))
        if not rows:
            raise ValueError("No sales data found for the requested selection")

        df = pd.DataFrame(rows)
        df["ds"] = pd.to_datetime(df["_id"])
        df = df[["ds", "y"]].sort_values("ds")

        # Fill missing calendar days with 0 so the series is continuous.
        full_range = pd.date_range(df["ds"].min(), df["ds"].max(), freq="D")
        df = (
            df.set_index("ds")
            .reindex(full_range, fill_value=0)
            .rename_axis("ds")
            .reset_index()
        )
        df.columns = ["ds", "y"]
        df["y"] = df["y"].astype(float)

        if len(df) < MIN_DATA_POINTS:
            raise ValueError(
                f"Not enough data points ({len(df)}); "
                f"at least {MIN_DATA_POINTS} required"
            )
        return df

    # ------------------------------------------------------------------ #
    # Nepali festival calendar (approximate) for Prophet holidays
    # ------------------------------------------------------------------ #
    @staticmethod
    def _nepali_holidays():
        rows = []
        for year in range(2021, 2028):
            rows.append({"holiday": "dashain", "ds": f"{year}-10-15",
                         "lower_window": -7, "upper_window": 7})
            rows.append({"holiday": "tihar", "ds": f"{year}-11-05",
                         "lower_window": -3, "upper_window": 4})
            rows.append({"holiday": "nepali_new_year", "ds": f"{year}-04-14",
                         "lower_window": -2, "upper_window": 2})
        holidays = pd.DataFrame(rows)
        holidays["ds"] = pd.to_datetime(holidays["ds"])
        return holidays

    # ------------------------------------------------------------------ #
    # Prophet
    # ------------------------------------------------------------------ #
    def forecast_prophet(self, df, periods=30):
        """Forecast ``periods`` days ahead with Facebook Prophet."""
        from prophet import Prophet

        model = Prophet(
            weekly_seasonality=True,
            yearly_seasonality=True,
            daily_seasonality=False,
            holidays=self._nepali_holidays(),
            interval_width=0.8,
        )
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model.fit(df)
            future = model.make_future_dataframe(periods=periods)
            forecast = model.predict(future)

        out = forecast.tail(periods)[
            ["ds", "yhat", "yhat_lower", "yhat_upper"]
        ].copy()
        for col in ("yhat", "yhat_lower", "yhat_upper"):
            out[col] = out[col].clip(lower=0)
        return out.reset_index(drop=True)

    # ------------------------------------------------------------------ #
    # ARIMA / SARIMAX
    # ------------------------------------------------------------------ #
    def forecast_arima(self, df, periods=30):
        """Forecast ``periods`` days ahead with a seasonal SARIMAX(1,1,1)(1,1,1,7)."""
        from statsmodels.tsa.statespace.sarimax import SARIMAX

        series = df.set_index("ds")["y"]
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model = SARIMAX(
                series,
                order=(1, 1, 1),
                seasonal_order=(1, 1, 1, 7),
                enforce_stationarity=False,
                enforce_invertibility=False,
            )
            # NOTE: statsmodels' default "lbfgs" optimizer passes a ``disp``
            # kwarg that newer SciPy (>=1.15) removed from fmin_l_bfgs_b, so we
            # use Powell which is stable, fast, and avoids that call path.
            fitted = model.fit(disp=False, method="powell")
            pred = fitted.get_forecast(steps=periods)
            mean = pred.predicted_mean
            conf = pred.conf_int(alpha=0.2)

        last_date = df["ds"].max()
        future_dates = pd.date_range(
            last_date + timedelta(days=1), periods=periods, freq="D"
        )
        out = pd.DataFrame(
            {
                "ds": future_dates,
                "yhat": np.asarray(mean, dtype=float),
                "yhat_lower": np.asarray(conf.iloc[:, 0], dtype=float),
                "yhat_upper": np.asarray(conf.iloc[:, 1], dtype=float),
            }
        )
        for col in ("yhat", "yhat_lower", "yhat_upper"):
            out[col] = out[col].clip(lower=0)
        return out.reset_index(drop=True)

    # ------------------------------------------------------------------ #
    # Model comparison
    # ------------------------------------------------------------------ #
    @staticmethod
    def _metrics(actual, predicted):
        actual = np.asarray(actual, dtype=float)
        predicted = np.asarray(predicted, dtype=float)
        rmse = float(np.sqrt(np.mean((predicted - actual) ** 2)))
        mae = float(np.mean(np.abs(predicted - actual)))
        nonzero = actual != 0
        if nonzero.any():
            mape = float(
                np.mean(
                    np.abs(
                        (actual[nonzero] - predicted[nonzero]) / actual[nonzero]
                    )
                )
                * 100
            )
        else:
            mape = None
        return {"rmse": round(rmse, 2), "mae": round(mae, 2),
                "mape": round(mape, 2) if mape is not None else None}

    def compare_models(self, df, test_days=30):
        """Back-test Prophet vs ARIMA on the last ``test_days`` observations."""
        if len(df) <= test_days + MIN_DATA_POINTS:
            raise ValueError("Not enough data to run a back-test comparison")

        train = df.iloc[:-test_days].reset_index(drop=True)
        test = df.iloc[-test_days:].reset_index(drop=True)
        actual = test["y"].tolist()

        result = {}

        try:
            p_fc = self.forecast_prophet(train, periods=test_days)
            p_pred = p_fc["yhat"].tolist()
            result["prophet"] = {
                **self._metrics(actual, p_pred),
                "predictions": [round(float(v), 2) for v in p_pred],
            }
        except Exception as exc:  # noqa: BLE001
            result["prophet"] = {"error": str(exc)}

        try:
            a_fc = self.forecast_arima(train, periods=test_days)
            a_pred = a_fc["yhat"].tolist()
            result["arima"] = {
                **self._metrics(actual, a_pred),
                "predictions": [round(float(v), 2) for v in a_pred],
            }
        except Exception as exc:  # noqa: BLE001
            result["arima"] = {"error": str(exc)}

        # Winner = lowest RMSE among models that produced a result.
        candidates = {
            name: res["rmse"]
            for name, res in result.items()
            if "rmse" in res
        }
        result["winner"] = (
            min(candidates, key=candidates.get) if candidates else None
        )
        result["test_dates"] = [d.strftime("%Y-%m-%d") for d in test["ds"]]
        result["actual"] = [round(float(v), 2) for v in actual]
        return result

    # ------------------------------------------------------------------ #
    # Public entry point used by the routes
    # ------------------------------------------------------------------ #
    def get_forecast(self, item_name=None, category=None, periods=30,
                     model="prophet", metric=None, days_back=365,
                     history=60):
        """Produce a forecast payload for the API layer.

        Returns a dict with dates/predictions/bounds plus recent history, or a
        dict containing an ``error`` key on failure.
        """
        try:
            df = self.prepare_data(
                item_name=item_name, category=category,
                days_back=days_back, metric=metric,
            )
        except ValueError as exc:
            return {"error": str(exc)}

        if df["y"].sum() == 0:
            return {"error": "All historical values are zero; cannot forecast"}

        model = (model or "prophet").lower()
        try:
            if model == "arima":
                forecast = self.forecast_arima(df, periods)
            else:
                model = "prophet"
                forecast = self.forecast_prophet(df, periods)
        except Exception as exc:  # noqa: BLE001
            return {"error": f"{model} model failed to fit: {exc}"}

        hist = df.tail(history)
        return {
            "dates": [d.strftime("%Y-%m-%d") for d in forecast["ds"]],
            "predictions": [round(float(v), 2) for v in forecast["yhat"]],
            "lower_bound": [round(float(v), 2) for v in forecast["yhat_lower"]],
            "upper_bound": [round(float(v), 2) for v in forecast["yhat_upper"]],
            "model_used": model,
            "historical_dates": [d.strftime("%Y-%m-%d") for d in hist["ds"]],
            "historical_values": [round(float(v), 2) for v in hist["y"]],
        }
