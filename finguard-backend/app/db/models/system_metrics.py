from sqlalchemy import Column, Float, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.db.base import Base

class SystemMetrics(Base):
    __tablename__ = "system_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    avg_latency = Column(Float, default=0.0)
    avg_drift = Column(Float, default=0.0)
    avg_bias = Column(Float, default=0.0)
    avg_toxicity = Column(Float, default=0.0)
    avg_hallucination = Column(Float, default=0.0)
    total_inference_count = Column(Integer, default=0)
