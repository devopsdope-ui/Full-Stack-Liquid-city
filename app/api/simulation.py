from fastapi import APIRouter, HTTPException

from app.schemas.simulation import (
    SimulationState, SetAttendanceRequest, CrowdSurgeRequest,
    TrafficJamRequest, RestaurantOccupancyRequest,
)
from app.services import simulation_service

router = APIRouter(prefix="/simulation", tags=["simulation"])


@router.post("/start", response_model=SimulationState)
def start_simulation():
    return simulation_service.start()


@router.post("/pause", response_model=SimulationState)
def pause_simulation():
    return simulation_service.pause()


@router.post("/reset", response_model=SimulationState)
def reset_simulation():
    return simulation_service.reset()


@router.get("/status", response_model=SimulationState)
def simulation_status():
    return simulation_service.status()


@router.post("/crowd-surge", response_model=SimulationState)
def crowd_surge(payload: CrowdSurgeRequest):
    try:
        return simulation_service.crowd_surge(payload.location_id, payload.amount)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/event-end", response_model=SimulationState)
def event_end():
    return simulation_service.event_end()


@router.post("/traffic-jam", response_model=SimulationState)
def traffic_jam(payload: TrafficJamRequest):
    try:
        return simulation_service.traffic_jam(payload.road_id, payload.amount)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/restaurant-occupancy", response_model=SimulationState)
def restaurant_occupancy(payload: RestaurantOccupancyRequest):
    try:
        return simulation_service.set_restaurant_occupancy(payload.partner_id, payload.occupancy)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/set-attendance", response_model=SimulationState)
def set_attendance(payload: SetAttendanceRequest):
    try:
        return simulation_service.set_attendance(payload.event_attendance)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
