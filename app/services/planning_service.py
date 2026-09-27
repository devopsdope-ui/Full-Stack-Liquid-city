"""
Planning engine.

Takes a StructuredEventModel (built by event_model_service from the
organizer's questionnaire) and produces an OperationalPlan.

This is plain, explainable, rule-based logic - NOT an LLM call. Gemini's
job stopped at interpretation; deciding gate shares, congestion estimates,
and bottlenecks is this module's job (see the architecture diagram in the
spec: Gemini -> Structured Event Model -> Planning Engine -> Plan).

Every number this module produces can be traced back to either an
organizer-provided value or a clearly stated rule - never an invented
"AI guess" dressed up as a fact.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from app.db.supabase import get_supabase
from app.utils.calculations import calculate_crowd_status, clamp

_memory_plans: dict = {}  # plan_id -> plan dict


# ---------------------------------------------------------------------------
# Gate allocation
# ---------------------------------------------------------------------------
def _allocate_gates(entrances: list[dict], total_attendance: float, priorities: list[str]) -> list[dict]:
    if not entrances:
        return []

    equal_split_requested = "balance_entrances" in priorities
    known_capacity_entrances = [e for e in entrances if e.get("capacity")]

    if equal_split_requested or not known_capacity_entrances:
        share = 100.0 / len(entrances)
        basis = (
            "Equal split requested via 'balance_entrances' priority"
            if equal_split_requested else
            "Equal split (no entrance capacities provided)"
        )
        return [{
            "name": e["name"],
            "share_percentage": round(share, 1),
            "expected_attendance": round(total_attendance * share / 100, 0),
            "basis": basis,
        } for e in entrances]

    # Weighted by known capacity; entrances with unknown capacity split the
    # remaining share evenly among themselves.
    total_known_capacity = sum(e["capacity"] for e in known_capacity_entrances)
    unknown_entrances = [e for e in entrances if not e.get("capacity")]

    # Reserve a proportional minimum share for unknown-capacity gates so they
    # aren't silently allocated 0% just because we don't have a number.
    unknown_share_total = 15.0 if unknown_entrances else 0.0
    known_share_total = 100.0 - unknown_share_total

    result = []
    for e in known_capacity_entrances:
        share = (e["capacity"] / total_known_capacity) * known_share_total
        result.append({
            "name": e["name"],
            "share_percentage": round(share, 1),
            "expected_attendance": round(total_attendance * share / 100, 0),
            "basis": f"Weighted by stated capacity ({e['capacity']})",
        })
    if unknown_entrances:
        share_each = unknown_share_total / len(unknown_entrances)
        for e in unknown_entrances:
            result.append({
                "name": e["name"],
                "share_percentage": round(share_each, 1),
                "expected_attendance": round(total_attendance * share_each / 100, 0),
                "basis": "Reserved minimum share (capacity not provided)",
            })
    return result


# ---------------------------------------------------------------------------
# Zone / activity congestion
# ---------------------------------------------------------------------------
def _zone_capacity_lookup(zones: list[dict]) -> dict:
    return {z["name"]: z.get("capacity") for z in zones if z.get("name")}


def _estimate_zone_congestion(activities: list[dict], zones: list[dict]) -> list[dict]:
    capacity_by_zone = _zone_capacity_lookup(zones)
    estimates = []

    for a in activities:
        zone_name = a.get("zone")
        capacity = capacity_by_zone.get(zone_name) if zone_name else None
        expected = a.get("expected_attendance")

        if capacity and expected is not None:
            # Deliberately NOT clamped to 100 here - a zone at 500% of
            # capacity is materially different from one at 100%, and
            # hiding that behind a clamp would understate a real
            # overcapacity bottleneck. Status bucketing (which expects
            # 0-100) uses a capped copy just for categorization.
            occupancy = (expected / capacity) * 100
            status = calculate_crowd_status(min(occupancy, 100))
        else:
            occupancy = None
            status = "UNKNOWN_CAPACITY" if not capacity else "UNKNOWN_ATTENDANCE"

        estimates.append({
            "zone": zone_name or "unspecified",
            "activity": a.get("name"),
            "expected_attendance": expected,
            "capacity": capacity,
            "projected_occupancy_percentage": round(occupancy, 1) if occupancy is not None else None,
            "status": status,
        })

    return estimates


# ---------------------------------------------------------------------------
# Bottlenecks
# ---------------------------------------------------------------------------
def _find_bottlenecks(gate_allocation: list[dict], zone_congestion: list[dict]) -> list[dict]:
    bottlenecks = []

    for g in gate_allocation:
        if g["share_percentage"] >= 50:
            bottlenecks.append({
                "zone_or_gate": g["name"],
                "reason": f"Single entrance carrying {g['share_percentage']:.0f}% of expected attendance",
                "severity": "HIGH" if g["share_percentage"] >= 65 else "MEDIUM",
            })

    for z in zone_congestion:
        occ = z["projected_occupancy_percentage"]
        if occ is not None and occ >= 90:
            bottlenecks.append({
                "zone_or_gate": z["zone"],
                "reason": f"Projected occupancy {occ:.0f}% during '{z['activity']}'",
                "severity": "HIGH",
            })
        elif occ is not None and occ >= 80:
            bottlenecks.append({
                "zone_or_gate": z["zone"],
                "reason": f"Projected occupancy {occ:.0f}% during '{z['activity']}'",
                "severity": "MEDIUM",
            })

    return bottlenecks


# ---------------------------------------------------------------------------
# Exit flow
# ---------------------------------------------------------------------------
def _exit_flow_note(exits: dict, total_attendance: float) -> str:
    normal_count = exits.get("normal_count") or 0
    if not normal_count:
        return "No normal exit count provided - cannot estimate exit flow. Ask the organizer for at least an exit count."

    per_exit = total_attendance / normal_count
    if per_exit > 500:
        return (f"~{per_exit:.0f} attendees per normal exit at simultaneous event-end - "
                f"consider staggering the end of activities or adding exits.")
    return f"~{per_exit:.0f} attendees per normal exit at simultaneous event-end - manageable with {normal_count} exits."


# ---------------------------------------------------------------------------
# Resource demand
# ---------------------------------------------------------------------------
def _resource_demand(resources: dict, total_attendance: float) -> list[dict]:
    demand = []
    details = resources.get("details", {})

    if resources.get("food"):
        detail = details.get("food")
        demand.append({
            "resource": "food",
            "estimated_demand": detail or f"No serving capacity provided for ~{total_attendance} attendees",
            "note": "Stagger meal-linked activities if serving capacity is much lower than attendance." if not detail else None,
        })
    if resources.get("parking"):
        detail = details.get("parking")
        demand.append({
            "resource": "parking",
            "estimated_demand": detail or "No parking capacity provided",
            "note": None,
        })
    if resources.get("shuttle"):
        detail = details.get("shuttle")
        demand.append({
            "resource": "shuttle",
            "estimated_demand": detail or "No shuttle count provided",
            "note": None,
        })
    if resources.get("registration"):
        detail = details.get("registration")
        demand.append({
            "resource": "registration",
            "estimated_demand": detail or "No counter count provided",
            "note": None,
        })
    if resources.get("medical"):
        detail = details.get("medical")
        demand.append({
            "resource": "medical",
            "estimated_demand": detail or "No first-aid point count provided",
            "note": None,
        })

    return demand


# ---------------------------------------------------------------------------
# Groups
# ---------------------------------------------------------------------------
def _group_handling_note(groups: dict) -> Optional[str]:
    if not groups.get("enabled"):
        return None
    count = groups.get("count")
    size = groups.get("average_size")
    keep_together = groups.get("keep_together")

    base = f"{count or 'unknown number of'} groups, avg size {size or 'unknown'}."
    if keep_together:
        return base + " Keep-together requested: avoid splitting a group across gates/zones where feasible."
    if keep_together is False:
        return base + " Group members may be split across gates/zones if it improves flow."
    return base + " No preference stated on keeping groups together."


# ---------------------------------------------------------------------------
# Main entrypoint
# ---------------------------------------------------------------------------
def generate_plan(structured_model: dict, event_model_id: Optional[str] = None) -> dict:
    total_attendance = (
        structured_model["event"].get("expected_peak_attendance")
        or structured_model["event"]["expected_attendance"]
    )
    priorities = structured_model.get("priorities", [])

    gate_allocation = _allocate_gates(structured_model.get("entrances", []), total_attendance, priorities)
    zone_congestion = _estimate_zone_congestion(
        structured_model.get("activities", []), structured_model.get("zones", [])
    )
    bottlenecks = _find_bottlenecks(gate_allocation, zone_congestion)
    exit_flow_note = _exit_flow_note(structured_model.get("exits", {}), total_attendance)
    resource_demand = _resource_demand(structured_model.get("resources", {}), total_attendance)
    group_handling_note = _group_handling_note(structured_model.get("groups", {}))

    warnings = []
    unknown_capacity_zones = [z["name"] for z in structured_model.get("zones", []) if z.get("capacity") is None]
    if unknown_capacity_zones:
        warnings.append(f"{len(unknown_capacity_zones)} zone(s) have unknown capacity: {', '.join(unknown_capacity_zones)}")
    if not structured_model.get("entrances"):
        warnings.append("No entrances defined - gate allocation could not be computed.")
    if not gate_allocation:
        warnings.append("Gate allocation is empty.")

    return {
        "event_model_id": event_model_id,
        "gate_allocation": gate_allocation,
        "zone_congestion": zone_congestion,
        "exit_flow_note": exit_flow_note,
        "bottlenecks": bottlenecks,
        "resource_demand": resource_demand,
        "group_handling_note": group_handling_note,
        "priorities_applied": priorities,
        "warnings": warnings,
    }


def generate_and_save_plan(structured_model: dict, event_model_id: Optional[str] = None) -> dict:
    """Generates a plan and persists it (Supabase if configured, else in-memory)."""
    plan = generate_plan(structured_model, event_model_id)
    plan_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    record = {"id": plan_id, "event_model_id": event_model_id, "plan": plan, "created_at": now}

    client = get_supabase()
    if client:
        try:
            client.table("plans").insert(record).execute()
        except Exception as exc:
            print(f"[planning_service] Supabase insert failed, using in-memory store: {exc}")
            _memory_plans[plan_id] = record
    else:
        _memory_plans[plan_id] = record

    return {**plan, "plan_id": plan_id}


def get_plan(plan_id: str) -> Optional[dict]:
    client = get_supabase()
    if client:
        try:
            result = client.table("plans").select("*").eq("id", plan_id).single().execute()
            if result.data:
                return result.data
        except Exception:
            pass
    return _memory_plans.get(plan_id)


def get_latest_plan_for_event(event_model_id: str) -> Optional[dict]:
    client = get_supabase()
    if client:
        try:
            result = (
                client.table("plans")
                .select("*")
                .eq("event_model_id", event_model_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if result.data:
                return result.data[0]
        except Exception:
            pass
    matches = [p for p in _memory_plans.values() if p["event_model_id"] == event_model_id]
    return max(matches, key=lambda p: p["created_at"]) if matches else None
