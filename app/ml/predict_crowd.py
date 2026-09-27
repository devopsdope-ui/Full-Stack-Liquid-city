"""
Prediction interface for the crowd model.

If the .pkl file has not been trained yet, this module raises a clear,
actionable error instead of crashing with a confusing stack trace, and
tells the caller exactly what command to run.
"""

import os
import joblib
import pandas as pd

from app.utils.constants import PREDICTION_HORIZON_SHORT, PREDICTION_HORIZON_LONG

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "crowd_model.pkl")

_cache = None


class ModelNotTrainedError(RuntimeError):
    pass


def _load():
    global _cache
    if _cache is None:
        if not os.path.exists(MODEL_PATH):
            raise ModelNotTrainedError(
                "Crowd model not found. Train it first with:\n"
                "    python -m app.ml.train_crowd_model"
            )
        _cache = joblib.load(MODEL_PATH)
    return _cache


def predict_future_crowd(
    current_crowd: float,
    event_attendance: float,
    entry_rate: float,
    exit_rate: float,
    event_progress: float,
    time_since_event_start: float,
    nearby_traffic: float,
    nearby_population: float,
) -> dict:
    """
    Returns {"predicted_15_min": float, "predicted_30_min": float}
    """
    bundle = _load()
    model = bundle["model"]
    features = bundle["features"]

    base_row = {
        "current_crowd": current_crowd,
        "event_attendance": event_attendance,
        "entry_rate": entry_rate,
        "exit_rate": exit_rate,
        "event_progress": event_progress,
        "time_since_event_start": time_since_event_start,
        "nearby_traffic": nearby_traffic,
        "nearby_population": nearby_population,
    }

    rows = []
    for horizon in (PREDICTION_HORIZON_SHORT, PREDICTION_HORIZON_LONG):
        row = dict(base_row)
        row["horizon_minutes"] = horizon
        rows.append(row)

    df = pd.DataFrame(rows)[features]
    preds = model.predict(df)

    return {
        "predicted_15_min": float(max(0, min(100, preds[0]))),
        "predicted_30_min": float(max(0, min(100, preds[1]))),
    }
