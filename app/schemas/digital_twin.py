"""
Digital Twin schemas: state, what-if counterfactual requests/responses, cascading impacts, and replan directives.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.weather import WeatherCurrent


class DigitalTwinEventState(BaseModel):
    id: str
    expected_attendance: int
    inside: int


class DigitalTwinZoneState(BaseModel):
    name: str
    capacity: int
    occupancy: int
    occupancy_percent: float
    status: str
    predicted_15_min: Optional[int] = None
    predicted_30_min: Optional[int] = None


class DigitalTwinTransportState(BaseModel):
    road_id: str
    name: str
    congestion_percent: float
    travel_time_minutes: float
    predicted_travel_time: Optional[float] = None
    status: str


class DigitalTwinPartnerState(BaseModel):
    id: str
    name: str
    type: str
    capacity: int
    occupancy_percent: float
    wait_minutes: float
    offer_discount: float


class WeatherImpact(BaseModel):
    source: str
    target: str
    impact_type: str
    change: float
    reason: str
    confidence: float


class DigitalTwinAlert(BaseModel):
    id: str
    severity: str  # LOW | MODERATE | HIGH | CRITICAL
    entity: str
    message: str
    current_value: str
    predicted_value: str
    recommended_action: str
    action_key: Optional[str] = None


class DigitalTwinState(BaseModel):
    timestamp: str
    event: DigitalTwinEventState
    weather: WeatherCurrent
    zones: Dict[str, DigitalTwinZoneState]
    transport: Dict[str, DigitalTwinTransportState]
    partners: Dict[str, DigitalTwinPartnerState]
    predictions: Dict[str, Any]
    weather_impacts: List[WeatherImpact]
    alerts: List[DigitalTwinAlert]
    confidence: Dict[str, float]
    is_counterfactual: bool = False


class WhatIfScenarioRequest(BaseModel):
    rainfall_mm_per_hour: float = Field(0.0, ge=0.0, le=150.0)
    temperature_c: float = Field(27.0, ge=-10.0, le=60.0)
    wind_speed_kmh: float = Field(15.0, ge=0.0, le=150.0)
    storm_duration_minutes: int = Field(30, ge=0, le=360)
    scenario_preset: Optional[str] = None


class MetricChange(BaseModel):
    entity: str
    metric: str
    before: float
    after: float
    unit: str = ""
    percent_change: float


class CascadeStep(BaseModel):
    step: int
    cause: str
    effect: str
    magnitude: str


class WhatIfScenarioResponse(BaseModel):
    scenario: WhatIfScenarioRequest
    baseline: DigitalTwinState
    simulated: DigitalTwinState
    changes: List[MetricChange]
    cascade: List[CascadeStep]
    impacts: List[WeatherImpact]
    alerts: List[DigitalTwinAlert]
    recommendations: List[Dict[str, Any]]
    confidence: Dict[str, float]


class ReplanRequest(BaseModel):
    trigger: str = "weather_cascade"
    what_if_scenario: Optional[WhatIfScenarioRequest] = None


class ReplanResponse(BaseModel):
    plan_version: int
    trigger: str
    timestamp: str
    changes: List[str]
    expected_result: Dict[str, Any]
    gate_allocation: List[Dict[str, Any]]
    zone_congestion: List[Dict[str, Any]]
    bottlenecks: List[Dict[str, Any]]
