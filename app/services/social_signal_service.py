"""
Social and Public Signals Service.
Provides ingestion, normalization, and contextual query of real-time traffic disruptions,
weather warnings, road waterlogging, and public reports affecting venues and corridors.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional
from app.schemas.social_signal import SocialSignal, SocialSignalCreate

_signals_store: List[dict] = [
    {
        "id": "sig-001",
        "source": "Bangalore Traffic Police (Twitter/X Feed)",
        "type": "traffic_disruption",
        "location": "road_01",
        "severity": 0.65,
        "text": "Waterlogging reported near Central Stadium underpass on Central Avenue. Slow moving traffic.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "confidence": 0.88,
        "is_live": True,
    },
    {
        "id": "sig-002",
        "source": "IMD Regional Radar",
        "type": "weather_report",
        "location": "stadium_zone",
        "severity": 0.50,
        "text": "Scattered thundershowers approaching East zone within 30-45 minutes.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "confidence": 0.82,
        "is_live": True,
    },
    {
        "id": "sig-003",
        "source": "BMTC Transit Operations",
        "type": "transport_delay",
        "location": "shuttle_north",
        "severity": 0.40,
        "text": "North feeder shuttles experiencing 10-15m turnaround delay due to rain traffic.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "confidence": 0.79,
        "is_live": True,
    },
]


def list_signals(signal_type: Optional[str] = None, location: Optional[str] = None) -> List[SocialSignal]:
    results = []
    for s in _signals_store:
        if signal_type and s["type"] != signal_type:
            continue
        if location and location not in s["location"]:
            continue
        results.append(SocialSignal(**s))
    return results


def add_signal(data: SocialSignalCreate) -> SocialSignal:
    item = {
        "id": f"sig-{uuid.uuid4().hex[:6]}",
        "source": data.source,
        "type": data.type,
        "location": data.location,
        "severity": data.severity,
        "text": data.text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "confidence": data.confidence,
        "is_live": True,
    }
    _signals_store.insert(0, item)
    return SocialSignal(**item)


def get_location_signal_severity(location_id: str) -> float:
    """Returns aggregated severity impact [0.0, 0.3] on a given location or road."""
    matches = [s["severity"] for s in _signals_store if location_id in s["location"]]
    if not matches:
        return 0.0
    # Modest additive factor (capped at 0.25 to prevent double-counting)
    return min(0.25, sum(matches) * 0.15)
