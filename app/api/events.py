from fastapi import APIRouter, HTTPException

from app.schemas.event import Event, EventCreate, EventUpdate
from app.services import event_service

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[Event])
def get_events():
    return event_service.list_events()


@router.get("/{event_id}", response_model=Event)
def get_event(event_id: str):
    event = event_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("", response_model=Event, status_code=201)
def create_event(payload: EventCreate):
    return event_service.create_event(payload.model_dump())


@router.put("/{event_id}", response_model=Event)
def update_event(event_id: str, payload: EventUpdate):
    updated = event_service.update_event(event_id, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Event not found")
    return updated
