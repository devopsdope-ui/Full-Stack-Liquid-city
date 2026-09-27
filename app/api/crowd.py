from fastapi import APIRouter, HTTPException

from app.schemas.crowd import Crowd, CrowdPrediction
from app.services import crowd_service
from app.ml.predict_crowd import ModelNotTrainedError

router = APIRouter(prefix="/crowd", tags=["crowd"])


@router.get("", response_model=list[Crowd])
def get_crowd():
    return crowd_service.list_crowd_locations()


@router.get("/{location_id}", response_model=Crowd)
def get_crowd_location(location_id: str):
    location = crowd_service.get_crowd_location(location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location


@router.get("/{location_id}/predict", response_model=CrowdPrediction)
def predict_crowd(location_id: str):
    try:
        prediction = crowd_service.predict_crowd_for_location(location_id)
    except ModelNotTrainedError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    if not prediction:
        raise HTTPException(status_code=404, detail="Location not found")
    return prediction
