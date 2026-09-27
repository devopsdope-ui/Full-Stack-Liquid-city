"""
Digital Twin API endpoints:
- GET /digital-twin/events/{event_id}/state
- POST /digital-twin/events/{event_id}/what-if (non-mutating counterfactual)
- GET /digital-twin/events/{event_id}/impacts
- GET /digital-twin/events/{event_id}/alerts
- POST /digital-twin/events/{event_id}/replan
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Path
from app.schemas.digital_twin import (
    DigitalTwinState,
    WhatIfScenarioRequest,
    WhatIfScenarioResponse,
    WeatherImpact,
    DigitalTwinAlert,
    ReplanRequest,
    ReplanResponse,
)
from app.services import digital_twin_service

router = APIRouter(prefix="/digital-twin", tags=["digital-twin"])


@router.get("/events/{event_id}/state", response_model=DigitalTwinState, summary="Get live Digital Twin state")
def get_state(event_id: str = Path(..., description="Target event ID e.g. techhack-2026")):
    """
    Returns the real-time virtual state of the Liquid City environment:
    Event attendance, zones, transport corridors, partners, weather impacts, and alerts.
    """
    return digital_twin_service.build_digital_twin_state(event_id=event_id, is_counterfactual=False)


@router.post("/events/{event_id}/what-if", response_model=WhatIfScenarioResponse, summary="Run counterfactual what-if simulation")
def run_what_if(
    event_id: str = Path(..., description="Target event ID"),
    scenario: WhatIfScenarioRequest = WhatIfScenarioRequest(),
):
    """
    Executes a counterfactual What-If simulation without modifying the live state.
    Calculates cascading changes on outdoor transit, cafeteria, roads, and generates recommendations.
    """
    return digital_twin_service.simulate_what_if(event_id=event_id, scenario=scenario)


@router.get("/events/{event_id}/impacts", response_model=List[WeatherImpact], summary="Get explainable weather impacts")
def get_impacts(event_id: str = Path(...)):
    """Returns explainable cause-and-effect impacts currently acting on the venue ecosystem."""
    state = digital_twin_service.build_digital_twin_state(event_id=event_id)
    return state.weather_impacts


@router.get("/events/{event_id}/alerts", response_model=List[DigitalTwinAlert], summary="Get active Digital Twin risk alerts")
def get_alerts(event_id: str = Path(...)):
    """Returns active risk alerts (capacity exceeded, transit delays)."""
    state = digital_twin_service.build_digital_twin_state(event_id=event_id)
    return state.alerts


@router.post("/events/{event_id}/replan", response_model=ReplanResponse, summary="Execute OR-Tools / Rule replan from weather cascade")
def execute_replan(
    event_id: str = Path(...),
    replan_req: ReplanRequest = ReplanRequest(),
):
    """
    Triggers replanning to alleviate bottlenecks caused by weather and crowd spikes.
    Adjusts gate allocations, staggers dining groups, and activates overflow areas.
    """
    return digital_twin_service.execute_replan(event_id=event_id, request=replan_req)
