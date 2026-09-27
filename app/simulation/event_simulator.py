"""
Event simulator: pure helper functions for event attendance/progress.
"""

from app.utils.calculations import clamp


def set_attendance(new_attendance: int) -> int:
    if new_attendance < 0:
        raise ValueError("event_attendance cannot be negative")
    return new_attendance


def advance_progress(current_progress: float, minutes: float, event_duration_minutes: float = 180) -> float:
    delta = (minutes / event_duration_minutes) * 100
    return clamp(current_progress + delta)


def trigger_event_ending(current_progress: float) -> float:
    """Jump progress close to 100 - used for the 'Event Ending' admin action."""
    return max(current_progress, 90)
