from sqlalchemy import Column, Float, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.db.base import Base

class SystemMetric(Base):
    __tablename__ = "system_metrics_v2"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    p50_latency = Column(Float, default=0.0)
    p95_latency = Column(Float, default=0.0)
    error_rate = Column(Float, default=0.0)
    throughput = Column(Float, default=0.0)
    memory_usage = Column(Float, default=0.0)
    gpu_usage = Column(Float, default=0.0)
    recorded_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
