"""
Structured Event Model.

This is the machine-readable contract between Gemini (interpretation) and
the planning engine (decisions). Gemini fills this in from the raw
questionnaire; it must never invent a number that wasn't provided or
estimated by the organizer - missing values stay null/"unknown" with a
"none" confidence, by construction (see gemini_service.py).
"""

from typing import Optional, Literal
from pydantic import BaseModel

Confidence = Literal["provided", "estimated", "derived", "unknown"]


class ValueWithConfidence(BaseModel):
    value: Optional[float] = None
    confidence: Confidence = "unknown"


class EventInfo(BaseModel):
    type: str
    type_raw: Optional[str] = None  # organizer's own "Other" text, if used
    expected_attendance: int
    expected_peak_attendance: Optional[int] = None


class VenueInfo(BaseModel):
    name: str
    city: str
    type: Literal["indoor", "outdoor", "both"]
    description: Optional[str] = None


class ZoneModel(BaseModel):
    name: str
    capacity: Optional[int] = None
    capacity_confidence: Confidence = "unknown"
    location: Optional[str] = None
    restrictions: Optional[str] = None


class EntranceModel(BaseModel):
    name: str
    capacity: Optional[int] = None
    capacity_confidence: Confidence = "unknown"
    location: Optional[str] = None
    restrictions: Optional[str] = None


class ExitsModel(BaseModel):
    normal: list[dict] = []
    emergency: list[dict] = []
    normal_count: Optional[int] = None
    emergency_count: Optional[int] = None


class ActivityModel(BaseModel):
    name: str
    start: str
    end: str
    expected_attendance: Optional[int] = None
    zone: Optional[str] = None
    mandatory: Optional[str] = "unknown"


class MovementLink(BaseModel):
    """A single derived 'from activity/zone -> to activity/zone' movement."""
    from_zone: Optional[str] = None
    to_zone: Optional[str] = None
    from_activity: Optional[str] = None
    to_activity: Optional[str] = None
    note: Optional[str] = None
    confidence: Confidence = "unknown"


class GroupsModel(BaseModel):
    enabled: bool = False
    count: Optional[int] = None
    average_size: Optional[int] = None
    keep_together: Optional[bool] = None


class ResourcesModel(BaseModel):
    food: bool = False
    parking: bool = False
    public_transport: bool = False
    shuttle: bool = False
    registration: bool = False
    restrooms: bool = False
    medical: bool = False
    security: bool = False
    exhibition: bool = False
    accommodation: bool = False
    other: Optional[str] = None
    # free-form conditional details, e.g. {"registration": "3 counters"}
    details: dict = {}


class ConstraintModel(BaseModel):
    description: str
    type: str  # e.g. "gate_restriction", "zone_restriction", "capacity_limit", "unclassified"
    confidence: Confidence = "unknown"
    source: Literal["organizer_structured", "gemini_extracted", "raw_text_no_gemini"] = "organizer_structured"


class StructuredEventModel(BaseModel):
    event: EventInfo
    venue: VenueInfo
    zones: list[ZoneModel] = []
    entrances: list[EntranceModel] = []
    exits: ExitsModel = ExitsModel()
    activities: list[ActivityModel] = []
    movement: list[MovementLink] = []
    groups: GroupsModel = GroupsModel()
    resources: ResourcesModel = ResourcesModel()
    priorities: list[str] = []
    constraints: list[ConstraintModel] = []

    # Gemini's own notes about missing info / ambiguity - surfaced to the
    # organizer or the planning UI, never silently dropped.
    missing_information: list[str] = []
    ambiguities: list[str] = []
