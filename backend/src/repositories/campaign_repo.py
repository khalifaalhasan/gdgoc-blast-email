"""
campaign_repo.py

Repository untuk tabel campaigns.
Bertanggung jawab atas semua CRUD Campaign model.

Sebelumnya query langsung ada di route handler campaigns.py — salah tempat
karena route seharusnya hanya handle HTTP, bukan business/data logic.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from uuid import UUID
from typing import Optional, List

from src.db.models import Campaign
from src.schemas.campaign import CampaignCreate, CampaignUpdate


async def get_all_campaigns(db: AsyncSession) -> List[Campaign]:
    result = await db.execute(select(Campaign).order_by(desc(Campaign.created_at)))
    return result.scalars().all()


async def get_campaign_by_id(db: AsyncSession, campaign_id: UUID) -> Optional[Campaign]:
    result = await db.execute(select(Campaign).filter(Campaign.id == campaign_id))
    return result.scalar_one_or_none()


async def create_campaign(db: AsyncSession, data: CampaignCreate) -> Campaign:
    db_campaign = Campaign(**data.model_dump())
    db.add(db_campaign)
    await db.commit()
    await db.refresh(db_campaign)
    return db_campaign


async def update_campaign(db: AsyncSession, campaign_id: UUID, data: CampaignUpdate) -> Optional[Campaign]:
    db_campaign = await get_campaign_by_id(db, campaign_id)
    if not db_campaign:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_campaign, key, value)
    await db.commit()
    await db.refresh(db_campaign)
    return db_campaign


async def delete_campaign(db: AsyncSession, campaign_id: UUID) -> bool:
    db_campaign = await get_campaign_by_id(db, campaign_id)
    if not db_campaign:
        return False
    await db.delete(db_campaign)
    await db.commit()
    return True
