from pydantic import BaseModel
from typing import List, Dict

class CampaignStartRequest(BaseModel):
    drive_link: str
    subject_template: str
    body_template: str
    rows: List[Dict[str, str]]
