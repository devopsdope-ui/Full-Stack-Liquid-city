from fastapi import APIRouter, HTTPException

from app.services import event_model_service, planning_service

router = APIRouter(prefix="/planning", tags=["planning"])


@router.post("/{event_model_id}/generate")
def generate_plan(event_model_id: str):
    """
    Runs the planning engine over an already-submitted event model and
    persists the resulting operational plan.
    """
    record = event_model_service.get_event_model(event_model_id)
    if not record:
        raise HTTPException(status_code=404, detail="Event model not found")

    structured_model = record["structured_model"] if isinstance(record, dict) else record.structured_model
    plan = planning_service.generate_and_save_plan(structured_model, event_model_id=event_model_id)
    return plan


@router.get("/{event_model_id}")
def get_latest_plan(event_model_id: str):
    plan = planning_service.get_latest_plan_for_event(event_model_id)
    if not plan:
        raise HTTPException(status_code=404, detail="No plan found for this event model yet")
    return plan


@router.get("/by-plan-id/{plan_id}")
def get_plan(plan_id: str):
    plan = planning_service.get_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan
