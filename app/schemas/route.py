from pydantic import BaseModel


class RouteOption(BaseModel):
    route_id: str
    name: str
    distance_km: float
    congestion: float
    predicted_travel_time: float
