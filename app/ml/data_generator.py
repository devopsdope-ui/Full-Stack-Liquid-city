"""
Synthetic data generators for the three ML models used in Liquid City.

We do not have real historical crowd/traffic/restaurant data for the
hackathon, so we simulate it with realistic relationships (not pure noise):
future crowd depends on current crowd + net flow (entry - exit) + event
progress; future travel time depends on distance + congestion; a good
recommendation score depends on low occupancy/wait, short distance, good
offers and rating.

Every generator takes a `seed` so results are reproducible.
"""

import numpy as np
import pandas as pd


# ---------------------------------------------------------------------------
# 1. Crowd model data
# ---------------------------------------------------------------------------
def generate_crowd_data(n_samples: int = 6000, seed: int = 42) -> pd.DataFrame:
    """
    Simulate crowd scenarios: normal day, large event filling up, event
    ending / emptying, rapid surges, etc. Target is the crowd level
    `horizon_minutes` into the future.
    """
    rng = np.random.default_rng(seed)
    rows = []

    scenarios = [
        "normal_day", "large_event_filling", "event_ending_emptying",
        "rapid_surge", "steady_state", "small_event",
    ]

    for _ in range(n_samples):
        scenario = rng.choice(scenarios)

        event_attendance = int(rng.uniform(2000, 80000))
        event_progress = rng.uniform(0, 100)  # % through the event
        time_since_event_start = rng.uniform(0, 240)  # minutes
        nearby_population = rng.uniform(5000, 40000)
        nearby_traffic = rng.uniform(10, 95)

        if scenario == "normal_day":
            current_crowd = rng.uniform(10, 40)
            entry_rate = rng.uniform(0, 5)
            exit_rate = rng.uniform(0, 5)
        elif scenario == "large_event_filling":
            current_crowd = rng.uniform(40, 85)
            entry_rate = rng.uniform(5, 15)
            exit_rate = rng.uniform(0, 3)
        elif scenario == "event_ending_emptying":
            current_crowd = rng.uniform(70, 100)
            entry_rate = rng.uniform(0, 2)
            exit_rate = rng.uniform(8, 20)
        elif scenario == "rapid_surge":
            current_crowd = rng.uniform(30, 70)
            entry_rate = rng.uniform(15, 25)
            exit_rate = rng.uniform(0, 2)
        elif scenario == "small_event":
            current_crowd = rng.uniform(20, 55)
            entry_rate = rng.uniform(1, 6)
            exit_rate = rng.uniform(1, 6)
        else:  # steady_state
            current_crowd = rng.uniform(40, 90)
            entry_rate = rng.uniform(2, 6)
            exit_rate = rng.uniform(2, 6)

        for horizon_minutes in (15, 30):
            net_flow_per_min = entry_rate - exit_rate
            # net flow compounds over the horizon, with mild saturation
            # as crowd approaches 100 (harder to keep filling a full venue).
            headroom = (100 - current_crowd) / 100.0
            drift = net_flow_per_min * horizon_minutes * (0.4 + 0.6 * headroom if net_flow_per_min > 0 else 1.0)

            # ambient effect: high nearby traffic/population slightly slows entries
            ambient_drag = -0.02 * (nearby_traffic - 50) if net_flow_per_min > 0 else 0

            noise = rng.normal(0, 2.5)
            future_crowd = current_crowd + drift + ambient_drag + noise
            future_crowd = float(np.clip(future_crowd, 0, 100))

            rows.append({
                "current_crowd": current_crowd,
                "event_attendance": event_attendance,
                "entry_rate": entry_rate,
                "exit_rate": exit_rate,
                "event_progress": event_progress,
                "time_since_event_start": time_since_event_start,
                "nearby_traffic": nearby_traffic,
                "nearby_population": nearby_population,
                "horizon_minutes": horizon_minutes,
                "future_crowd": future_crowd,
            })

    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 2. Travel time model data
