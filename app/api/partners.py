from fastapi import APIRouter, HTTPException

from app.schemas.partner import Partner, PartnerCreate, PartnerUpdate
from app.services import partner_service

router = APIRouter(prefix="/partners", tags=["partners"])


@router.get("", response_model=list[Partner])
def get_partners():
    return partner_service.list_partners()


@router.get("/{partner_id}", response_model=Partner)
def get_partner(partner_id: str):
    partner = partner_service.get_partner(partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    return partner


@router.post("", response_model=Partner, status_code=201)
def create_partner(payload: PartnerCreate):
    return partner_service.create_partner(payload.model_dump())


@router.put("/{partner_id}", response_model=Partner)
def update_partner(partner_id: str, payload: PartnerUpdate):
    updated = partner_service.update_partner(partner_id, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Partner not found")
    return updated
