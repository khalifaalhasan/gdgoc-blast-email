"""
api/routes/blast.py

HTTP layer untuk trigger campaign blast dan cek status.
Route handler hanya: parse request → save temp files → call service → return response.

File I/O (simpan surat upload) tetap di sini karena bersifat request-scoped,
namun dipisahkan ke blok yang jelas.
"""
import os
import shutil
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import List

from src.services.campaign_service import CampaignService
from src.infrastructure import google_auth
from src.infrastructure import gmail_adapter
from src.core.config import config

router = APIRouter()


@router.post(
    "/campaign/start",
    summary="Mulai Campaign Blast Email",
    description="Menerima data CSV dan template, kemudian memasukkan tugas ke background worker (Celery).",
    response_description="Task ID untuk memantau progress blast email.",
)
async def start_campaign(
    rows_json: str = Form(...),
    drive_links_json: str = Form("{}"),
    subject_template: str = Form(...),
    body_template: str = Form(...),
    campaign_type: str = Form("sertifikat"),
    campaign_id: str = Form(...),
    surat_files: List[UploadFile] = File(default=[]),
):
    # Simpan file upload surat ke temp dir, buat mapping nama → path
    surat_files_map = {}
    if campaign_type == 'surat' and surat_files:
        tmp_dir = os.path.join(tempfile.gettempdir(), 'blast_surat')
        os.makedirs(tmp_dir, exist_ok=True)
        for f in surat_files:
            if f.filename:
                save_path = os.path.join(tmp_dir, f.filename)
                with open(save_path, "wb") as buffer:
                    shutil.copyfileobj(f.file, buffer)
                name_key = os.path.splitext(f.filename)[0].strip().lower()
                surat_files_map[name_key] = save_path

    try:
        result = CampaignService.start_campaign(
            rows_json=rows_json,
            drive_links_json=drive_links_json,
            subject_template=subject_template,
            body_template=body_template,
            campaign_type=campaign_type,
            campaign_id=campaign_id,
            surat_files_map=surat_files_map if surat_files_map else None,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/campaign/status/{task_id}",
    summary="Cek Status Campaign Blast",
    description="Mengecek progress, keberhasilan, kegagalan, dan log realtime dari Celery Task ID.",
)
async def get_campaign_status(task_id: str):
    response, status_code = CampaignService.get_status(task_id)
    return JSONResponse(status_code=status_code, content=response)


@router.post("/campaign/test-email")
async def send_test_email(
    test_email: str = Form(...),
    subject_template: str = Form(...),
    body_template: str = Form(...),
):
    try:
        gmail_service = google_auth.get_gmail_service()

        actual_subject = subject_template.replace('{{nama}}', 'Testing User').replace('{{role}}', 'Participant')
        actual_body = body_template.replace('{{nama}}', 'Testing User').replace('{{role}}', 'Participant')

        message = gmail_adapter.create_message(
            to_email=test_email,
            subject=actual_subject,
            html_body=actual_body,
            pdf_path=None,
            sender_name=config.SENDER_NAME,
            sender_email=config.SENDER_EMAIL,
        )

        if gmail_adapter.send_email(gmail_service, message):
            return {"message": "Test email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send test email")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
