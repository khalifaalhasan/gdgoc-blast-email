import subprocess
import sys


def test_worker_app_registers_blast_task():
    # Proses baru = kondisi sama dengan `celery -A src.worker.celery_app worker`,
    # yang hanya meng-import src.worker (bukan src.worker.tasks) lalu memuat modul `include`.
    code = (
        "from src.worker import celery_app;"
        "celery_app.loader.import_default_modules();"
        "print('src.worker.tasks.blast_email_task' in celery_app.tasks)"
    )
    out = subprocess.run([sys.executable, '-c', code], capture_output=True, text=True, check=True)
    assert out.stdout.strip() == 'True'
