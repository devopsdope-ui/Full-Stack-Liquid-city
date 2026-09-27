from typing import Optional
from pydantic import BaseModel


class GateAllocation(BaseModel):
    name: str
    share_percentage: float          # e.g. 40.0
    expected_attendance: float
    basis: str                       # short explanation of how the share was derived


class ZoneCongestionEstimate(BaseModel):
    zone: str
    activity: Optional[str] = None
    expected_attendance: Optional[int] = None
    capacity: Optional[int] = None
    projected_occupancy_percentage: Optional[float] = None
    status: str                      # NORMAL | MODERATE | HIGH | CRITICAL | UNKNOWN_CAPACITY


class Bottleneck(BaseModel):
    zone_or_gate: str
    reason: str
    severity: str                    # LOW | MEDIUM | HIGH


class ResourceDemand(BaseModel):
    resource: str
    estimated_demand: Optional[str] = None
    note: Optional[str] = None


class OperationalPlan(BaseModel):
    event_model_id: Optional[str] = None
    gate_allocation: list[GateAllocation] = []
    zone_congestion: list[ZoneCongestionEstimate] = []
    exit_flow_note: Optional[str] = None
    bottlenecks: list[Bottleneck] = []
    resource_demand: list[ResourceDemand] = []
    group_handling_note: Optional[str] = None
    priorities_applied: list[str] = []
    warnings: list[str] = []         # e.g. "3 zones have unknown capacity"
