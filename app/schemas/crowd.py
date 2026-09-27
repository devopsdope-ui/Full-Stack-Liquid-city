from pydantic import BaseModel


class Crowd(BaseModel):
    location_id: str
    name: str
    occupancy: float          # 0-100 percentage
    capacity: int
    status: str                # NORMAL | MODERATE | HIGH | CRITICAL
    timestamp: str


class CrowdPrediction(BaseModel):
    location_id: str
    current_percentage: float
    predicted_15_min: float
    predicted_30_min: float
    risk: str
    reasons: list[str]
