"""
Crowd simulator: pure helper functions that compute how a crowd level
changes in response to time passing or admin actions. No state is stored
here - the simulation_engine owns the state and calls these helpers.
"""

from app.utils.calculations import clamp


def apply_flow(current_crowd: float, entry_rate: float, exit_rate: float, minutes: float = 1.0) -> float:
    """Advance crowd level given entry/exit rates (percentage points per minute)."""
    net = (entry_rate - exit_rate) * minutes
    return clamp(current_crowd + net)


def apply_surge(current_crowd: float, amount: float) -> float:
    """Admin-triggered sudden crowd increase."""
    return clamp(current_crowd + abs(amount))


def apply_event_ending(current_crowd: float, drop_fraction: float = 0.25) -> float:
    """
    Admin-triggered 'event ending': a portion of the crowd leaves at once.
    drop_fraction is the fraction of the CURRENT crowd that leaves.
    """
    new_crowd = current_crowd - (current_crowd * drop_fraction)
    return clamp(new_crowd)
