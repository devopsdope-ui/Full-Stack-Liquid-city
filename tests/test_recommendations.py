from fastapi.testclient import TestClient

from app.main import app
from app.services import simulation_service

client = TestClient(app)


def setup_function():
    simulation_service.reset()


def test_recommendation_ranking_prefers_low_crowd():
    response = client.get("/recommendations/restaurants")
    assert response.status_code == 200
    options = response.json()
    assert len(options) >= 3

    # restaurant_c is configured as low-occupancy/low-wait/good-offer in
    # constants.py - it should rank at or very near the top by default.
    top_ids = [o["id"] for o in options[:2]]
    assert "restaurant_c" in top_ids


def test_recommendation_choice_accept_crowded_option_allowed():
    response = client.post("/recommendations/restaurants/choice", json={"chosen_id": "restaurant_a"})
    assert response.status_code == 200
    body = response.json()
    assert body["decision"] == "accepted"
    assert body["choice"]["id"] == "restaurant_a"


def test_recommendation_choice_reject_returns_next_option():
    response = client.post("/recommendations/restaurants/choice", json={"rejected_id": "restaurant_a"})
    assert response.status_code == 200
    body = response.json()
    assert body["decision"] == "rejected"
    assert body["next_option"] is not None
    assert body["next_option"]["id"] != "restaurant_a"


def test_recommendation_choice_requires_input():
    response = client.post("/recommendations/restaurants/choice", json={})
    assert response.status_code == 400
