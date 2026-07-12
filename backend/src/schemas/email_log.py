"""
app/schemas/email_log.py

Pydantic schemas untuk response EmailLog.
Sebelumnya history.py melakukan manual dict serialization langsung di route — hal ini
membuat route handler susah dibaca dan tidak reusable.
"""
from pydantic import BaseModel, UUID4
from typing import Optional
from datetime import datetime


class EmailLogResponse(BaseModel):
    id: UUID4
    task_id: str
    campaign_id: Optional[UUID4] = None
    nama: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    status: str
    error_reason: Optional[str] = None
    sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TaskSummaryResponse(BaseModel):
    task_id: str
    total: int
    success: int
    failed: int
    failed_detail: list
