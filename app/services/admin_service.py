"""
Admin service: the admin API is a control surface over the SAME
simulation used everywhere else - it deliberately does not duplicate any
simulation logic (Rule: admin endpoints call the simulation service).
"""

from app.services import simulation_service


def start_simulation():
    return simulation_service.start()


def pause_simulation():
    return simulation_service.pause()


def reset_simulation():
    return simulation_service.reset()


def get_status():
    return simulation_service.status()


def trigger_crowd_surge(location_id: str, amount: float):
    return simulation_service.crowd_surge(location_id, amount)


def trigger_event_end():
    return simulation_service.event_end()


def trigger_traffic_jam(road_id: str, amount: float):
    return simulation_service.traffic_jam(road_id, amount)


def set_attendance(event_attendance: int):
    return simulation_service.set_attendance(event_attendance)


def set_restaurant_occupancy(partner_id: str, occupancy: float):
    return simulation_service.set_restaurant_occupancy(partner_id, occupancy)
