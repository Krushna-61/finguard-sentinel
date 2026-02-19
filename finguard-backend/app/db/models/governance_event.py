from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
from app.db.base import Base

class GovernanceEvent(Base):
    __tablename__ = "governance_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inference_id = Column(UUID(as_uuid=True), ForeignKey('inference_records.id'), nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    severity = Column(String(20), nullable=False, index=True)
    action_taken = Column(String(50), nullable=False)
    event_metadata = Column(JSONB)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
