from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from app.services.campaign_service import CampaignService

router = APIRouter()

@router.post(
    "/campaign/start",
    summary="Mulai Campaign Blast Email",
    description="Menerima file CSV dan template form, kemudian memasukkan tugas pengiriman email ke background worker (Celery) agar server tidak freeze.",
    response_description="Task ID untuk memantau progress blast email."
)
async def start_campaign(
    rows_json: str = Form(..., description="JSON string array of objects from the editable table"),
    drive_links_json: str = Form(..., description="JSON mapping dari Role ke URL folder Google Drive (contoh: {'Participant': 'url1', 'Committee': 'url2'}). Jika hanya 1 link, kirimkan link biasa."),
    subject_template: str = Form(..., description="Subject Email, mendukung variabel seperti {{nama}}"),
    body_template: str = Form(..., description="Body Email dalam format HTML, mendukung variabel seperti {{nama}}")
):
    """
    Menerima data JSON table dan form template, lalu men-trigger background task Celery melalui CampaignService.
    """
    try:
        result = CampaignService.start_campaign(
            rows_json=rows_json,
            drive_links_json=drive_links_json,
            subject_template=subject_template,
            body_template=body_template
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

