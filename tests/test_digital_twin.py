"""
Unit and integration tests for Weather, Social Signals, and Digital Twin.
Tests:
- Weather parsing & fallback
- Weather impact calculation & cascade propagation
- What-If counterfactual simulation does NOT mutate baseline state
- Digital twin state generation & risk alerts
- Replanning endpoint returns valid structured plan
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services import weather_service, digital_twin_service, social_signal_service
from app.schemas.weather import WeatherCurrent
from app.schemas.digital_twin import WhatIfScenarioRequest, ReplanRequest
from app.services.weather_impact_service import compute_weather_cascade

client = TestClient(app)


def test_weather_current_endpoint():
    response = client.get("/weather/current")
    assert response.status_code == 200
    data = response.json()
    assert "temperature_c" in data
    assert "rainfall_mm_per_hour" in data
    assert "condition" in data
    assert "is_live" in data


def test_weather_forecast_endpoint():
    response = client.get("/weather/forecast")
    assert response.status_code == 200
    data = response.json()
    assert "hourly" in data
    assert len(data["hourly"]) > 0


def test_social_signals_endpoint():
    response = client.get("/social-signals")
    assert response.status_code == 200
    signals = response.json()
    assert isinstance(signals, list)
    assert len(signals) > 0
    assert "severity" in signals[0]


def test_weather_cascade_multipliers():
    # Test heavy rain scenario
    rain_weather = WeatherCurrent(
        temperature_c=25.0,
        humidity=90.0,
        rainfall_mm_per_hour=35.0,
        wind_speed_kmh=20.0,
        condition="heavy_rain",
        source="test",
        is_live=False,
        timestamp="2026-09-27T00:00:00Z",
    )
    multipliers, impacts, steps = compute_weather_cascade(rain_weather, duration_minutes=60)
    assert multipliers["outdoor_movement_factor"] < 1.0
    assert multipliers["indoor_crowd_factor"] > 1.0
    assert multipliers["cafeteria_demand_factor"] > 1.0
    assert multipliers["road_congestion_factor"] > 1.0
    assert len(impacts) > 0
    assert len(steps) >= 5


def test_digital_twin_live_state():
    response = client.get("/digital-twin/events/techhack-2026/state")
    assert response.status_code == 200
    state = response.json()
    assert state["event"]["id"] == "techhack-2026"
    assert "zones" in state
    assert "cafeteria" in state["zones"]
    assert "transport" in state
    assert "road_01" in state["transport"]
    assert "weather" in state
    assert "confidence" in state


def test_what_if_does_not_mutate_live_state():
    """
    CRITICAL ACCEPTANCE CRITERIA:
    Base live state must remain unaltered when counterfactual simulation runs.
    """
    # 1. Fetch initial live state
    res_before = client.get("/digital-twin/events/techhack-2026/state")
    before_state = res_before.json()
    initial_cafeteria = before_state["zones"]["cafeteria"]["occupancy"]
    initial_road_cong = before_state["transport"]["road_01"]["congestion_percent"]

    # 2. Run counterfactual What-If simulation with extreme rain (35 mm/h)
    scenario_payload = {
        "rainfall_mm_per_hour": 35.0,
        "temperature_c": 27.0,
        "wind_speed_kmh": 25.0,
        "storm_duration_minutes": 60,
    }
    sim_res = client.post("/digital-twin/events/techhack-2026/what-if", json=scenario_payload)
    assert sim_res.status_code == 200
    sim_data = sim_res.json()

    # The simulated state must reflect increased load
    sim_cafeteria = sim_data["simulated"]["zones"]["cafeteria"]["occupancy"]
    sim_road_cong = sim_data["simulated"]["transport"]["road_01"]["congestion_percent"]
    assert sim_cafeteria > initial_cafeteria
    assert sim_road_cong > initial_road_cong

    # 3. Check live state again: MUST BE COMPLETELY UNCHANGED
    res_after = client.get("/digital-twin/events/techhack-2026/state")
    after_state = res_after.json()
    after_cafeteria = after_state["zones"]["cafeteria"]["occupancy"]
    after_road_cong = after_state["transport"]["road_01"]["congestion_percent"]

    assert after_cafeteria == initial_cafeteria
    assert after_road_cong == initial_road_cong


def test_digital_twin_replan():
    replan_payload = {"trigger": "weather_cafeteria_bottleneck"}
    res = client.post("/digital-twin/events/techhack-2026/replan", json=replan_payload)
    assert res.status_code == 200
    plan = res.json()
    assert plan["plan_version"] >= 2
    assert len(plan["changes"]) > 0
    assert len(plan["gate_allocation"]) > 0
    assert len(plan["zone_congestion"]) > 0
