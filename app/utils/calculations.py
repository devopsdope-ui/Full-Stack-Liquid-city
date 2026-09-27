"""
Reusable calculation helpers.

These are pure functions on purpose - no DB calls, no ML, no simulation
state - so they are trivial to unit test and safe to call from anywhere
(services, ML explainability layer, tests).
"""

from app.utils import constants as c


def clamp(value: float, low: float = 0, high: float = 100) -> float:
    """Keep a percentage-like value inside [low, high]."""
    return max(low, min(high, value))


def calculate_occupancy(current: float, capacity: float) -> float:
    """
    Turn a raw (current, capacity) pair into a 0-100 occupancy percentage.

    Raises ValueError on nonsensical input instead of silently returning
    garbage - callers (API layer) should catch this and return HTTP 400.
    """
    if capacity <= 0:
        raise ValueError("capacity must be greater than 0")
    if current < 0:
        raise ValueError("current occupancy cannot be negative")
    if current > capacity:
        raise ValueError("current occupancy cannot exceed capacity")
    return clamp((current / capacity) * 100)


def calculate_crowd_status(occupancy_percentage: float) -> str:
    """Map a 0-100 occupancy percentage to a NORMAL/MODERATE/HIGH/CRITICAL bucket."""
    if occupancy_percentage < 0 or occupancy_percentage > 100:
        raise ValueError("occupancy_percentage must be between 0 and 100")

    if occupancy_percentage < c.CROWD_NORMAL_MAX:
        return c.CROWD_STATUS_NORMAL
    if occupancy_percentage < c.CROWD_MODERATE_MAX:
        return c.CROWD_STATUS_MODERATE
    if occupancy_percentage < c.CROWD_HIGH_MAX:
        return c.CROWD_STATUS_HIGH
    return c.CROWD_STATUS_CRITICAL


def calculate_congestion(vehicle_count: float, road_capacity: float) -> float:
    """Simple congestion percentage for a road segment."""
    if road_capacity <= 0:
        raise ValueError("road_capacity must be greater than 0")
    if vehicle_count < 0:
        raise ValueError("vehicle_count cannot be negative")
    return clamp((vehicle_count / road_capacity) * 100)


def calculate_risk(current_percentage: float, predicted_percentage: float) -> str:
    """
    Rule-based congestion risk layer.

    IMPORTANT: this is intentionally separate from the ML model. The model
    only predicts a future occupancy number; deciding what that number
    *means* for the business (risk level) is plain, explainable rules.

    The risk considers both the predicted absolute level AND the trend
    (how fast occupancy is rising). Two locations sitting at the same
    predicted 88% do not carry the same risk if one got there by rising
    fast and the other is stable/falling - see the "stadium at 100% but
    emptying" edge case discussed in the project README.
    """
    for value, label in ((current_percentage, "current_percentage"), (predicted_percentage, "predicted_percentage")):
        if value < 0 or value > 100:
            raise ValueError(f"{label} must be between 0 and 100")

    if predicted_percentage < c.RISK_LOW_MAX:
        base_risk = c.RISK_LOW
    elif predicted_percentage < c.RISK_MODERATE_MAX:
        base_risk = c.RISK_MODERATE
    elif predicted_percentage < c.RISK_HIGH_MAX:
        base_risk = c.RISK_HIGH
    else:
        base_risk = c.RISK_CRITICAL

    trend = predicted_percentage - current_percentage

    # A location that is FALLING should never be bumped up in risk, even if
    # the absolute number is still high (e.g. stadium at 100% but emptying).
    if trend <= 0:
        return base_risk

    # Rapidly rising trend bumps risk up one notch (capped at CRITICAL).
    if trend >= c.TREND_RISK_BUMP_THRESHOLD:
        order = [c.RISK_LOW, c.RISK_MODERATE, c.RISK_HIGH, c.RISK_CRITICAL]
        idx = min(order.index(base_risk) + 1, len(order) - 1)
        return order[idx]

    return base_risk


def risk_reasons(current_percentage: float, predicted_percentage: float, risk: str,
                  entry_rate: float = None, exit_rate: float = None) -> list:
    """
    Build a short list of human-readable, rule-based reasons for a risk
    level. This is explicitly NOT a causal explanation of the Random
    Forest's internals - it is a separate, transparent rules layer that
    happens to look at similar inputs. Keep this distinction in any UI
    copy ("Model prediction" vs "Rule-based explanation").
    """
    reasons = [f"Occupancy currently {current_percentage:.0f}%"]

    if entry_rate is not None and exit_rate is not None:
        if entry_rate > exit_rate:
            reasons.append("Arrival rate exceeds departure rate")
        elif exit_rate > entry_rate:
            reasons.append("Departure rate exceeds arrival rate")

    trend = predicted_percentage - current_percentage
    if trend >= c.TREND_RISK_BUMP_THRESHOLD:
        reasons.append("Occupancy increasing rapidly")
    elif trend <= -c.TREND_RISK_BUMP_THRESHOLD:
        reasons.append("Occupancy decreasing rapidly")

    if predicted_percentage >= c.RISK_HIGH_MAX:
        reasons.append(f"Predicted occupancy reaches {predicted_percentage:.0f}% within the forecast window")

    reasons.append(f"Resulting risk level: {risk}")
    return reasons


def estimate_waiting_time(occupancy_percentage: float, base_wait: float = 5.0, max_wait: float = 90.0) -> float:
    """
    Rough waiting-time estimate purely from occupancy, used as a fallback
    when a partner has no explicit waiting_time configured. Grows
    non-linearly as occupancy approaches 100%.
    """
    occupancy_percentage = clamp(occupancy_percentage)
    fraction = occupancy_percentage / 100.0
    return round(base_wait + (max_wait - base_wait) * (fraction ** 2), 1)
