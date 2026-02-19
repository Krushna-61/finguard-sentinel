from sqlalchemy import Column, String, DateTime, Float, Integer
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.db.base import Base

class ModelRegistry(Base):
    __tablename__ = "model_registry"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_name = Column(String(255), nullable=False)
    version = Column(String(100))
    status = Column(String(50), nullable=False, default="ACTIVE")  # ACTIVE, DEGRADED, BLOCKED, RETRAIN_REQUIRED
    last_drift_score = Column(Float, default=0.0)
    last_bias_score = Column(Float, default=0.0)
    incident_count = Column(Integer, default=0)
    last_updated = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Legacy fields
    device = Column(String(50))
    loaded_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    memory_usage_mb = Column(Float)
