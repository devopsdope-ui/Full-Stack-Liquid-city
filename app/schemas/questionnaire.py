"""
Raw organizer questionnaire schemas.

These mirror exactly what the organizer typed/selected in the UI - no
interpretation, no invented defaults. Gemini + the planning engine consume
this raw shape and turn it into the structured event model
(app/schemas/event_model.py).
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field


class ZoneInput(BaseModel):
    name: str
    capacity: Optional[int] = None
    capacity_type: Literal["known", "estimated", "unknown"] = "unknown"
    location: Optional[str] = None
    restrictions: Optional[str] = None


class EntranceInput(BaseModel):
    name: str
    capacity: Optional[int] = None
    location: Optional[str] = None
    restrictions: Optional[str] = None


class ExitInput(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    location: Optional[str] = None


class ActivityInput(BaseModel):
    name: str
    start: str  # "HH:MM", kept as a plain string - the organizer's own format
    end: str
    expected_attendance: Optional[int] = None
    zone: Optional[str] = None
    mandatory: Optional[Literal["yes", "no", "unknown"]] = "unknown"


class GroupsInput(BaseModel):
    enabled: bool = False
    count: Optional[int] = None
    average_size: Optional[int] = None
    keep_together: Optional[Literal["yes", "no", "not_important"]] = None


class ResourceDetail(BaseModel):
    """A selected facility plus its one conditional follow-up answer, if any."""
    selected: bool = False
    detail: Optional[str] = None  # e.g. "3 counters", "150 people at once"


class ResourcesInput(BaseModel):
    food: ResourceDetail = ResourceDetail()
    parking: ResourceDetail = ResourceDetail()
    public_transport: ResourceDetail = ResourceDetail()
    shuttle: ResourceDetail = ResourceDetail()
    registration: ResourceDetail = ResourceDetail()
    restrooms: ResourceDetail = ResourceDetail()
    medical: ResourceDetail = ResourceDetail()
    security: ResourceDetail = ResourceDetail()
    exhibition: ResourceDetail = ResourceDetail()
    accommodation: ResourceDetail = ResourceDetail()
    other: Optional[str] = None


PriorityOption = Literal[
    "avoid_overcrowding", "reduce_entry_queues", "reduce_waiting_time",
    "balance_entrances", "avoid_room_congestion", "manage_food_crowds",
    "manage_parking", "manage_transportation", "smooth_event_exit",
    "keep_groups_together", "emergency_preparedness", "other",
]


class QuestionnaireSubmission(BaseModel):
    """The complete raw organizer questionnaire response."""

    # Layer 1 - Event Understanding
    event_type: str
    event_type_other: Optional[str] = None
    expected_attendance: int = Field(..., gt=0)
    expected_peak_attendance: Optional[int] = None

    venue_name: str
    venue_city: str
    venue_type: Literal["indoor", "outdoor", "both"]
    venue_description: Optional[str] = None

    zones: list[ZoneInput] = []

    # Layer 2 - Crowd Flow
    entrances: list[EntranceInput] = []
    entrances_count_only: Optional[int] = None  # used if organizer only gives a number

    normal_exits: list[ExitInput] = []
    normal_exits_count_only: Optional[int] = None
    emergency_exits: list[ExitInput] = []
    emergency_exits_count_only: Optional[int] = None

    activities: list[ActivityInput] = []

    movement_notes: Optional[str] = None  # free text, e.g. "After opening ceremony, ..."

    groups: GroupsInput = GroupsInput()

    # Layer 3 - Resources & Priorities
    resources: ResourcesInput = ResourcesInput()
    priorities: list[PriorityOption] = []
    priorities_other: Optional[str] = None

    special_instructions: Optional[str] = None  # free text constraints
