from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from typing import Optional
from uuid import UUID

from app.db.database import get_db
from app.db.models import EmailLog

router = APIRouter()


@router.get("/history/task/{task_id}")
async def get_task_history(task_id: str, db: AsyncSession = Depends(get_db)):
    """Ambil semua email log berdasarkan task_id (1 kali blast)."""
    result = await db.execute(
        select(EmailLog)
        .where(EmailLog.task_id == task_id)
        .order_by(desc(EmailLog.sent_at))
    )
    logs = result.scalars().all()
    return [
        {
            "id": str(log.id),
            "task_id": log.task_id,
            "campaign_id": str(log.campaign_id) if log.campaign_id else None,
            "nama": log.nama,
            "email": log.email,
            "role": log.role,
            "status": log.status,
            "error_reason": log.error_reason,
            "sent_at": log.sent_at.isoformat() if log.sent_at else None,
        }
        for log in logs
    ]


@router.get("/history/campaign/{campaign_id}")
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
    logs = result.scalars().all()
    return [
        {
            "id": str(log.id),
            "task_id": log.task_id,
            "campaign_id": str(log.campaign_id) if log.campaign_id else None,
            "nama": log.nama,
            "email": log.email,
            "role": log.role,
            "status": log.status,
            "error_reason": log.error_reason,
            "sent_at": log.sent_at.isoformat() if log.sent_at else None,
        }
        for log in logs
    ]


@router.get("/history/summary/task/{task_id}")
async def get_task_summary(task_id: str, db: AsyncSession = Depends(get_db)):
    """Ringkasan cepat: total, success, failed untuk 1 task."""
    result = await db.execute(
        select(EmailLog).where(EmailLog.task_id == task_id)
    )
    logs = result.scalars().all()
    success = [l for l in logs if l.status == 'success']
    failed = [l for l in logs if l.status == 'failed']
    return {
        "task_id": task_id,
        "total": len(logs),
        "success": len(success),
        "failed": len(failed),
        "failed_detail": [
            {"nama": l.nama, "email": l.email, "error_reason": l.error_reason}
            for l in failed
        ]
    }
