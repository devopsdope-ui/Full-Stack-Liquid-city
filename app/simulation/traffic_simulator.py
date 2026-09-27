"""
Traffic simulator: pure helper functions for road congestion updates.
"""

from app.utils.calculations import clamp


def apply_congestion_change(current_congestion: float, delta: float) -> float:
    return clamp(current_congestion + delta)


def apply_traffic_jam(current_congestion: float, amount: float = 20) -> float:
    """Admin-triggered sudden congestion spike on a road."""
    return clamp(current_congestion + abs(amount))


def redistribute_from_crowd_exit(road_congestion: dict, primary_road: str, secondary_road: str,
                                  primary_bump: float = 15, secondary_bump: float = 5) -> dict:
    """
    When a crowd empties out of a venue, the nearest road usually absorbs
    most of the extra traffic and a secondary/bypass road absorbs some.
    Returns a new dict (does not mutate the input).
    """
    updated = dict(road_congestion)
    if primary_road in updated:
        updated[primary_road] = clamp(updated[primary_road] + primary_bump)
    if secondary_road in updated:
        updated[secondary_road] = clamp(updated[secondary_road] + secondary_bump)
    return updated
