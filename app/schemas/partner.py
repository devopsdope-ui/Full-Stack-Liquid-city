from typing import Optional
from pydantic import BaseModel, Field


class PartnerBase(BaseModel):
    name: str
    type: str  # restaurant | parking | shuttle
    capacity: int = Field(100, gt=0)
    occupancy: float = Field(0, ge=0, le=100)
    waiting_time: float = Field(0, ge=0)
    rating: float = Field(4.0, ge=0, le=5)
    offer: float = Field(0, ge=0)  # discount amount in currency units
    verified: bool = True


class PartnerCreate(PartnerBase):
    pass


class PartnerUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    capacity: Optional[int] = Field(None, gt=0)
    occupancy: Optional[float] = Field(None, ge=0, le=100)
    waiting_time: Optional[float] = Field(None, ge=0)
    rating: Optional[float] = Field(None, ge=0, le=5)
    offer: Optional[float] = Field(None, ge=0)
    verified: Optional[bool] = None


class Partner(PartnerBase):
    id: str
