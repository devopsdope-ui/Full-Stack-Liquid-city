"""
Partner service: exposes restaurants/parking/shuttle partners.

Reads/writes live in the simulation engine for the demo (so admin actions
immediately show up here), but creating brand-new partners is treated as
"pass-through to Supabase if available" since that's a permanent catalog
change rather than a live simulation update.
"""

import uuid
from typing import Optional

from app.db.supabase import get_supabase
from app.simulation.simulation_engine import simulation_engine

_extra_partners: dict = {}  # partners created via POST that aren't part of the sim defaults


def list_partners() -> list:
    status = simulation_engine.status()
    partners = []
    for pid, p in status["partners"].items():
        partners.append({"id": pid, **p, "capacity": 100})
    for pid, p in _extra_partners.items():
        partners.append({"id": pid, **p})
    return partners


def get_partner(partner_id: str) -> Optional[dict]:
    for p in list_partners():
        if p["id"] == partner_id:
            return p
    return None


def create_partner(data: dict) -> dict:
    partner_id = str(uuid.uuid4())
    partner = {"id": partner_id, **data}

    client = get_supabase()
    if client:
        try:
            client.table("partners").insert(partner).execute()
        except Exception:
            pass

    _extra_partners[partner_id] = data
    return partner


def update_partner(partner_id: str, data: dict) -> Optional[dict]:
    # Simulation-managed partners: route occupancy updates through the engine
    # so risk/prediction stays consistent with the rest of the demo.
    if partner_id in simulation_engine.status()["partners"]:
        if data.get("occupancy") is not None:
            simulation_engine.set_restaurant_occupancy(partner_id, data["occupancy"])
        return get_partner(partner_id)

    if partner_id not in _extra_partners:
        return None
    _extra_partners[partner_id].update({k: v for k, v in data.items() if v is not None})
    return {"id": partner_id, **_extra_partners[partner_id]}
