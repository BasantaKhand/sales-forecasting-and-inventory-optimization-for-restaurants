"""Forecasting service (ARIMA + Prophet).

The full ML implementation lands in Prompt 4. For now this is a stub so the
package imports cleanly without pulling heavy ML dependencies at app start.
"""


class ForecastService:
    """Trains ARIMA/Prophet models and produces demand/revenue forecasts.

    Implemented in Prompt 4.
    """

    def __init__(self, db):
        self.db = db

    # TODO(Prompt 4): prepare_data, forecast_prophet, forecast_arima,
    #                 compare_models, get_forecast
