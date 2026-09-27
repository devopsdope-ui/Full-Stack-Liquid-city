from fastapi.testclient import TestClient

from app.main import app
from tests.test_questionnaire import SAMPLE_SUBMISSION

client = TestClient(app)


def _submit_and_plan():
    submit_response = client.post("/questionnaire/submit", json=SAMPLE_SUBMISSION)
    event_model_id = submit_response.json()["id"]
    plan_response = client.post(f"/planning/{event_model_id}/generate")
    return event_model_id, plan_response


def test_generate_plan_returns_gate_allocation_weighted_by_capacity():
    _, response = _submit_and_plan()
    assert response.status_code == 200
    plan = response.json()

    gates = {g["name"]: g for g in plan["gate_allocation"]}
    assert "Gate A" in gates and "Gate B" in gates and "Gate C" in gates
    # Gate A and B have equal known capacity -> equal share of the known pool
    assert abs(gates["Gate A"]["share_percentage"] - gates["Gate B"]["share_percentage"]) < 0.5
    # Gate C (unknown capacity) still gets a non-zero reserved share
    assert gates["Gate C"]["share_percentage"] > 0
    # Shares should sum to ~100%
    total_share = sum(g["share_percentage"] for g in plan["gate_allocation"])
    assert 99 <= total_share <= 101


def test_generate_plan_zone_congestion_uses_known_capacity():
    _, response = _submit_and_plan()
    plan = response.json()
    main_hall_estimate = next(z for z in plan["zone_congestion"] if z["zone"] == "Main Hall")
    assert main_hall_estimate["projected_occupancy_percentage"] == 100.0
    assert main_hall_estimate["status"] == "CRITICAL"


def test_generate_plan_flags_unknown_capacity_zone_without_guessing():
    _, response = _submit_and_plan()
    plan = response.json()
    registration_estimate = next(z for z in plan["zone_congestion"] if z["zone"] == "Registration")
    assert registration_estimate["projected_occupancy_percentage"] is None
    assert registration_estimate["status"] == "UNKNOWN_CAPACITY"


def test_generate_plan_reports_true_overcapacity_without_clamping():
    """
    500 lunch attendees against a 150-capacity cafeteria is 333% over
    capacity - that must be visible as >100%, not silently clamped to
    100%, which would hide how severe the bottleneck really is.
    """
    _, response = _submit_and_plan()
    plan = response.json()
    cafeteria_estimate = next(z for z in plan["zone_congestion"] if z["zone"] == "Cafeteria")
    assert cafeteria_estimate["projected_occupancy_percentage"] > 100
    assert cafeteria_estimate["status"] == "CRITICAL"


def test_generate_plan_detects_bottleneck_for_full_main_hall():
    _, response = _submit_and_plan()
    plan = response.json()
    bottleneck_zones = [b["zone_or_gate"] for b in plan["bottlenecks"]]
    assert "Main Hall" in bottleneck_zones


def test_generate_plan_includes_group_handling_note():
    _, response = _submit_and_plan()
    plan = response.json()
    assert plan["group_handling_note"] is not None
    assert "Keep-together" in plan["group_handling_note"] or "keep" in plan["group_handling_note"].lower()


def test_generate_plan_warns_about_unknown_capacity_zone():
    _, response = _submit_and_plan()
    plan = response.json()
    assert any("Registration" in w for w in plan["warnings"])


def test_get_latest_plan_for_event():
    event_model_id, generate_response = _submit_and_plan()
    assert generate_response.status_code == 200

    get_response = client.get(f"/planning/{event_model_id}")
    assert get_response.status_code == 200


def test_generate_plan_for_unknown_event_model_returns_404():
    response = client.post("/planning/does-not-exist/generate")
    assert response.status_code == 404
