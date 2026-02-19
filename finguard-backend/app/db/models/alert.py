from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
from app.db.base import Base

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String(100), nullable=False, index=True)
    payload = Column(JSONB, nullable=False)
    delivered = Column(Boolean, default=False, nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