# ---------------------------------------------------------------------------
def generate_travel_data(n_samples: int = 6000, seed: int = 42) -> pd.DataFrame:
    """
    Simulate road/route scenarios. Longer distance normally means longer
    travel time, but heavy congestion on a short route can make it slower
    than a longer, clearer route - this is the relationship the
    recommendation logic depends on.
    """
    rng = np.random.default_rng(seed)
    rows = []

    for _ in range(n_samples):
        distance_km = rng.uniform(1, 25)
        average_speed = rng.uniform(15, 60)  # free-flow speed for this road
        normal_travel_time = (distance_km / average_speed) * 60  # minutes

        congestion = rng.uniform(0, 100)  # 0-100
        nearby_crowd = rng.uniform(0, 100)
        event_attendance = rng.uniform(0, 80000)
        road_capacity = rng.uniform(1500, 6000)

        # congestion slows the effective speed non-linearly
        slowdown_factor = 1 + (congestion / 100.0) ** 1.5 * 2.5
        # heavy nearby crowds / big events add a bit more slowdown (people crossing roads etc.)
        crowd_drag = 1 + (nearby_crowd / 100.0) * 0.3 + (event_attendance / 80000) * 0.2

        noise = rng.normal(0, 1.5)
        future_travel_time = normal_travel_time * slowdown_factor * crowd_drag + noise
        future_travel_time = float(max(1.0, future_travel_time))

        rows.append({
            "distance_km": distance_km,
            "normal_travel_time": normal_travel_time,
            "congestion": congestion,
            "nearby_crowd": nearby_crowd,
            "event_attendance": event_attendance,
            "road_capacity": road_capacity,
            "average_speed": average_speed,
            "future_travel_time": future_travel_time,
        })

    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 3. Recommendation model data
# ---------------------------------------------------------------------------
def generate_recommendation_data(n_samples: int = 6000, seed: int = 42) -> pd.DataFrame:
    """
    Simulate restaurant/parking/shuttle options with a synthetic "goodness"
    score. Low occupancy, short wait, close distance, good rating, and a
    generous offer all push the score up. Visitor preference re-weights the
    factors (e.g. someone who cares mostly about speed weighs waiting_time
    more heavily).
    """
    rng = np.random.default_rng(seed)
    rows = []

    preferences = ["balanced", "low_crowd", "fastest", "cheapest"]

    for _ in range(n_samples):
        occupancy = rng.uniform(0, 100)
        waiting_time = rng.uniform(0, 90)
        distance = rng.uniform(0.1, 10)
        rating = rng.uniform(2.5, 5.0)
        offer_discount = rng.choice([0, 0, 0, 10, 20, 50, 100, 200], p=[0.35, 0.15, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05])
        predicted_crowd = float(np.clip(occupancy + rng.normal(0, 8), 0, 100))
        price_level = rng.integers(1, 4)  # 1=cheap, 3=expensive
        visitor_preference = rng.choice(preferences)

        # base weights
        w_occ, w_wait, w_dist, w_rating, w_offer = 0.30, 0.30, 0.15, 0.15, 0.10

        if visitor_preference == "low_crowd":
            w_occ, w_wait = 0.45, 0.25
        elif visitor_preference == "fastest":
            w_wait, w_dist = 0.45, 0.25
        elif visitor_preference == "cheapest":
            w_offer = 0.30

        score = (
            w_occ * (100 - occupancy)
            + w_wait * (100 - min(waiting_time, 100))
            + w_dist * (100 - min(distance, 10) * 10)
            + w_rating * (rating / 5.0 * 100)
            + w_offer * min(offer_discount, 200) / 200 * 100
        )
        # small penalty for high price when visitor prefers cheap
        if visitor_preference == "cheapest":
            score -= price_level * 5

        noise = rng.normal(0, 4)
        recommendation_score = float(np.clip(score + noise, 0, 100))

        rows.append({
            "occupancy": occupancy,
            "waiting_time": waiting_time,
            "distance": distance,
            "rating": rating,
            "offer_discount": offer_discount,
            "predicted_crowd": predicted_crowd,
            "price_level": price_level,
            "visitor_preference": visitor_preference,
            "recommendation_score": recommendation_score,
        })

    return pd.DataFrame(rows)


PREFERENCE_ENCODING = {"balanced": 0, "low_crowd": 1, "fastest": 2, "cheapest": 3}


def encode_recommendation_features(df: pd.DataFrame) -> pd.DataFrame:
    """Encode the categorical visitor_preference column to a numeric one."""
    df = df.copy()
    df["visitor_preference_code"] = df["visitor_preference"].map(PREFERENCE_ENCODING).fillna(0)
    return df
