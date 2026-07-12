"""
api/routes/campaigns.py

HTTP layer untuk CRUD Campaign.
Route handler hanya: parse request → call repository → return response.
Semua query DB ada di app/repositories/campaign_repo.py.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from src.db.database import get_db
from src.repositories import campaign_repo
from src.schemas.campaign import CampaignCreate, CampaignUpdate, CampaignResponse

router = APIRouter()


@router.get("/campaigns", response_model=List[CampaignResponse])
async def get_campaigns(db: AsyncSession = Depends(get_db)):
    return await campaign_repo.get_all_campaigns(db)


@router.post("/campaigns", response_model=CampaignResponse)
async def create_campaign(campaign_in: CampaignCreate, db: AsyncSession = Depends(get_db)):
    return await campaign_repo.create_campaign(db, campaign_in)


@router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(campaign_id: UUID, db: AsyncSession = Depends(get_db)):
    db_campaign = await campaign_repo.get_campaign_by_id(db, campaign_id)
    if not db_campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return db_campaign


@router.put("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(campaign_id: UUID, campaign_in: CampaignUpdate, db: AsyncSession = Depends(get_db)):
    db_campaign = await campaign_repo.update_campaign(db, campaign_id, campaign_in)
    if not db_campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return db_campaign


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: UUID, db: AsyncSession = Depends(get_db)):
    deleted = await campaign_repo.delete_campaign(db, campaign_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"message": "Campaign deleted successfully"}
