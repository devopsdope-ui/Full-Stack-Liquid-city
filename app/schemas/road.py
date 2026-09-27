from pydantic import BaseModel, Field


class Road(BaseModel):
    road_id: str
    name: str
    congestion: float           # 0-100 percentage
    average_speed: float        # km/h
    predicted_travel_time: float  # minutes, for the road's fixed distance


class RoutePredictionRequest(BaseModel):
    distance_km: float = Field(..., gt=0)
    normal_travel_time: float = Field(..., gt=0)   # minutes, at free-flow speed
    congestion: float = Field(..., ge=0, le=100)
    nearby_crowd: float = Field(0, ge=0, le=100)
    event_attendance: int = Field(0, ge=0)
    road_capacity: float = Field(3000, gt=0)
    average_speed: float = Field(30, gt=0)


class RoutePredictionResponse(BaseModel):
    distance_km: float
    predicted_travel_time: float
    congestion: float
