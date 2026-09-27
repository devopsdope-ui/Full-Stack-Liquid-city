"""
Crowd service: exposes current crowd readings and ML-backed predictions.
Combines simulation state + ML prediction + rule-based risk (Rule 4: ML
predicts, business logic decides what it means).
"""

from datetime import datetime, timezone
from typing import Optional

from app.simulation.simulation_engine import simulation_engine
from app.ml.predict_crowd import predict_future_crowd, ModelNotTrainedError
from app.utils.calculations import calculate_crowd_status, calculate_risk, risk_reasons
from app.utils.constants import DEFAULT_STADIUM_CROWD


def _capacity_for(location_id: str) -> int:
    # Hackathon simplification: stadium capacity mirrors current event_attendance
    # target; partners use a fixed nominal capacity of 100 (occupancy already %).
    if location_id == "stadium_crowd":
        status = simulation_engine.status()
        return max(status["event_attendance"], 1)
    return 100


def list_crowd_locations() -> list:
    status = simulation_engine.status()
    now = datetime.now(timezone.utc).isoformat()

    locations = [{
        "location_id": "stadium_crowd",
        "name": "Stadium",
        "occupancy": status["stadium_crowd"],
        "capacity": status["event_attendance"],
        "status": calculate_crowd_status(status["stadium_crowd"]),
        "timestamp": now,
    }]

    for pid, p in status["partners"].items():
        locations.append({
            "location_id": pid,
            "name": p["name"],
            "occupancy": p["occupancy"],
            "capacity": 100,
            "status": calculate_crowd_status(p["occupancy"]),
            "timestamp": now,
        })

    return locations


def get_crowd_location(location_id: str) -> Optional[dict]:
    for loc in list_crowd_locations():
        if loc["location_id"] == location_id:
            return loc
    return None


def predict_crowd_for_location(location_id: str) -> Optional[dict]:
    """Run the ML crowd model for a given location using current sim state."""
    status = simulation_engine.status()

    if location_id == "stadium_crowd":
        current_crowd = status["stadium_crowd"]
        entry_rate = status["entry_rate"]
        exit_rate = status["exit_rate"]
    elif location_id in status["partners"]:
        current_crowd = status["partners"][location_id]["occupancy"]
        # partners don't track explicit flow rates; approximate from occupancy trend is out
        # of scope for the demo, so use gentle defaults.
        entry_rate = 1.0
        exit_rate = 1.0
    else:
        return None

    try:
        prediction = predict_future_crowd(
            current_crowd=current_crowd,
            event_attendance=status["event_attendance"],
            entry_rate=entry_rate,
            exit_rate=exit_rate,
            event_progress=status["event_progress"],
            time_since_event_start=60,
            nearby_traffic=status["nearby_traffic"],
            nearby_population=status["nearby_population"],
        )
    except ModelNotTrainedError as exc:
        raise

    risk = calculate_risk(current_crowd, prediction["predicted_30_min"])
    reasons = risk_reasons(current_crowd, prediction["predicted_30_min"], risk, entry_rate, exit_rate)

    return {
        "location_id": location_id,
        "current_percentage": round(current_crowd, 1),
        "predicted_15_min": round(prediction["predicted_15_min"], 1),
        "predicted_30_min": round(prediction["predicted_30_min"], 1),
        "risk": risk,
        "reasons": reasons,
    }
