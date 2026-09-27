"""
Event service: simple CRUD for events.

Uses Supabase if configured (table "events"), otherwise falls back to an
in-memory store so the hackathon demo works without a database.
"""

import uuid
from typing import Optional

from app.db.supabase import get_supabase
from app.simulation.simulation_engine import simulation_engine

_memory_events: dict = {}

# Seed one event that mirrors the simulation engine's default state so the
# demo has something to show immediately.
_seed_id = "event-main"
_memory_events[_seed_id] = {
    "id": _seed_id,
    "name": "Championship Final",
    "location": "City Stadium",
    "expected_attendance": simulation_engine.status()["event_attendance"],
    "current_attendance": simulation_engine.status()["event_attendance"],
    "status": "ongoing",
}


def list_events() -> list:
    client = get_supabase()
    if client:
        try:
            result = client.table("events").select("*").execute()
            return result.data
        except Exception:
            pass
    return list(_memory_events.values())


def get_event(event_id: str) -> Optional[dict]:
    client = get_supabase()
    if client:
        try:
            result = client.table("events").select("*").eq("id", event_id).single().execute()
            return result.data
        except Exception:
            pass
    return _memory_events.get(event_id)


def create_event(data: dict) -> dict:
    event_id = str(uuid.uuid4())
    event = {"id": event_id, **data}

    client = get_supabase()
    if client:
        try:
            client.table("events").insert(event).execute()
            return event
        except Exception:
            pass

    _memory_events[event_id] = event
    return event


def update_event(event_id: str, data: dict) -> Optional[dict]:
    client = get_supabase()
    if client:
        try:
            result = client.table("events").update(data).eq("id", event_id).execute()
            return result.data[0] if result.data else None
        except Exception:
            pass

    if event_id not in _memory_events:
        return None
    _memory_events[event_id].update({k: v for k, v in data.items() if v is not None})
    return _memory_events[event_id]
