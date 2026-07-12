"""
api/routes/history.py

HTTP layer untuk query email history/log.
Route handler hanya: parse request → query repo → return response schema.
Manual dict serialization diganti dengan Pydantic response_model.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from typing import Optional, List
from uuid import UUID

from src.db.database import get_db
from src.db.models import EmailLog
from src.schemas.email_log import EmailLogResponse, TaskSummaryResponse

router = APIRouter()


@router.get("/history/task/{task_id}", response_model=List[EmailLogResponse])
async def get_task_history(task_id: str, db: AsyncSession = Depends(get_db)):
    """Ambil semua email log berdasarkan task_id (1 kali blast)."""
    result = await db.execute(
        select(EmailLog)
        .where(EmailLog.task_id == task_id)
        .order_by(desc(EmailLog.sent_at))
    )
    return result.scalars().all()


@router.get("/history/campaign/{campaign_id}", response_model=List[EmailLogResponse])
async def get_campaign_history(
    campaign_id: UUID,
    status: Optional[str] = Query(None, description="Filter by status: 'success' or 'failed'"),
    db: AsyncSession = Depends(get_db),
):
    """Ambil semua email log berdasarkan campaign_id, opsional filter by status."""
    query = select(EmailLog).where(EmailLog.campaign_id == campaign_id)
    if status:
        query = query.where(EmailLog.status == status)
    query = query.order_by(desc(EmailLog.sent_at))
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/history/summary/task/{task_id}", response_model=TaskSummaryResponse)
async def get_task_summary(task_id: str, db: AsyncSession = Depends(get_db)):
    """Ringkasan cepat: total, success, failed untuk 1 task."""
    result = await db.execute(select(EmailLog).where(EmailLog.task_id == task_id))
    logs = result.scalars().all()
    success = [l for l in logs if l.status == 'success']
    failed  = [l for l in logs if l.status == 'failed']
    return TaskSummaryResponse(
        task_id=task_id,
        total=len(logs),
        success=len(success),
        failed=len(failed),
        failed_detail=[
            {"nama": l.nama, "email": l.email, "error_reason": l.error_reason}
            for l in failed
        ],
    )
