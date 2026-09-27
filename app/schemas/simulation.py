from typing import Optional, Any
from pydantic import BaseModel


class SimulationAction(BaseModel):
    action: str
    value: Optional[Any] = None
    timestamp: Optional[str] = None


class SetAttendanceRequest(BaseModel):
    event_attendance: int


class CrowdSurgeRequest(BaseModel):
    location_id: str = "stadium_crowd"
    amount: float = 10  # percentage points to add


class TrafficJamRequest(BaseModel):
    road_id: str = "central_road"
    amount: float = 20  # percentage points to add


class RestaurantOccupancyRequest(BaseModel):
    partner_id: str
    occupancy: float


class SimulationState(BaseModel):
    simulation_running: bool
    event_attendance: int
    event_progress: float
    stadium_crowd: float
    road_congestion: dict
    restaurants: dict
    partners: dict
