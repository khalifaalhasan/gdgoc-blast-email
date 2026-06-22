import json
import io
from celery.result import AsyncResult
from worker import blast_email_task, celery_app

class CampaignService:
    @staticmethod
    def start_campaign(rows_json: str, drive_links_json: str, subject_template: str, body_template: str, campaign_type: str = "sertifikat", campaign_id: str = None, surat_files_map: dict = None):
        try:
            rows = json.loads(rows_json)
        except Exception as e:
            raise ValueError(f"Gagal memparsing JSON table: {str(e)}")

        if not rows:
            raise ValueError("CSV kosong")

        task = blast_email_task.delay(rows, drive_links_json, subject_template, body_template, campaign_type, surat_files_map, campaign_id=campaign_id)

        return {
            "message": "Campaign berhasil dimulai di background",
            "task_id": task.id,
            "total_recipients": len(rows)
        }

    @staticmethod
    def get_status(task_id: str):
        task = AsyncResult(task_id, app=celery_app)
        
        if task.state == 'PENDING':
            return {"state": task.state, "status": "Task sedang mengantre..."}, 200
        elif task.state != 'FAILURE':
            response = {
                "state": task.state,
                "progress": task.info.get('processed', 0) if isinstance(task.info, dict) else 0,
                "total": task.info.get('total', 0) if isinstance(task.info, dict) else 0,
                "success": task.info.get('success', 0) if isinstance(task.info, dict) else 0,
                "fail": task.info.get('fail', 0) if isinstance(task.info, dict) else 0,
                "logs": task.info.get('logs', []) if isinstance(task.info, dict) else []
            }
            if task.state == 'SUCCESS':
                if isinstance(task.info, dict):
                    is_fatal = task.info.get('status') == 'Failed'
                    is_all_failed = task.info.get('fail', 0) > 0 and task.info.get('success', 0) == 0
                    
                    if is_fatal or is_all_failed:
                        response['status'] = "Gagal"
                        return response, 400
                
                response['status'] = "Selesai"
            return response, 200
        else:
            return {
                "state": task.state,
                "status": "Gagal",
                "error_detail": str(task.info),
                "logs": getattr(task.info, 'logs', []) if hasattr(task.info, 'logs') else []
            }, 500
