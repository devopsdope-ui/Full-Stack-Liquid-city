#!/bin/sh
set -e

# Train any missing models so a fresh `docker compose up --build` works
# out of the box, without requiring a manual training step first.
python -c "
import os
if not os.path.exists('app/ml/models/crowd_model.pkl'):
    import app.ml.train_crowd_model as m; m.train()
if not os.path.exists('app/ml/models/travel_time_model.pkl'):
    import app.ml.train_travel_model as m; m.train()
if not os.path.exists('app/ml/models/recommendation_model.pkl'):
    import app.ml.train_recommendation_model as m; m.train()
"

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
