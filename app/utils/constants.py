"""
Central place for constants and tunable thresholds.

Keeping these in one file means the demo can be tuned (e.g. for a live
hackathon presentation) without hunting through business logic.
"""

# ---------------------------------------------------------------------------
# Crowd status thresholds (percentage occupancy 0-100)
# ---------------------------------------------------------------------------
CROWD_NORMAL_MAX = 60
CROWD_MODERATE_MAX = 80
CROWD_HIGH_MAX = 90
# anything >= CROWD_HIGH_MAX is CRITICAL

CROWD_STATUS_NORMAL = "NORMAL"
CROWD_STATUS_MODERATE = "MODERATE"
CROWD_STATUS_HIGH = "HIGH"
CROWD_STATUS_CRITICAL = "CRITICAL"

# ---------------------------------------------------------------------------
# Congestion risk thresholds, reused by the recommendation + route logic.
# These are intentionally separate from CROWD_STATUS_* so the risk layer can
# be tuned independently of raw occupancy buckets.
# ---------------------------------------------------------------------------
RISK_LOW_MAX = 60
RISK_MODERATE_MAX = 75
RISK_HIGH_MAX = 90
# anything >= RISK_HIGH_MAX is CRITICAL

RISK_LOW = "LOW"
RISK_MODERATE = "MODERATE"
RISK_HIGH = "HIGH"
RISK_CRITICAL = "CRITICAL"

# How much a rapidly rising trend bumps the risk level (see calculations.py).
TREND_RISK_BUMP_THRESHOLD = 15  # percentage points increase over the horizon

# ---------------------------------------------------------------------------
# ML prediction horizons (minutes)
# ---------------------------------------------------------------------------
PREDICTION_HORIZON_SHORT = 15
PREDICTION_HORIZON_LONG = 30

# ---------------------------------------------------------------------------
# Simulation defaults - the initial state used on server start / reset.
# Feel free to add more locations/partners here.
# ---------------------------------------------------------------------------
DEFAULT_EVENT_ATTENDANCE = 50000
DEFAULT_EVENT_PROGRESS = 60  # percent through the event

DEFAULT_STADIUM_CROWD = 94
DEFAULT_CENTRAL_ROAD_CONGESTION = 80
DEFAULT_NORTH_ROAD_CONGESTION = 30

# Partner defaults: (occupancy, waiting_time_min, distance_km, rating, offer_discount_inr, price_level)
DEFAULT_PARTNERS = {
    "restaurant_a": {
        "name": "Restaurant A (near stadium)",
        "type": "restaurant",
        "occupancy": 98,
        "waiting_time": 60,
        "distance": 0.5,
        "rating": 4.2,
        "offer_discount": 0,
        "price_level": 3,
    },
    "restaurant_b": {
        "name": "Restaurant B (near stadium)",
        "type": "restaurant",
        "occupancy": 95,
        "waiting_time": 45,
        "distance": 0.8,
        "rating": 4.0,
        "offer_discount": 10,
        "price_level": 2,
    },
    "restaurant_c": {
        "name": "Restaurant C (north side)",
        "type": "restaurant",
        "occupancy": 35,
        "waiting_time": 5,
        "distance": 2.5,
        "rating": 4.3,
        "offer_discount": 200,
        "price_level": 2,
    },
    "parking_north": {
        "name": "North Parking",
        "type": "parking",
        "occupancy": 35,
        "waiting_time": 2,
        "distance": 2.2,
        "rating": 4.0,
        "offer_discount": 0,
        "price_level": 1,
    },
    "shuttle_north": {
        "name": "North Shuttle",
        "type": "shuttle",
        "occupancy": 20,
        "waiting_time": 3,
        "distance": 2.0,
        "rating": 4.1,
        "offer_discount": 0,
        "price_level": 1,
    },
}

# Roads: (congestion, distance_km, road_capacity, average_speed_kmph)
DEFAULT_ROADS = {
    "central_road": {
        "name": "Central Road (stadium exit)",
        "congestion": DEFAULT_CENTRAL_ROAD_CONGESTION,
        "distance_km": 8,
        "road_capacity": 4000,
        "average_speed": 20,
    },
    "north_road": {
        "name": "North Road (bypass)",
        "congestion": DEFAULT_NORTH_ROAD_CONGESTION,
        "distance_km": 10,
        "road_capacity": 3000,
        "average_speed": 45,
    },
}

# Nearby ambient population/traffic used as ML context features.
DEFAULT_NEARBY_POPULATION = 20000
DEFAULT_NEARBY_TRAFFIC = 40
