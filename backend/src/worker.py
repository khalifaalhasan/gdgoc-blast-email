"""
worker.py (root)

SHIM FILE — jangan hapus file ini, dibutuhkan oleh perintah Celery di Makefile/Docker:
    celery -A worker worker --loglevel=info

File ini hanya meneruskan celery_app dan task dari app/worker/ package.
Semua logic sudah dipindah ke:
  - app/worker/__init__.py  → Celery app instance
  - app/worker/tasks.py     → blast_email_task
"""
from src.worker import celery_app  # noqa: F401  (dibutuhkan Celery auto-discovery)
from src.worker.tasks import blast_email_task  # noqa: F401
