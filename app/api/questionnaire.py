from fastapi import APIRouter, HTTPException

from app.schemas.questionnaire import QuestionnaireSubmission
from app.services import event_model_service

router = APIRouter(prefix="/questionnaire", tags=["questionnaire"])


@router.post("/submit")
def submit_questionnaire(payload: QuestionnaireSubmission):
    """
    Accepts the organizer's raw questionnaire answers, runs them through
    the (mostly deterministic, partly Gemini-assisted) structuring step,
    persists both the raw answers and the structured event model, and
    returns the stored record - including the structured model the
    frontend/planning UI should render next.
    """
    record = event_model_service.submit_questionnaire(payload)
    return record


@router.get("")
def list_event_models():
    return event_model_service.list_event_models()


@router.get("/{event_model_id}")
def get_event_model(event_model_id: str):
    record = event_model_service.get_event_model(event_model_id)
    if not record:
        raise HTTPException(status_code=404, detail="Event model not found")
    return record
