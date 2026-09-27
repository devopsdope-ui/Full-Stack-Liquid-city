"""
Event model service.

Builds the StructuredEventModel from the organizer's raw questionnaire
submission. Deliberately deterministic for every field EXCEPT the three
free-text spots (movement notes, special instructions, "other" event
type) - those go through gemini_service, and even then Gemini only
restructures what the organizer actually wrote (see gemini_service.py's
module docstring).

Persists both the raw submission and the structured model to Supabase
(tables "event_submissions" / "event_models") if configured; otherwise
falls back to an in-memory store so the hackathon demo works without a
database. See migrations/supabase_schema.sql for the table definitions.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from app.db.supabase import get_supabase
from app.schemas.questionnaire import QuestionnaireSubmission
from app.services import gemini_service

_memory_store: dict = {}  # event_model_id -> {"raw": ..., "structured": ...}


def _confidence_for_zone(zone) -> str:
    if zone.capacity is None:
        return "unknown"
    return zone.capacity_type  # "known" or "estimated" as given by the organizer


def _resource_flags(resources) -> dict:
    fields = [
        "food", "parking", "public_transport", "shuttle", "registration",
        "restrooms", "medical", "security", "exhibition", "accommodation",
    ]
    flags = {}
    details = {}
    for f in fields:
        detail_obj = getattr(resources, f)
        flags[f] = bool(detail_obj.selected)
        if detail_obj.selected and detail_obj.detail:
            details[f] = detail_obj.detail
    return {"flags": flags, "details": details, "other": resources.other}


def build_structured_event_model(submission: QuestionnaireSubmission) -> dict:
    """Returns a plain dict matching app.schemas.event_model.StructuredEventModel."""

    normalized_type, raw_other = gemini_service.normalize_event_type(
        submission.event_type, submission.event_type_other
    )

    zones = [{
        "name": z.name,
        "capacity": z.capacity,
        "capacity_confidence": _confidence_for_zone(z),
        "location": z.location,
        "restrictions": z.restrictions,
    } for z in submission.zones]

    entrances = [{
        "name": e.name,
        "capacity": e.capacity,
        "capacity_confidence": "provided" if e.capacity is not None else "unknown",
        "location": e.location,
        "restrictions": e.restrictions,
    } for e in submission.entrances]

    exits = {
        "normal": [e.model_dump() for e in submission.normal_exits],
        "emergency": [e.model_dump() for e in submission.emergency_exits],
        "normal_count": submission.normal_exits_count_only if not submission.normal_exits else len(submission.normal_exits),
        "emergency_count": submission.emergency_exits_count_only if not submission.emergency_exits else len(submission.emergency_exits),
    }

    activities = [{
        "name": a.name,
        "start": a.start,
        "end": a.end,
        "expected_attendance": a.expected_attendance,
        "zone": a.zone,
        "mandatory": a.mandatory,
    } for a in submission.activities]

    movement = gemini_service.structure_movement(submission.movement_notes)

    groups = {
        "enabled": submission.groups.enabled,
        "count": submission.groups.count,
        "average_size": submission.groups.average_size,
        "keep_together": (
            True if submission.groups.keep_together == "yes"
            else False if submission.groups.keep_together == "no"
            else None
        ),
    }

    resource_info = _resource_flags(submission.resources)
    resources = {**resource_info["flags"], "other": resource_info["other"], "details": resource_info["details"]}

    priorities = list(submission.priorities)
    if "other" in priorities and submission.priorities_other:
        priorities = [p for p in priorities if p != "other"] + [f"other:{submission.priorities_other}"]

    constraints = gemini_service.structure_constraints(submission.special_instructions)

    structured = {
        "event": {
            "type": normalized_type,
            "type_raw": raw_other,
            "expected_attendance": submission.expected_attendance,
            "expected_peak_attendance": submission.expected_peak_attendance,
        },
        "venue": {
            "name": submission.venue_name,
            "city": submission.venue_city,
            "type": submission.venue_type,
            "description": submission.venue_description,
        },
        "zones": zones,
        "entrances": entrances,
        "exits": exits,
        "activities": activities,
        "movement": movement,
        "groups": groups,
        "resources": resources,
        "priorities": priorities,
        "constraints": constraints,
        "missing_information": [],
        "ambiguities": [],
    }

    gaps = gemini_service.identify_gaps({
        "event": structured["event"], "zones": zones, "entrances": entrances,
        "exits": exits, "groups": groups,
    })
    structured["missing_information"] = gaps["missing_information"]
    structured["ambiguities"] = gaps["ambiguities"]

    return structured


def submit_questionnaire(submission: QuestionnaireSubmission) -> dict:
    """Builds the structured model and persists both raw + structured. Returns the stored record."""
    event_model_id = str(uuid.uuid4())
    structured = build_structured_event_model(submission)
    now = datetime.now(timezone.utc).isoformat()

    record = {
        "id": event_model_id,
        "raw_submission": submission.model_dump(),
        "structured_model": structured,
        "created_at": now,
    }

    client = get_supabase()
    if client:
        try:
            client.table("event_models").insert({
                "id": event_model_id,
                "raw_submission": record["raw_submission"],
                "structured_model": structured,
                "created_at": now,
            }).execute()
        except Exception as exc:
            print(f"[event_model_service] Supabase insert failed, using in-memory store: {exc}")
            _memory_store[event_model_id] = record
    else:
        _memory_store[event_model_id] = record

    return record


def get_event_model(event_model_id: str) -> Optional[dict]:
    client = get_supabase()
    if client:
        try:
            result = client.table("event_models").select("*").eq("id", event_model_id).single().execute()
            if result.data:
                return result.data
        except Exception:
            pass
    return _memory_store.get(event_model_id)


def list_event_models() -> list:
    client = get_supabase()
    if client:
        try:
            result = client.table("event_models").select("id,created_at").order("created_at", desc=True).execute()
            return result.data
        except Exception:
            pass
    return [{"id": k, "created_at": v["created_at"]} for k, v in _memory_store.items()]
