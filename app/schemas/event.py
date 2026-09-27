from typing import Optional
from pydantic import BaseModel, Field


class EventBase(BaseModel):
    name: str
    location: str
    expected_attendance: int = Field(..., gt=0)
    current_attendance: int = Field(0, ge=0)
    status: str = "scheduled"  # scheduled | ongoing | ending | ended


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    expected_attendance: Optional[int] = Field(None, gt=0)
    current_attendance: Optional[int] = Field(None, ge=0)
    status: Optional[str] = None


class Event(EventBase):
    id: str
