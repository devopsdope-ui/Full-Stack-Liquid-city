from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

SAMPLE_SUBMISSION = {
    "event_type": "hackathon",
    "expected_attendance": 500,
    "expected_peak_attendance": None,
    "venue_name": "ABC Convention Center",
    "venue_city": "Mumbai",
    "venue_type": "indoor",
    "venue_description": "Large main hall with two workshop rooms",
    "zones": [
        {"name": "Main Hall", "capacity": 500, "capacity_type": "known"},
        {"name": "Workshop A", "capacity": 100, "capacity_type": "known"},
        {"name": "Cafeteria", "capacity": 150, "capacity_type": "estimated"},
        {"name": "Registration", "capacity": None, "capacity_type": "unknown"},
    ],
    "entrances": [
        {"name": "Gate A", "capacity": 300, "location": "Near metro station"},
        {"name": "Gate B", "capacity": 300, "location": "Main road"},
        {"name": "Gate C", "capacity": None, "location": "Staff/VIP entrance"},
    ],
    "normal_exits": [{"name": "Exit 1"}, {"name": "Exit 2"}],
    "emergency_exits": [{"name": "EM1"}, {"name": "EM2"}, {"name": "EM3"}],
    "activities": [
        {"name": "Registration", "start": "08:00", "end": "09:00", "expected_attendance": 500, "zone": "Registration"},
        {"name": "Opening Ceremony", "start": "09:00", "end": "10:00", "expected_attendance": 500, "zone": "Main Hall"},
        {"name": "Workshop", "start": "16:00", "end": "17:30", "expected_attendance": 200, "zone": "Workshop A"},
        {"name": "Lunch", "start": "13:00", "end": "14:00", "expected_attendance": 500, "zone": "Cafeteria"},
    ],
    "movement_notes": "After the opening ceremony, participants move from the main hall to the workshop rooms.",
    "groups": {"enabled": True, "count": 50, "average_size": 5, "keep_together": "yes"},
    "resources": {
        "food": {"selected": True, "detail": "150 people at once"},
        "parking": {"selected": True, "detail": None},
        "registration": {"selected": True, "detail": "3 counters"},
        "medical": {"selected": False},
    },
    "priorities": ["avoid_overcrowding", "reduce_entry_queues", "manage_food_crowds"],
    "special_instructions": "VIPs should use Gate A. The cafeteria can only serve 100 people at once.",
}


def test_submit_questionnaire_returns_structured_model():
    response = client.post("/questionnaire/submit", json=SAMPLE_SUBMISSION)
    assert response.status_code == 200
    body = response.json()

    assert "id" in body
    structured = body["structured_model"]
    assert structured["event"]["type"] == "hackathon"
    assert structured["event"]["expected_attendance"] == 500
    assert len(structured["zones"]) == 4
    assert len(structured["entrances"]) == 3


def test_unknown_zone_capacity_is_never_invented():
    response = client.post("/questionnaire/submit", json=SAMPLE_SUBMISSION)
    structured = response.json()["structured_model"]
    registration_zone = next(z for z in structured["zones"] if z["name"] == "Registration")
    assert registration_zone["capacity"] is None
    assert registration_zone["capacity_confidence"] == "unknown"


def test_known_vs_estimated_capacity_confidence_preserved():
    response = client.post("/questionnaire/submit", json=SAMPLE_SUBMISSION)
    structured = response.json()["structured_model"]
    main_hall = next(z for z in structured["zones"] if z["name"] == "Main Hall")
    cafeteria = next(z for z in structured["zones"] if z["name"] == "Cafeteria")
    assert main_hall["capacity_confidence"] == "known"
    assert cafeteria["capacity_confidence"] == "estimated"


def test_special_instructions_stored_even_without_gemini_configured():
    """
    With no GEMINI_API_KEY set in this test environment, the constraint
    extraction must fall back to storing the raw text rather than crashing
    or silently dropping it.
    """
    response = client.post("/questionnaire/submit", json=SAMPLE_SUBMISSION)
    structured = response.json()["structured_model"]
    assert len(structured["constraints"]) >= 1
    combined_text = " ".join(c["description"] for c in structured["constraints"])
    assert "Gate A" in combined_text or "VIP" in combined_text


def test_get_event_model_roundtrip():
    submit_response = client.post("/questionnaire/submit", json=SAMPLE_SUBMISSION)
    event_model_id = submit_response.json()["id"]

    get_response = client.get(f"/questionnaire/{event_model_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == event_model_id


def test_get_unknown_event_model_returns_404():
    response = client.get("/questionnaire/does-not-exist")
    assert response.status_code == 404
