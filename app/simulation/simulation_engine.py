"""
Simulation engine: the single in-memory source of truth for the demo.

Deliberately simple (Rule: "Do NOT over-engineer this") - a module-level
singleton with a plain dict-backed state, guarded by a threading.Lock so
FastAPI's async workers don't corrupt it under concurrent requests. This is
enough for a hackathon demo; a real product would persist this in Supabase.
"""

import threading
from datetime import datetime, timezone
from typing import Optional

from app.utils import constants as c
from app.simulation import crowd_simulator, traffic_simulator, restaurant_simulator, event_simulator


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class SimulationEngine:
    def __init__(self):
        self._lock = threading.Lock()
        self.reset()

    # -- lifecycle -----------------------------------------------------
    def reset(self):
        with self._lock:
            self._state = {
                "simulation_running": False,
                "event_attendance": c.DEFAULT_EVENT_ATTENDANCE,
                "event_progress": c.DEFAULT_EVENT_PROGRESS,
                "stadium_crowd": c.DEFAULT_STADIUM_CROWD,
                "entry_rate": 8.0,
                "exit_rate": 1.0,
                "road_congestion": {
                    road_id: data["congestion"] for road_id, data in c.DEFAULT_ROADS.items()
                },
                "roads_meta": {road_id: dict(data) for road_id, data in c.DEFAULT_ROADS.items()},
                "partners": {
                    partner_id: dict(data) for partner_id, data in c.DEFAULT_PARTNERS.items()
                },
                "nearby_population": c.DEFAULT_NEARBY_POPULATION,
                "nearby_traffic": c.DEFAULT_NEARBY_TRAFFIC,
                "last_updated": _now(),
                "last_action": "reset",
            }
        return self.status()

    def start(self):
        with self._lock:
            self._state["simulation_running"] = True
            self._state["last_action"] = "start"
            self._state["last_updated"] = _now()
        return self.status()

    def pause(self):
        with self._lock:
            self._state["simulation_running"] = False
            self._state["last_action"] = "pause"
            self._state["last_updated"] = _now()
        return self.status()

    def status(self) -> dict:
        with self._lock:
            state = dict(self._state)
        # convenience view matching the "restaurants" example in the spec
        restaurants = {
            pid: p["occupancy"] for pid, p in state["partners"].items() if p["type"] == "restaurant"
        }
        return {
            "simulation_running": state["simulation_running"],
            "event_attendance": state["event_attendance"],
            "event_progress": round(state["event_progress"], 1),
            "stadium_crowd": round(state["stadium_crowd"], 1),
            "entry_rate": state["entry_rate"],
            "exit_rate": state["exit_rate"],
            "road_congestion": {k: round(v, 1) for k, v in state["road_congestion"].items()},
            "restaurants": {k: round(v, 1) for k, v in restaurants.items()},
            "partners": state["partners"],
            "roads_meta": state["roads_meta"],
            "nearby_population": state["nearby_population"],
            "nearby_traffic": state["nearby_traffic"],
            "last_action": state["last_action"],
            "last_updated": state["last_updated"],
        }

    # -- admin actions ---------------------------------------------------
    def set_attendance(self, event_attendance: int):
        event_attendance = event_simulator.set_attendance(event_attendance)
        with self._lock:
            self._state["event_attendance"] = event_attendance
            self._state["last_action"] = "set_attendance"
            self._state["last_updated"] = _now()
        return self.status()

    def crowd_surge(self, location_id: str = "stadium_crowd", amount: float = 10):
        with self._lock:
            if location_id == "stadium_crowd":
                self._state["stadium_crowd"] = crowd_simulator.apply_surge(self._state["stadium_crowd"], amount)
            elif location_id in self._state["partners"]:
                p = self._state["partners"][location_id]
                p["occupancy"] = restaurant_simulator.apply_occupancy_change(p["occupancy"], abs(amount))
                p["waiting_time"] = restaurant_simulator.recompute_waiting_time(p["occupancy"])
            else:
                raise ValueError(f"Unknown location_id: {location_id}")
            self._state["last_action"] = f"crowd_surge:{location_id}"
            self._state["last_updated"] = _now()
        return self.status()

    def event_end(self):
        """
        Simulate the event ending: a chunk of the stadium crowd leaves,
        nearby roads get more congested, and restaurants near the stadium
        see a small relief in occupancy while the north side sees more
        activity from people spreading out.
        """
        with self._lock:
            old_crowd = self._state["stadium_crowd"]
            new_crowd = crowd_simulator.apply_event_ending(old_crowd, drop_fraction=0.25)
            crowd_delta = new_crowd - old_crowd  # negative

            self._state["stadium_crowd"] = new_crowd
            self._state["event_progress"] = event_simulator.trigger_event_ending(self._state["event_progress"])
            self._state["exit_rate"] = 15.0
            self._state["entry_rate"] = 0.5

            self._state["road_congestion"] = traffic_simulator.redistribute_from_crowd_exit(
                self._state["road_congestion"],
                primary_road="central_road",
                secondary_road="north_road",
                primary_bump=15,
                secondary_bump=8,
            )

            for pid, p in self._state["partners"].items():
                if p["type"] == "restaurant" and "north" not in pid:
                    # near-stadium restaurants ease slightly as some people leave the area
                    p["occupancy"] = restaurant_simulator.apply_nearby_boost(p["occupancy"], crowd_delta, sensitivity=0.15)
                else:
                    # north-side options pick up demand from people spreading out
                    p["occupancy"] = restaurant_simulator.apply_nearby_boost(p["occupancy"], abs(crowd_delta), sensitivity=0.05)
                p["waiting_time"] = restaurant_simulator.recompute_waiting_time(p["occupancy"])

            self._state["last_action"] = "event_end"
            self._state["last_updated"] = _now()
        return self.status()

    def traffic_jam(self, road_id: str = "central_road", amount: float = 20):
        with self._lock:
            if road_id not in self._state["road_congestion"]:
                raise ValueError(f"Unknown road_id: {road_id}")
            self._state["road_congestion"][road_id] = traffic_simulator.apply_traffic_jam(
                self._state["road_congestion"][road_id], amount
            )
            self._state["last_action"] = f"traffic_jam:{road_id}"
            self._state["last_updated"] = _now()
        return self.status()

    def set_restaurant_occupancy(self, partner_id: str, occupancy: float):
        with self._lock:
            if partner_id not in self._state["partners"]:
                raise ValueError(f"Unknown partner_id: {partner_id}")
            if occupancy < 0 or occupancy > 100:
                raise ValueError("occupancy must be between 0 and 100")
            p = self._state["partners"][partner_id]
            p["occupancy"] = restaurant_simulator.set_occupancy(occupancy)
            p["waiting_time"] = restaurant_simulator.recompute_waiting_time(p["occupancy"])
            self._state["last_action"] = f"set_restaurant_occupancy:{partner_id}"
            self._state["last_updated"] = _now()
        return self.status()

    def set_parking_availability(self, partner_id: str, occupancy: float):
        return self.set_restaurant_occupancy(partner_id, occupancy)

    def set_shuttle_availability(self, partner_id: str, occupancy: float):
        return self.set_restaurant_occupancy(partner_id, occupancy)

    def tick(self, minutes: float = 1.0):
        """Advance the simulation by `minutes` using current entry/exit rates. Optional/manual for the demo."""
        with self._lock:
            if not self._state["simulation_running"]:
                return self.status()
            self._state["stadium_crowd"] = crowd_simulator.apply_flow(
                self._state["stadium_crowd"], self._state["entry_rate"], self._state["exit_rate"], minutes
            )
            self._state["event_progress"] = event_simulator.advance_progress(self._state["event_progress"], minutes)
            self._state["last_action"] = "tick"
            self._state["last_updated"] = _now()
        return self.status()

    # -- read helpers used by services ----------------------------------
    def get_partner(self, partner_id: str) -> Optional[dict]:
        with self._lock:
            p = self._state["partners"].get(partner_id)
            return dict(p) if p else None

    def get_road(self, road_id: str) -> Optional[dict]:
        with self._lock:
            if road_id not in self._state["road_congestion"]:
                return None
            meta = dict(self._state["roads_meta"][road_id])
            meta["congestion"] = self._state["road_congestion"][road_id]
            return meta


# Module-level singleton - simple and sufficient for a hackathon demo.
simulation_engine = SimulationEngine()
