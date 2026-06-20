from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from uuid import UUID
from typing import List

from app.db.database import get_db
from app.db.models import Campaign
from app.schemas.campaign import CampaignCreate, CampaignUpdate, CampaignResponse

router = APIRouter()

@router.get("/campaigns", response_model=List[CampaignResponse])
async def get_campaigns(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).order_by(desc(Campaign.created_at)))
    campaigns = result.scalars().all()
    return campaigns

@router.post("/campaigns", response_model=CampaignResponse)
async def create_campaign(campaign_in: CampaignCreate, db: AsyncSession = Depends(get_db)):
    db_campaign = Campaign(**campaign_in.model_dump())
    db.add(db_campaign)
    await db.commit()
    await db.refresh(db_campaign)
    return db_campaign

@router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(campaign_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).filter(Campaign.id == campaign_id))
    db_campaign = result.scalar_one_or_none()
    if not db_campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return db_campaign

@router.put("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(campaign_id: UUID, campaign_in: CampaignUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).filter(Campaign.id == campaign_id))
    db_campaign = result.scalar_one_or_none()
    if not db_campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    update_data = campaign_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_campaign, key, value)
        
    await db.commit()
    await db.refresh(db_campaign)
    return db_campaign

@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).filter(Campaign.id == campaign_id))
    db_campaign = result.scalar_one_or_none()
    if not db_campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    await db.delete(db_campaign)
    await db.commit()
    return {"message": "Campaign deleted successfully"}
