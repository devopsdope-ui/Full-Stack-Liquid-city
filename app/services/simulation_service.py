"""
Simulation service: thin wrapper around the simulation engine singleton.
Exists so API route files never talk to the engine directly (Rule 3).
"""

from app.simulation.simulation_engine import simulation_engine


def start():
    return simulation_engine.start()


def pause():
    return simulation_engine.pause()


def reset():
    return simulation_engine.reset()


def status():
    return simulation_engine.status()


def set_attendance(event_attendance: int):
    return simulation_engine.set_attendance(event_attendance)


def crowd_surge(location_id: str, amount: float):
    return simulation_engine.crowd_surge(location_id, amount)


def event_end():
    return simulation_engine.event_end()


def traffic_jam(road_id: str, amount: float):
    return simulation_engine.traffic_jam(road_id, amount)


def set_restaurant_occupancy(partner_id: str, occupancy: float):
    return simulation_engine.set_restaurant_occupancy(partner_id, occupancy)
