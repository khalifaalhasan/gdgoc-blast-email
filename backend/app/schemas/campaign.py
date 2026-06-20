from pydantic import BaseModel, UUID4
from typing import Optional, List, Dict, Any
from datetime import datetime

class CampaignBase(BaseModel):
    name: str
    subject_template: Optional[str] = None
    body_template: Optional[str] = None
    theme_color: Optional[str] = "blue"
    drive_links: Optional[Dict[str, str]] = {}
    csv_data: Optional[List[Dict[str, Any]]] = []

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(CampaignBase):
    name: Optional[str] = None

class CampaignResponse(CampaignBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
