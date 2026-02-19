from sqlalchemy import Column, String, Float, Boolean, DateTime, Integer, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
from app.db.base import Base

class InferenceRecord(Base):
    __tablename__ = "inference_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    input_hash = Column(String(64), nullable=False, index=True)
    token_usage = Column(Integer, default=0)
    latency_ms = Column(Float, nullable=False)
    drift_score = Column(Float, default=0.0)
    bias_score = Column(Float, default=0.0)
    toxicity_score = Column(Float, default=0.0)
    hallucination_score = Column(Float, default=0.0)
    composite_score = Column(Float, nullable=False, index=True)
    tier = Column(String(20), nullable=False, index=True)
    pii_detected = Column(Boolean, default=False, index=True)
    triggered_rules = Column(JSONB)
    
    __table_args__ = (
        Index('idx_timestamp_tier', 'timestamp', 'tier'),
    )
