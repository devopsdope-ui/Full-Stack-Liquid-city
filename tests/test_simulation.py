from fastapi.testclient import TestClient

from app.main import app
from app.services import simulation_service

client = TestClient(app)


def setup_function():
    simulation_service.reset()


def test_simulation_start_and_status():
    response = client.post("/simulation/start")
    assert response.status_code == 200
    assert response.json()["simulation_running"] is True

    status = client.get("/simulation/status").json()
    assert status["simulation_running"] is True


def test_simulation_reset_restores_defaults():
    client.post("/simulation/crowd-surge", json={"location_id": "stadium_crowd", "amount": 5})
    reset_state = client.post("/simulation/reset").json()
    assert reset_state["stadium_crowd"] == 94  # DEFAULT_STADIUM_CROWD


def test_crowd_surge_increases_stadium_crowd():
    before = client.get("/simulation/status").json()["stadium_crowd"]
    after = client.post("/simulation/crowd-surge", json={"location_id": "stadium_crowd", "amount": 5}).json()
    assert after["stadium_crowd"] >= before


def test_event_end_reduces_stadium_crowd_and_raises_road_congestion():
    before = client.get("/simulation/status").json()
    after = client.post("/simulation/event-end").json()

    assert after["stadium_crowd"] < before["stadium_crowd"]
    assert after["road_congestion"]["central_road"] > before["road_congestion"]["central_road"]


def test_traffic_jam_increases_congestion():
    before = client.get("/simulation/status").json()["road_congestion"]["central_road"]
    after = client.post("/simulation/traffic-jam", json={"road_id": "central_road", "amount": 15}).json()
    assert after["road_congestion"]["central_road"] > before


def test_admin_endpoints_mirror_simulation_endpoints():
    response = client.post("/admin/simulation/event-end")
    assert response.status_code == 200
    assert "stadium_crowd" in response.json()


def test_invalid_road_id_returns_400():
    response = client.post("/simulation/traffic-jam", json={"road_id": "does_not_exist", "amount": 10})
    assert response.status_code == 400
