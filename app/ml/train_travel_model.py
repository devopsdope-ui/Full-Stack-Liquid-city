"""
Train the travel-time prediction model.

Run with:  python -m app.ml.train_travel_model
"""

import os
import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from app.ml.data_generator import generate_travel_data

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "travel_time_model.pkl")

FEATURES = [
    "distance_km", "normal_travel_time", "congestion", "nearby_crowd",
    "event_attendance", "road_capacity", "average_speed",
]
TARGET = "future_travel_time"


def train(seed: int = 42, n_samples: int = 6000):
    os.makedirs(MODEL_DIR, exist_ok=True)

    df = generate_travel_data(n_samples=n_samples, seed=seed)
    df = df.dropna()

    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=seed)

    model = RandomForestRegressor(n_estimators=200, max_depth=12, random_state=seed, n_jobs=-1)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
    r2 = r2_score(y_test, preds)

    print("=== Travel Time Model Evaluation ===")
    print(f"MAE:  {mae:.3f} min")
    print(f"RMSE: {rmse:.3f} min")
    print(f"R2:   {r2:.3f}")

    print("\n=== Example predictions ===")
    sample = X_test.sample(min(5, len(X_test)), random_state=seed)
    for idx in sample.index:
        actual = y_test.loc[idx]
        predicted = model.predict(X.loc[[idx]])[0]
        print(f"Distance: {X.loc[idx, 'distance_km']:.1f} km "
              f"| Congestion: {X.loc[idx, 'congestion']:.0f}% "
              f"| Actual: {actual:.1f} min | Predicted: {predicted:.1f} min")

    joblib.dump({"model": model, "features": FEATURES}, MODEL_PATH)
    print(f"\nSaved model to {MODEL_PATH}")


if __name__ == "__main__":
    train()
