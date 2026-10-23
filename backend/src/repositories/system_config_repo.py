"""
system_config_repo.py

Repository untuk tabel system_configs.
Bertanggung jawab atas semua DB access untuk SystemConfig model.

Sebelumnya logic ini tersebar di google_auth.py (infrastructure) — ini salah tempat
karena infrastructure seharusnya tidak tahu tentang skema DB.
"""
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.db.models import SystemConfig
from src.core.config import config


def _make_sync_engine():
    """Buat sync engine dari DATABASE_URL untuk konteks yang butuh sync (worker, auth)."""
    db_url = config.DATABASE_URL
    # Pastikan pakai driver sync (psycopg2), bukan asyncpg
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


def get_system_config(key: str):
    """Ambil nilai SystemConfig berdasarkan key. Return None jika tidak ada."""
    with _get_sync_session() as db:
        record = db.query(SystemConfig).filter(SystemConfig.key == key).first()
        return record.value if record else None


def set_system_config(key: str, value: dict):
    """Simpan atau update SystemConfig. Upsert berdasarkan key."""
    with _get_sync_session() as db:
        record = db.query(SystemConfig).filter(SystemConfig.key == key).first()
        if record:
            record.value = value
        else:
            record = SystemConfig(key=key, value=value)
            db.add(record)
        db.commit()


def delete_system_config(key: str):
    """Hapus SystemConfig berdasarkan key."""
    with _get_sync_session() as db:
        record = db.query(SystemConfig).filter(SystemConfig.key == key).first()
        if record:
            db.delete(record)
            db.commit()
