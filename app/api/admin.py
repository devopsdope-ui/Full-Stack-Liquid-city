from fastapi import APIRouter, HTTPException

from app.schemas.simulation import (
    SimulationState, SetAttendanceRequest, CrowdSurgeRequest,
    TrafficJamRequest, RestaurantOccupancyRequest,
)
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/simulation/start", response_model=SimulationState)
def start_simulation():
    return admin_service.start_simulation()


@router.post("/simulation/pause", response_model=SimulationState)
def pause_simulation():
    return admin_service.pause_simulation()


@router.post("/simulation/reset", response_model=SimulationState)
def reset_simulation():
    return admin_service.reset_simulation()


@router.get("/simulation/status", response_model=SimulationState)
def simulation_status():
    return admin_service.get_status()


@router.post("/simulation/crowd-surge", response_model=SimulationState)
def crowd_surge(payload: CrowdSurgeRequest):
    try:
        return admin_service.trigger_crowd_surge(payload.location_id, payload.amount)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/simulation/event-end", response_model=SimulationState)
def event_end():
    return admin_service.trigger_event_end()


@router.post("/simulation/traffic-jam", response_model=SimulationState)
def traffic_jam(payload: TrafficJamRequest):
    try:
        return admin_service.trigger_traffic_jam(payload.road_id, payload.amount)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/simulation/set-attendance", response_model=SimulationState)
def set_attendance(payload: SetAttendanceRequest):
    try:
        return admin_service.set_attendance(payload.event_attendance)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/simulation/restaurant-occupancy", response_model=SimulationState)
def restaurant_occupancy(payload: RestaurantOccupancyRequest):
    try:
        return admin_service.set_restaurant_occupancy(payload.partner_id, payload.occupancy)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
