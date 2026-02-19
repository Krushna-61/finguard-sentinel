from sqlalchemy import Column, String, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
from app.db.base import Base

class AuditEvent(Base):
    __tablename__ = "audit_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    event_metadata = Column(JSONB)
