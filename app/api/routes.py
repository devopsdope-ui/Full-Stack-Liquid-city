from fastapi import APIRouter, HTTPException

from app.schemas.road import RoutePredictionRequest, RoutePredictionResponse
from app.schemas.route import RouteOption
from app.services import route_service, road_service
from app.ml.predict_travel_time import ModelNotTrainedError

router = APIRouter(prefix="/routes", tags=["routes"])


@router.get("", response_model=list[RouteOption])
def get_routes():
    return route_service.list_routes()


@router.post("/predict", response_model=RoutePredictionResponse)
def predict_route(payload: RoutePredictionRequest):
    try:
        return road_service.predict_route(**payload.model_dump())
    except ModelNotTrainedError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
