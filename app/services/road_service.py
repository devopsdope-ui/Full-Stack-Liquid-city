"""
Road service: exposes current road readings and ML-backed travel time
predictions.
"""

from typing import Optional

from app.simulation.simulation_engine import simulation_engine
from app.ml.predict_travel_time import predict_travel_time


def list_roads() -> list:
    status = simulation_engine.status()
    roads = []
    for road_id, congestion in status["road_congestion"].items():
        meta = status["roads_meta"][road_id]
        predicted = predict_travel_time(
            distance_km=meta["distance_km"],
            normal_travel_time=(meta["distance_km"] / meta["average_speed"]) * 60,
            congestion=congestion,
            nearby_crowd=status["stadium_crowd"],
            event_attendance=status["event_attendance"],
            road_capacity=meta["road_capacity"],
            average_speed=meta["average_speed"],
        )
        roads.append({
            "road_id": road_id,
            "name": meta["name"],
            "congestion": round(congestion, 1),
            "average_speed": meta["average_speed"],
            "predicted_travel_time": round(predicted, 1),
        })
    return roads


def get_road(road_id: str) -> Optional[dict]:
    for road in list_roads():
        if road["road_id"] == road_id:
            return road
    return None


def predict_route(distance_km: float, normal_travel_time: float, congestion: float,
                   nearby_crowd: float = 0, event_attendance: float = 0,
                   road_capacity: float = 3000, average_speed: float = 30) -> dict:
    predicted = predict_travel_time(
        distance_km=distance_km,
        normal_travel_time=normal_travel_time,
        congestion=congestion,
        nearby_crowd=nearby_crowd,
        event_attendance=event_attendance,
        road_capacity=road_capacity,
        average_speed=average_speed,
    )
    return {
        "distance_km": distance_km,
        "predicted_travel_time": round(predicted, 1),
        "congestion": congestion,
    }
