from fastapi import APIRouter, HTTPException

from app.schemas.recommendation import (
    Recommendation, RecommendationRequest, RecommendationChoiceRequest,
)
from app.services import recommendation_service

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/restaurants", response_model=list[Recommendation])
def get_restaurant_recommendations(visitor_preference: str = "balanced"):
    return recommendation_service.get_recommended_restaurants(visitor_preference=visitor_preference)


@router.post("/restaurants", response_model=list[Recommendation])
def post_restaurant_recommendations(payload: RecommendationRequest):
    return recommendation_service.get_recommended_restaurants(
        visitor_preference=payload.visitor_preference,
        price_level_max=payload.price_level_max,
        exclude_ids=payload.exclude_ids,
    )


@router.get("/routes")
def get_route_recommendations():
    return recommendation_service.get_recommended_routes()


@router.post("/routes")
def post_route_recommendations():
    # POST variant kept for symmetry with the spec; routes have no visitor
    # preference input today, so it behaves the same as GET.
    return recommendation_service.get_recommended_routes()


@router.post("/restaurants/choice")
def choose_restaurant(payload: RecommendationChoiceRequest):
    try:
        return recommendation_service.resolve_visitor_choice(
            chosen_id=payload.chosen_id, rejected_id=payload.rejected_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
