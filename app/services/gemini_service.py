"""
Gemini interpretation service.

Gemini's ONLY job here is interpretation/structuring of the organizer's
free-text answers (movement notes, special instructions, "other" fields).
It is explicitly NOT allowed to invent capacities, attendance numbers, or
operational decisions - see event_model_service.py for how the rest of
the structured model is built directly and deterministically from the
organizer's structured answers, without going through the LLM at all.

If GEMINI_API_KEY is not configured, or the API call fails for any reason
(network, rate limit, bad response), every function here degrades to a
transparent fallback that stores the organizer's raw text unparsed rather
than crashing or inventing structure - the caller can see this in the
`source` field ("raw_text_no_gemini") of whatever it returns.
"""

import json
import os
import re
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

_TIMEOUT_SECONDS = 20


class GeminiNotConfiguredError(RuntimeError):
    pass


def is_configured() -> bool:
    return bool(GEMINI_API_KEY)


def _call_gemini(system_instruction: str, user_content: str) -> Optional[dict]:
    """
    Calls Gemini with JSON-only output mode. Returns the parsed JSON dict,
    or None if the call failed / the key isn't configured - callers must
    handle None by falling back, never by inventing data themselves.
    """
    if not GEMINI_API_KEY:
        return None

    payload = {
        "system_instruction": {"parts": [{"text": system_instruction}]},
        "contents": [{"role": "user", "parts": [{"text": user_content}]}],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
        },
    }
    headers = {"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY}

    try:
        with httpx.Client(timeout=_TIMEOUT_SECONDS) as client:
            response = client.post(GEMINI_URL, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text)
    except Exception as exc:  # network error, bad key, malformed JSON, etc.
        print(f"[gemini_service] call failed, falling back to raw text: {exc}")
        return None


# ---------------------------------------------------------------------------
# 1. Special instructions -> structured constraints
# ---------------------------------------------------------------------------
_CONSTRAINT_SYSTEM_PROMPT = """You extract structured constraints from an event organizer's free-text notes.

Return ONLY a JSON array. Each item must have exactly these fields:
- "description": the constraint restated concisely, in your own words
- "type": one of "gate_restriction", "zone_restriction", "time_restriction", "capacity_limit", "group_rule", "transport_preference", "other"

Rules:
- Only extract what is explicitly stated. Do not invent constraints.
- Do not invent numbers, capacities, or gate names that are not mentioned.
- If the text contains no extractable constraint, return an empty array [].
- Do not include any commentary, only the JSON array.
"""


def structure_constraints(special_instructions: Optional[str]) -> list[dict]:
    if not special_instructions or not special_instructions.strip():
        return []

    result = _call_gemini(_CONSTRAINT_SYSTEM_PROMPT, special_instructions)
    if result is None:
        return [{
            "description": special_instructions.strip(),
            "type": "unclassified",
            "confidence": "unknown",
            "source": "raw_text_no_gemini",
        }]

    if not isinstance(result, list):
        return [{
            "description": special_instructions.strip(),
            "type": "unclassified",
            "confidence": "unknown",
            "source": "raw_text_no_gemini",
        }]

    constraints = []
    for item in result:
        if not isinstance(item, dict) or "description" not in item:
            continue
        constraints.append({
            "description": item.get("description", "").strip(),
            "type": item.get("type", "unclassified"),
            "confidence": "provided",  # organizer explicitly wrote this text
            "source": "gemini_extracted",
        })
    return constraints or [{
        "description": special_instructions.strip(),
        "type": "unclassified",
        "confidence": "unknown",
        "source": "raw_text_no_gemini",
    }]


# ---------------------------------------------------------------------------
# 2. Movement notes -> structured movement links
# ---------------------------------------------------------------------------
_MOVEMENT_SYSTEM_PROMPT = """You extract crowd movement patterns from an event organizer's free-text description
of how attendees move between activities/zones during the event.

Return ONLY a JSON array. Each item must have exactly these fields:
- "from_zone": the zone/area attendees are moving from (string or null)
- "to_zone": the zone/area attendees are moving to (string or null)
- "from_activity": the activity name they are leaving, if mentioned (string or null)
- "to_activity": the activity name they are heading to, if mentioned (string or null)
- "note": a short restatement of this movement in your own words

Rules:
- Only extract movements explicitly described or clearly implied by sequence.
- Do not invent zones or activities that are not named in the text.
- If nothing extractable, return [].
- Do not include any commentary, only the JSON array.
"""


def structure_movement(movement_notes: Optional[str]) -> list[dict]:
    if not movement_notes or not movement_notes.strip():
        return []

    result = _call_gemini(_MOVEMENT_SYSTEM_PROMPT, movement_notes)
    if result is None or not isinstance(result, list):
        return [{
            "from_zone": None, "to_zone": None,
            "from_activity": None, "to_activity": None,
            "note": movement_notes.strip(),
            "confidence": "unknown",
        }]

    links = []
    for item in result:
        if not isinstance(item, dict):
            continue
        links.append({
            "from_zone": item.get("from_zone"),
            "to_zone": item.get("to_zone"),
            "from_activity": item.get("from_activity"),
            "to_activity": item.get("to_activity"),
            "note": item.get("note", ""),
            "confidence": "provided",
        })
    return links


# ---------------------------------------------------------------------------
# 3. Normalize an "Other" event type into a short canonical label
# ---------------------------------------------------------------------------
def normalize_event_type(event_type: str, event_type_other: Optional[str]) -> tuple[str, Optional[str]]:
    """
    Returns (normalized_type, raw_other_text). Only touches the "other"
    case - a selected known event_type passes through untouched, no LLM
    call needed.
    """
    if event_type.lower() != "other" or not event_type_other:
        return event_type.lower(), None

    system_prompt = (
        "You normalize a free-text event type into a short lowercase snake_case label "
        "(e.g. 'community_meetup', 'religious_gathering'). "
        'Return ONLY a JSON object: {"normalized_type": "..."}. '
        "Base it strictly on the given text; do not guess unrelated details."
    )
    result = _call_gemini(system_prompt, event_type_other)
    if result and isinstance(result, dict) and result.get("normalized_type"):
        return result["normalized_type"], event_type_other
    # fallback: simple slug of the raw text
    slug = re.sub(r"[^a-z0-9]+", "_", event_type_other.lower()).strip("_") or "other"
    return slug, event_type_other


# ---------------------------------------------------------------------------
# 4. Identify missing information / ambiguities across the whole submission
# ---------------------------------------------------------------------------
_GAPS_SYSTEM_PROMPT = """You review a structured event-planning submission (given as JSON) and identify:
1. "missing_information": important fields that are null/unknown and would materially help planning
2. "ambiguities": anything contradictory or unclear in what was provided

Return ONLY a JSON object: {"missing_information": [...strings...], "ambiguities": [...strings...]}
Keep each entry short (one sentence). Do not invent facts about the event - only comment on
what is present or absent in the given JSON. If there is nothing notable, return empty arrays.
"""


def identify_gaps(structured_summary: dict) -> dict:
    result = _call_gemini(_GAPS_SYSTEM_PROMPT, json.dumps(structured_summary, default=str))
    if not result or not isinstance(result, dict):
        return {"missing_information": [], "ambiguities": []}
    return {
        "missing_information": result.get("missing_information", []) or [],
        "ambiguities": result.get("ambiguities", []) or [],
    }
