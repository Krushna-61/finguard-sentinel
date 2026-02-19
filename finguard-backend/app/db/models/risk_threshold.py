from sqlalchemy import Column, Float, Integer, DateTime
from datetime import datetime
from app.db.base import Base

class RiskThreshold(Base):
    __tablename__ = "risk_thresholds"
    
    id = Column(Integer, primary_key=True)
    pii_weight = Column(Float, nullable=False, default=0.40)
    toxicity_weight = Column(Float, nullable=False, default=0.25)
    bias_weight = Column(Float, nullable=False, default=0.25)
    drift_weight = Column(Float, nullable=False, default=0.20)
    hallucination_weight = Column(Float, nullable=False, default=0.20)
    latency_weight = Column(Float, nullable=False, default=0.15)
    latency_threshold_ms = Column(Float, nullable=False, default=800.0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
