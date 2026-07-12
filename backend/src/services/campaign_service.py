"""
services/campaign_service.py

Business logic untuk campaign blast:
- Dispatch task ke Celery worker
- Query status task dari Redis via Celery AsyncResult

Import dari app.worker (bukan root worker.py) agar struktur package tetap bersih.
"""
import json
from celery.result import AsyncResult
from src.worker import celery_app
from src.worker.tasks import blast_email_task


class CampaignService:

    @staticmethod
    def start_campaign(
        rows_json: str,
        drive_links_json: str,
        subject_template: str,
        body_template: str,
        campaign_type: str = "sertifikat",
        campaign_id: str = None,
        surat_files_map: dict = None,
    ):
        try:
            rows = json.loads(rows_json)
        except Exception as e:
            raise ValueError(f"Gagal memparsing JSON rows: {str(e)}")

        if not rows:
            raise ValueError("CSV kosong")

        task = blast_email_task.delay(
            rows,
            drive_links_json,
            subject_template,
            body_template,
            campaign_type,
            surat_files_map,
            campaign_id=campaign_id,
        )

        return {
            "message": "Campaign berhasil dimulai di background",
            "task_id": task.id,
            "total_recipients": len(rows),
        }

    @staticmethod
    def get_status(task_id: str):
        task = AsyncResult(task_id, app=celery_app)

        if task.state == 'PENDING':
            return {"state": task.state, "status": "Task sedang mengantre..."}, 200

        if task.state != 'FAILURE':
            info = task.info if isinstance(task.info, dict) else {}
            response = {
                "state": task.state,
                "progress": info.get('processed', 0),
                "total": info.get('total', 0),
                "success": info.get('success', 0),
                "fail": info.get('fail', 0),
                "logs": info.get('logs', []),
            }
            if task.state == 'SUCCESS':
                is_fatal    = info.get('status') == 'Failed'
                is_all_fail = info.get('fail', 0) > 0 and info.get('success', 0) == 0
                if is_fatal or is_all_fail:
                    response['status'] = "Gagal"
                    return response, 400
                response['status'] = "Selesai"
            return response, 200

        return {
            "state": task.state,
            "status": "Gagal",
            "error_detail": str(task.info),
            "logs": getattr(task.info, 'logs', []) if hasattr(task.info, 'logs') else [],
        }, 500
