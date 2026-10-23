"""
email_log_repo.py

Repository untuk tabel email_logs.
Bertanggung jawab atas write dan query EmailLog.

Sebelumnya log_email_result() ada di dalam worker.py (task layer) — salah tempat
karena task seharusnya hanya orchestrate, bukan langsung akses DB.
"""
import uuid
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.db.models import EmailLog
from src.core.config import config


def _make_sync_engine():
    db_url = config.DATABASE_URL
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    if "postgresql://" in db_url and "+psycopg2" not in db_url and "+asyncpg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://")
    return create_engine(db_url, pool_pre_ping=True)


_sync_engine = None
_SyncSession = None


def _get_sync_session():
    global _sync_engine, _SyncSession
    if _sync_engine is None:
        _sync_engine = _make_sync_engine()
        _SyncSession = sessionmaker(bind=_sync_engine)
    return _SyncSession()


def log_email_result(
    task_id: str,
    campaign_id,
    nama: str,
    email: str,
    role: str,
    status: str,
    error_reason: str = None,
):
    """
    Simpan hasil pengiriman email ke tabel email_logs.
    status: 'success' | 'failed'
    """
    try:
        session = _get_sync_session()
        try:
            log = EmailLog(
                id=uuid.uuid4(),
                task_id=task_id,
                campaign_id=campaign_id,
                nama=nama,
                email=email,
                role=role,
                status=status,
                error_reason=error_reason,
                sent_at=datetime.utcnow(),
            )
            session.add(log)
            session.commit()
        except Exception as e:
            session.rollback()
            print(f"⚠️ Gagal menyimpan email log ke DB: {e}")
        finally:
            session.close()
    except Exception as e:
        print(f"⚠️ email_log_repo error (non-fatal): {e}")
