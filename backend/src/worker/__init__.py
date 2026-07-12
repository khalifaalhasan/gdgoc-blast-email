"""
app/worker/__init__.py

Celery application instance.
Dipisahkan ke sini agar bisa di-import dari mana pun tanpa circular import
dan tidak lagi bergantung pada worker.py di root directory.
"""
from celery import Celery
from src.core.config import config

celery_app = Celery(
    'blast_tasks',
    broker=config.REDIS_URL,
    backend=config.REDIS_URL,
)

celery_app.conf.update(
    result_expires=3600,
)
