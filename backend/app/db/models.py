import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON
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
