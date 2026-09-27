from typing import Optional
from pydantic import BaseModel


class Recommendation(BaseModel):
    id: str
    name: str
    type: str
    score: float
    distance: float
    occupancy: float
    waiting_time: float
    predicted_crowd: float
    predicted_travel_time: Optional[float] = None
    reason: str


class RecommendationRequest(BaseModel):
    """Optional visitor preferences used to personalize ranking."""
    visitor_preference: str = "balanced"  # balanced | low_crowd | fastest | cheapest
    price_level_max: Optional[int] = None
    exclude_ids: list[str] = []


class RecommendationChoiceRequest(BaseModel):
    """A visitor accepting, rejecting, or explicitly picking an option."""
    chosen_id: Optional[str] = None
    rejected_id: Optional[str] = None
