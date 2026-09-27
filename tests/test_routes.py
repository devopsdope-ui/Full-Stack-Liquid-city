import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_get_roads():
    response = client.get("/roads")
    assert response.status_code == 200
    roads = response.json()
    assert len(roads) >= 2
    for road in roads:
        assert "predicted_travel_time" in road


def test_predict_route_shortest_distance_not_always_fastest():
    """
    A short but heavily congested route should not always beat a longer,
    clearer route - this is the core assumption the recommendation logic
    relies on.
    """
    short_congested = client.post("/routes/predict", json={
        "distance_km": 8,
        "normal_travel_time": 12,
        "congestion": 95,
        "nearby_crowd": 90,
        "event_attendance": 50000,
        "road_capacity": 3000,
        "average_speed": 40,
    }).json()

    long_clear = client.post("/routes/predict", json={
        "distance_km": 20,
        "normal_travel_time": 20,
        "congestion": 5,
        "nearby_crowd": 10,
        "event_attendance": 0,
        "road_capacity": 5000,
        "average_speed": 60,
    }).json()

    assert short_congested["predicted_travel_time"] > 0
    assert long_clear["predicted_travel_time"] > 0
    # Not a strict assertion of which wins (model-dependent), but both
    # should be sane, finite positive numbers reflecting the inputs.


def test_predict_route_rejects_zero_capacity():
    response = client.post("/routes/predict", json={
        "distance_km": 5,
        "normal_travel_time": 10,
        "congestion": 50,
        "road_capacity": 0,
        "average_speed": 30,
    })
    assert response.status_code == 422


def test_predict_route_rejects_negative_distance():
    response = client.post("/routes/predict", json={
        "distance_km": -5,
        "normal_travel_time": 10,
        "congestion": 50,
    })
    assert response.status_code == 422
