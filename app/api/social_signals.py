"""
Social and Public Signals API router.
"""

from typing import List, Optional
from fastapi import APIRouter, Query, status
from app.schemas.social_signal import SocialSignal, SocialSignalCreate
from app.services import social_signal_service

router = APIRouter(prefix="/social-signals", tags=["social-signals"])


@router.get("", response_model=List[SocialSignal], summary="List normalized social and public alerts")
def get_signals(
    signal_type: Optional[str] = Query(None, description="traffic_disruption | flooding | transport_delay | weather_report"),
    location: Optional[str] = Query(None, description="e.g. road_01, stadium_zone"),
):
    """Retrieves active real-time community, sensor, and authority signals with severity levels."""
    return social_signal_service.list_signals(signal_type, location)


@router.post("", response_model=SocialSignal, status_code=status.HTTP_201_CREATED, summary="Ingest public or user signal")
def create_signal(body: SocialSignalCreate):
    """Allows ingestion of traffic alerts, incident reports, and weather disruptions."""
    return social_signal_service.add_signal(body)
