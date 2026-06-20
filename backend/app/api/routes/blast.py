from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from app.services.campaign_service import CampaignService
from app.infrastructure import google_auth
from app.services import mailer_svc
from app.core.config import config

router = APIRouter()

@router.post(
    "/campaign/start",
    summary="Mulai Campaign Blast Email",
    description="Menerima file CSV dan template form, kemudian memasukkan tugas pengiriman email ke background worker (Celery) agar server tidak freeze.",
    response_description="Task ID untuk memantau progress blast email."
)
async def start_campaign(
    rows_json: str = Form(..., description="JSON string array of objects from the editable table"),
    drive_links_json: str = Form("{}", description="JSON mapping dari Role ke URL folder Google Drive (contoh: {'Participant': 'url1', 'Committee': 'url2'}). Jika hanya 1 link, kirimkan link biasa."),
    subject_template: str = Form(..., description="Subject Email, mendukung variabel seperti {{nama}}"),
    body_template: str = Form(..., description="Body Email dalam format HTML, mendukung variabel seperti {{nama}}"),
    campaign_type: str = Form("sertifikat"),
    surat_file: UploadFile = File(None)
):
    """
    Menerima data JSON table dan form template, lalu men-trigger background task Celery melalui CampaignService.
    """
    import os
    import shutil
    import tempfile
    
    surat_path = None
    if campaign_type == 'surat' and surat_file:
        tmp_dir = os.path.join(tempfile.gettempdir(), 'blast_surat')
        os.makedirs(tmp_dir, exist_ok=True)
        surat_path = os.path.join(tmp_dir, surat_file.filename)
        with open(surat_path, "wb") as buffer:
            shutil.copyfileobj(surat_file.file, buffer)

    try:
        result = CampaignService.start_campaign(
            rows_json=rows_json,
            drive_links_json=drive_links_json,
            subject_template=subject_template,
            body_template=body_template,
            campaign_type=campaign_type,
            surat_file_path=surat_path
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get(
    "/campaign/status/{task_id}",
    summary="Cek Status Campaign Blast",
    description="Mengecek persentase keberhasilan, kegagalan, dan log realtime dari Celery Task ID.",
    response_description="Status task, jumlah berhasil, jumlah gagal, dan log eksekusi."
)
async def get_campaign_status(task_id: str):
    """
    Mengecek status dari Celery task melalui CampaignService.
    """
    response, status_code = CampaignService.get_status(task_id)
    return JSONResponse(status_code=status_code, content=response)

@router.post("/campaign/test-email")
async def send_test_email(
    test_email: str = Form(...),
    subject_template: str = Form(...),
    body_template: str = Form(...)
):
    try:
        gmail_service = google_auth.get_gmail_service()
        
        # Replace variables for test
        test_name = "Testing User"
        test_role = "Participant"
        
        actual_subject = subject_template.replace('{{nama}}', test_name).replace('{{role}}', test_role)
        actual_body = body_template.replace('{{nama}}', test_name).replace('{{role}}', test_role)
        
        message = mailer_svc.create_message(
            to_email=test_email,
            subject=actual_subject,
            html_body=actual_body,
            pdf_path=None,
            sender_name=config.SENDER_NAME,
            sender_email=config.SENDER_EMAIL
        )
        
        if mailer_svc.send_email(gmail_service, message):
            return {"message": "Test email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send test email")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

