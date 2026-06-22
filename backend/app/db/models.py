import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.db.database import Base

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True, nullable=False)
    subject_template = Column(String, nullable=True)
    body_template = Column(Text, nullable=True)
    theme_color = Column(String, default="blue")
    
    # Store arbitrary JSON configs
    drive_links = Column(JSON, default={})
    csv_data = Column(JSON, default=[])

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TaskHistory(Base):
    __tablename__ = "task_histories"

    id = Column(String, primary_key=True) # Celery Task ID
    campaign_id = Column(UUID(as_uuid=True), nullable=True)
    status = Column(String, default="PENDING")
    total = Column(String, default="0")
    success = Column(String, default="0")
    fail = Column(String, default="0")
    logs = Column(JSON, default=[])

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EmailLog(Base):
    """Per-recipient send log. Enables history per campaign and resend tracking."""
    __tablename__ = "email_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(String, nullable=False, index=True)  # Celery Task ID
    campaign_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    # Recipient info
    nama = Column(String, nullable=True)
    email = Column(String, nullable=True)
    role = Column(String, nullable=True)

    # Result
    status = Column(String, nullable=False)  # 'success' | 'failed'
    error_reason = Column(Text, nullable=True)  # null jika sukses

    sent_at = Column(DateTime, default=datetime.utcnow)

class SystemConfig(Base):
    """Stores system-wide configurations, e.g., google_oauth_token"""
    __tablename__ = "system_configs"

    key = Column(String, primary_key=True)  # e.g., "google_token"
    value = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

