"""
Social and public signals schemas for crowd disruptions, weather notices, and traffic signals.
"""

from typing import Optional
from pydantic import BaseModel, Field


class SocialSignal(BaseModel):
    id: str
    source: str = Field("traffic_police_feed", description="Source platform or agency e.g. twitter, traffic_police, user_report")
    type: str = Field(..., description="traffic_disruption | flooding | transport_delay | event_disruption | crowd_surge | weather_report")
    location: str
    severity: float = Field(0.5, ge=0.0, le=1.0, description="Normalized severity 0.0 to 1.0")
    text: str
    timestamp: str
    confidence: float = Field(0.8, ge=0.0, le=1.0)
    is_live: bool = Field(False, description="True if real live API signal, False if public dataset fixture")


class SocialSignalCreate(BaseModel):
    source: str = "user_report"
    type: str
    location: str
    severity: float = 0.5
    text: str
    confidence: float = 0.75
