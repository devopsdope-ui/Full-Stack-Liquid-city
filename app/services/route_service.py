"""
Route service: presents road data as named "routes" for the frontend.
"""

from app.services import road_service
from app.simulation.simulation_engine import simulation_engine


def list_routes() -> list:
    roads = road_service.list_roads()
    routes = []
    for r in roads:
        meta = simulation_engine.get_road(r["road_id"]) or {}
        routes.append({
            "route_id": r["road_id"],
            "name": r["name"],
            "distance_km": meta.get("distance_km", 0),
            "congestion": r["congestion"],
            "predicted_travel_time": r["predicted_travel_time"],
        })
    return routes
