from fastapi import APIRouter, HTTPException

from app.schemas.road import Road
from app.services import road_service

router = APIRouter(prefix="/roads", tags=["roads"])


@router.get("", response_model=list[Road])
def get_roads():
    return road_service.list_roads()


@router.get("/{road_id}", response_model=Road)
def get_road(road_id: str):
    road = road_service.get_road(road_id)
    if not road:
        raise HTTPException(status_code=404, detail="Road not found")
    return road
