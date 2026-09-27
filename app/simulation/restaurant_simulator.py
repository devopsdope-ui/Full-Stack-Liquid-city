"""
Restaurant / parking / shuttle ("partner") simulator: pure helper
functions for occupancy and waiting-time updates.
"""

from app.utils.calculations import clamp, estimate_waiting_time


def apply_occupancy_change(current_occupancy: float, delta: float) -> float:
    return clamp(current_occupancy + delta)


def set_occupancy(new_occupancy: float) -> float:
    return clamp(new_occupancy)


def recompute_waiting_time(occupancy: float) -> float:
    """Waiting time roughly follows occupancy when not explicitly overridden."""
    return estimate_waiting_time(occupancy)


def apply_nearby_boost(occupancy: float, nearby_venue_crowd_delta: float, sensitivity: float = 0.3) -> float:
    """
    When a nearby venue (e.g. the stadium) gets more/less crowded, partner
    occupancy shifts a bit in the same direction (spillover effect), scaled
    by `sensitivity`.
    """
    return clamp(occupancy + nearby_venue_crowd_delta * sensitivity)
