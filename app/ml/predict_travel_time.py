"""
Prediction interface for the travel-time model.
"""

import os
import joblib
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "travel_time_model.pkl")

_cache = None


class ModelNotTrainedError(RuntimeError):
    pass


def _load():
    global _cache
    if _cache is None:
        if not os.path.exists(MODEL_PATH):
            raise ModelNotTrainedError(
                "Travel time model not found. Train it first with:\n"
                "    python -m app.ml.train_travel_model"
            )
        _cache = joblib.load(MODEL_PATH)
    return _cache


def predict_travel_time(
    distance_km: float,
    normal_travel_time: float,
    congestion: float,
    nearby_crowd: float = 0,
    event_attendance: float = 0,
    road_capacity: float = 3000,
    average_speed: float = 30,
) -> float:
    """Returns predicted travel time in minutes."""
    bundle = _load()
    model = bundle["model"]
    features = bundle["features"]

    row = {
        "distance_km": distance_km,
        "normal_travel_time": normal_travel_time,
        "congestion": congestion,
        "nearby_crowd": nearby_crowd,
        "event_attendance": event_attendance,
        "road_capacity": road_capacity,
        "average_speed": average_speed,
    }
    df = pd.DataFrame([row])[features]
    prediction = model.predict(df)[0]
    return float(max(1.0, prediction))
