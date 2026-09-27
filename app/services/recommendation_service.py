"""
Recommendation service: the heart of the "smart suggestion" feature.

Responsibilities (Rule 4: ML predicts/ranks, business logic decides):
 1. Gather live partner options from the simulation.
 2. Get ML crowd predictions per option (best-effort).
 3. Get ML travel-time predictions for the routes leading to each option.
 4. Ask the ML recommendation model to score each option.
 5. Rank options; NEVER force a choice - always allow accept/reject/pick-own.

The visitor-choice endpoints intentionally never reject a valid partner_id -
if you want a crowded place, you can have it, we just tell you what to
expect (Rule: "does not force users to follow recommendations").
"""

from typing import Optional

from app.simulation.simulation_engine import simulation_engine
from app.ml.recommend import rank_options
from app.ml.predict_crowd import predict_future_crowd, ModelNotTrainedError as CrowdModelNotTrained
from app.ml.predict_travel_time import predict_travel_time, ModelNotTrainedError as TravelModelNotTrained
from app.services import crowd_service


# Which road roughly serves which partner, for a rough travel-time estimate.
# In a real system this would come from an actual routing/geo service.
_PARTNER_ROAD = {
    "restaurant_a": "central_road",
    "restaurant_b": "central_road",
    "restaurant_c": "north_road",
    "parking_north": "north_road",
    "shuttle_north": "north_road",
}


def _predicted_crowd_for(partner_id: str, occupancy: float) -> float:
    try:
        prediction = crowd_service.predict_crowd_for_location(partner_id)
        if prediction:
            return prediction["predicted_15_min"]
    except CrowdModelNotTrained:
        pass
    return occupancy  # fallback: assume it stays roughly the same


def _predicted_travel_time_for(partner_id: str) -> Optional[float]:
    status = simulation_engine.status()
    road_id = _PARTNER_ROAD.get(partner_id)
    if not road_id or road_id not in status["roads_meta"]:
        return None
    meta = status["roads_meta"][road_id]
    congestion = status["road_congestion"][road_id]
    try:
        return round(predict_travel_time(
            distance_km=meta["distance_km"],
            normal_travel_time=(meta["distance_km"] / meta["average_speed"]) * 60,
            congestion=congestion,
            nearby_crowd=status["stadium_crowd"],
            event_attendance=status["event_attendance"],
            road_capacity=meta["road_capacity"],
            average_speed=meta["average_speed"],
        ), 1)
    except TravelModelNotTrained:
        return None


def _build_reason(option: dict) -> str:
    parts = []
    if option["occupancy"] < 60:
        parts.append("Low crowd")
    elif option["occupancy"] < 80:
        parts.append("Moderate crowd")
    else:
        parts.append("High crowd")

    parts.append(f"{option['waiting_time']:.0f} min estimated wait")

    offer = option.get("offer_discount", 0)
    if offer > 0:
        parts.append(f"₹{offer:.0f} offer")

    if option.get("predicted_travel_time") is not None:
        parts.append(f"{option['predicted_travel_time']:.0f} min predicted travel time")

    return "Recommended because: " + ", ".join(parts)


def get_recommended_restaurants(visitor_preference: str = "balanced",
                                 price_level_max: Optional[int] = None,
                                 exclude_ids: Optional[list] = None) -> list:
    exclude_ids = exclude_ids or []
    status = simulation_engine.status()

    options = []
    for pid, p in status["partners"].items():
        if p["type"] != "restaurant":
            continue
        if pid in exclude_ids:
            continue
        if price_level_max is not None and p.get("price_level", 2) > price_level_max:
            continue

        predicted_crowd = _predicted_crowd_for(pid, p["occupancy"])
        predicted_travel_time = _predicted_travel_time_for(pid)

        options.append({
            "id": pid,
            "name": p["name"],
            "type": p["type"],
            "occupancy": p["occupancy"],
            "waiting_time": p["waiting_time"],
            "distance": p["distance"],
            "rating": p["rating"],
            "offer_discount": p["offer_discount"],
            "price_level": p.get("price_level", 2),
            "predicted_crowd": predicted_crowd,
            "predicted_travel_time": predicted_travel_time,
        })

    ranked = rank_options(options, visitor_preference=visitor_preference)

    return [
        {
            "id": o["id"],
            "name": o["name"],
            "type": o["type"],
            "score": o["score"],
            "distance": o["distance"],
            "occupancy": o["occupancy"],
            "waiting_time": o["waiting_time"],
            "predicted_crowd": round(o["predicted_crowd"], 1),
            "predicted_travel_time": o["predicted_travel_time"],
            "reason": _build_reason(o),
        }
        for o in ranked
    ]


def get_recommended_routes() -> list:
    """Rank roads/routes by predicted travel time (lower is better)."""
    status = simulation_engine.status()
    options = []
    for road_id, meta in status["roads_meta"].items():
        congestion = status["road_congestion"][road_id]
        try:
            predicted = predict_travel_time(
                distance_km=meta["distance_km"],
                normal_travel_time=(meta["distance_km"] / meta["average_speed"]) * 60,
                congestion=congestion,
                nearby_crowd=status["stadium_crowd"],
                event_attendance=status["event_attendance"],
                road_capacity=meta["road_capacity"],
                average_speed=meta["average_speed"],
            )
        except TravelModelNotTrained:
            predicted = (meta["distance_km"] / meta["average_speed"]) * 60

        options.append({
            "route_id": road_id,
            "name": meta["name"],
            "distance_km": meta["distance_km"],
            "congestion": round(congestion, 1),
            "predicted_travel_time": round(predicted, 1),
        })

    # Lower predicted travel time = better, regardless of raw distance -
    # this is the "shortest distance isn't always best" requirement.
    return sorted(options, key=lambda o: o["predicted_travel_time"])


def resolve_visitor_choice(chosen_id: Optional[str] = None, rejected_id: Optional[str] = None,
                            visitor_preference: str = "balanced") -> dict:
    """
    Handle a visitor's response to a recommendation.

    - If `chosen_id` is given: always allow it (even if crowded), and return
      its current + predicted conditions so the visitor can decide with
      full information.
    - If `rejected_id` is given: return the next best option, excluding it.
    """
    if chosen_id:
        options = get_recommended_restaurants(visitor_preference=visitor_preference)
        chosen = next((o for o in options if o["id"] == chosen_id), None)
        if not chosen:
            raise ValueError(f"Unknown option id: {chosen_id}")
        return {"decision": "accepted", "choice": chosen}

    if rejected_id:
        options = get_recommended_restaurants(
            visitor_preference=visitor_preference, exclude_ids=[rejected_id]
        )
        if not options:
            return {"decision": "rejected", "next_option": None}
        return {"decision": "rejected", "next_option": options[0]}

    raise ValueError("Either chosen_id or rejected_id must be provided")
