"""
Train the crowd-level prediction model.

Run with:  python -m app.ml.train_crowd_model
"""

import os
import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from app.ml.data_generator import generate_crowd_data

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "crowd_model.pkl")

FEATURES = [
    "current_crowd", "event_attendance", "entry_rate", "exit_rate",
    "event_progress", "time_since_event_start", "nearby_traffic",
    "nearby_population", "horizon_minutes",
]
TARGET = "future_crowd"


def train(seed: int = 42, n_samples: int = 6000):
    os.makedirs(MODEL_DIR, exist_ok=True)

    df = generate_crowd_data(n_samples=n_samples, seed=seed)
    df = df.dropna()  # basic cleaning

    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=seed)

    model = RandomForestRegressor(n_estimators=200, max_depth=12, random_state=seed, n_jobs=-1)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
    r2 = r2_score(y_test, preds)

    print("=== Crowd Model Evaluation ===")
    print(f"MAE:  {mae:.3f}")
    print(f"RMSE: {rmse:.3f}")
    print(f"R2:   {r2:.3f}")

    print("\n=== Example predictions ===")
    sample = X_test.sample(min(5, len(X_test)), random_state=seed)
    for idx in sample.index:
        actual = y_test.loc[idx]
        predicted = model.predict(X.loc[[idx]])[0]
        print(f"Current occupancy: {X.loc[idx, 'current_crowd']:.1f}%  "
              f"| Horizon: {int(X.loc[idx, 'horizon_minutes'])} min "
              f"| Actual: {actual:.1f}%  | Predicted: {predicted:.1f}%")

    joblib.dump({"model": model, "features": FEATURES}, MODEL_PATH)
    print(f"\nSaved model to {MODEL_PATH}")


if __name__ == "__main__":
    train()
